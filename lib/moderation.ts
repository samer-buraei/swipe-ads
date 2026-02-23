// lib/moderation.ts
// Content moderation utilities
// Uses OpenAI Moderation API for text, Sightengine for images

import { MODERATION } from './constants';
import type { ModerationResult } from '@/contracts/api';

// ============================================================================
// TEXT MODERATION (OpenAI)
// ============================================================================

interface OpenAIModerationResponse {
  results: Array<{
    flagged: boolean;
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
  }>;
}

/**
 * Moderate text content using OpenAI's Moderation API
 * Free tier, fast, good for Serbian + English
 */
export async function moderateText(text: string): Promise<ModerationResult> {
  // Skip if no API key (dev mode)
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[Moderation] No OpenAI API key, skipping text moderation');
    return { isApproved: true, score: 0, flags: [] };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      console.error('[Moderation] OpenAI API error:', response.status);
      // Fail open - allow content if API fails
      return { isApproved: true, score: 0, flags: ['api_error'] };
    }

    const data: OpenAIModerationResponse = await response.json();
    const result = data.results[0];

    // Calculate overall score (max of all category scores)
    const scores = Object.values(result.category_scores);
    const maxScore = Math.max(...scores);

    // Get flagged categories
    const flags = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);

    return {
      isApproved: !result.flagged && maxScore < MODERATION.TEXT_THRESHOLD,
      score: maxScore,
      flags,
      details: result.category_scores,
    };
  } catch (error) {
    console.error('[Moderation] Text moderation error:', error);
    return { isApproved: true, score: 0, flags: ['error'] };
  }
}

// ============================================================================
// IMAGE MODERATION (Sightengine)
// ============================================================================

interface SightengineResponse {
  status: string;
  nudity?: {
    sexual_activity: number;
    sexual_display: number;
    erotica: number;
    sextoy: number;
    suggestive: number;
    safe: number;
  };
  weapon?: number;
  alcohol?: number;
  drugs?: number;
  offensive?: {
    prob: number;
  };
}

/**
 * Moderate image content using Sightengine
 * Paid API (~$0.0005/image), very accurate
 */
export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  // Skip if no API key (dev mode)
  if (!process.env.SIGHTENGINE_USER || !process.env.SIGHTENGINE_SECRET) {
    console.warn('[Moderation] No Sightengine credentials, skipping image moderation');
    return { isApproved: true, score: 0, flags: [] };
  }

  try {
    const params = new URLSearchParams({
      url: imageUrl,
      models: 'nudity-2.0,weapon,alcohol,drugs,offensive',
      api_user: process.env.SIGHTENGINE_USER,
      api_secret: process.env.SIGHTENGINE_SECRET,
    });

    const response = await fetch(
      `https://api.sightengine.com/1.0/check.json?${params}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error('[Moderation] Sightengine API error:', response.status);
      return { isApproved: true, score: 0, flags: ['api_error'] };
    }

    const data: SightengineResponse = await response.json();

    if (data.status !== 'success') {
      console.error('[Moderation] Sightengine returned error:', data);
      return { isApproved: true, score: 0, flags: ['api_error'] };
    }

    const flags: string[] = [];
    let maxScore = 0;

    // Check nudity
    if (data.nudity) {
      const nudityScore = Math.max(
        data.nudity.sexual_activity,
        data.nudity.sexual_display,
        data.nudity.erotica
      );
      if (nudityScore > MODERATION.NUDITY_THRESHOLD) {
        flags.push('nudity');
      }
      maxScore = Math.max(maxScore, nudityScore);
    }

    // Check weapons
    if (data.weapon !== undefined) {
      if (data.weapon > MODERATION.WEAPON_THRESHOLD) {
        flags.push('weapon');
      }
      maxScore = Math.max(maxScore, data.weapon);
    }

    // Check drugs
    if (data.drugs !== undefined) {
      if (data.drugs > MODERATION.DRUG_THRESHOLD) {
        flags.push('drugs');
      }
      maxScore = Math.max(maxScore, data.drugs);
    }

    // Check offensive
    if (data.offensive?.prob !== undefined) {
      if (data.offensive.prob > 0.5) {
        flags.push('offensive');
      }
      maxScore = Math.max(maxScore, data.offensive.prob);
    }

    return {
      isApproved: flags.length === 0,
      score: maxScore,
      flags,
      details: data as unknown as Record<string, unknown>,
    };
  } catch (error) {
    console.error('[Moderation] Image moderation error:', error);
    return { isApproved: true, score: 0, flags: ['error'] };
  }
}

// ============================================================================
// COMBINED MODERATION
// ============================================================================

interface ContentToModerate {
  text?: string;
  imageUrls?: string[];
}

/**
 * Moderate all content (text + images) for a listing
 */
export async function moderateContent(
  content: ContentToModerate
): Promise<ModerationResult> {
  const results: ModerationResult[] = [];

  // Moderate text
  if (content.text) {
    const textResult = await moderateText(content.text);
    results.push(textResult);
  }

  // Moderate images (in parallel)
  if (content.imageUrls?.length) {
    const imageResults = await Promise.all(
      content.imageUrls.map(moderateImage)
    );
    results.push(...imageResults);
  }

  // Combine results
  const allFlags = results.flatMap((r) => r.flags);
  const maxScore = Math.max(...results.map((r) => r.score), 0);
  const isApproved = results.every((r) => r.isApproved);

  return {
    isApproved,
    score: maxScore,
    flags: [...new Set(allFlags)], // Unique flags
    details: { results },
  };
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

/**
 * Check if user has exceeded rate limit
 */
export function checkRateLimit(
  currentCount: number,
  limit: number,
  windowStart: Date | null,
  windowMs: number
): { allowed: boolean; resetAt: Date } {
  const now = new Date();

  // No previous activity or window expired
  if (!windowStart || now.getTime() - windowStart.getTime() > windowMs) {
    return {
      allowed: true,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }

  // Within window, check count
  const resetAt = new Date(windowStart.getTime() + windowMs);
  return {
    allowed: currentCount < limit,
    resetAt,
  };
}

// ============================================================================
// SPAM DETECTION
// ============================================================================

/**
 * Simple spam detection heuristics
 */
export function detectSpam(text: string): { isSpam: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 20) {
    reasons.push('excessive_caps');
  }

  // Check for repeated characters
  if (/(.)\1{4,}/.test(text)) {
    reasons.push('repeated_chars');
  }

  // Check for common spam patterns
  const spamPatterns = [
    /whatsapp/i,
    /telegram/i,
    /viber.*\+\d/i,
    /call me at/i,
    /contact me at/i,
    /wire transfer/i,
    /western union/i,
    /bitcoin.*payment/i,
    /crypto.*payment/i,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      reasons.push('spam_pattern');
      break;
    }
  }

  // Check for excessive URLs
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    reasons.push('excessive_urls');
  }

  // Check for excessive phone numbers
  const phoneCount = (text.match(/\+?\d{9,}/g) || []).length;
  if (phoneCount > 2) {
    reasons.push('excessive_phones');
  }

  return {
    isSpam: reasons.length >= 2, // Flag if 2+ issues
    reasons,
  };
}
