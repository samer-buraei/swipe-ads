// server/api/helpers.ts
// Helper functions for Supabase data transformation
// Converts raw Supabase rows into frontend-expected shapes

import type { ListingCard, ListingDetail } from '@/contracts/api'

// Generate URL-friendly slug from title
export function generateSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
  return `${base}-${id.slice(-6)}`
}

// Haversine formula for distance calculation
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Transform a raw Supabase listing row (with joins) into a ListingCard
 * Expected shape from Supabase: listing row + listing_images[] + users{}
 */
export function toListingCard(row: any, userId?: string, extra?: { isFavorited?: boolean; hasSwiped?: boolean }): ListingCard {
  const heroImage = row.listing_images?.[0] ?? null

  return {
    id: row.id,
    slug: row.slug ?? generateSlug(row.title, row.id),
    title: row.title,
    price: Number(row.price ?? 0),
    currency: row.currency ?? 'RSD',
    isNegotiable: row.is_negotiable ?? false,
    city: row.city ?? '',
    condition: row.condition ?? 'GOOD',
    categoryId: row.category_id ?? '',
    createdAt: new Date(row.created_at),
    heroImage: heroImage
      ? {
        thumbUrl: heroImage.thumb_url ?? heroImage.original_url,
        mediumUrl: heroImage.medium_url ?? heroImage.original_url,
      }
      : null,
    seller: {
      id: row.users?.id ?? row.user_id ?? 'unknown',
      name: row.users?.name ?? null,
      avatarUrl: row.users?.image ?? null,
      isVerified: row.users?.is_verified ?? false,
    },
    isFavorited: extra?.isFavorited,
    hasSwiped: extra?.hasSwiped,
    attributes: row.attributes ?? null,
    isPremium: row.is_premium ?? false,
    status: row.status ?? 'ACTIVE',
  }
}

/**
 * Transform a raw Supabase listing row into a full ListingDetail
 */
export function toListingDetail(
  row: any,
  listingCount: number,
  userId?: string,
  extra?: { isFavorited?: boolean; hasSwiped?: boolean }
): ListingDetail {
  const card = toListingCard(row, userId, extra)

  return {
    ...card,
    description: row.description ?? '',
    address: row.address ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    viewCount: row.view_count ?? 0,
    status: row.status ?? 'ACTIVE',
    expiresAt: new Date(row.expires_at ?? Date.now()),
    attributes: row.attributes ?? null,
    images: (row.listing_images ?? []).map((img: any) => ({
      id: img.id,
      originalUrl: img.original_url,
      mediumUrl: img.medium_url ?? img.original_url,
      thumbUrl: img.thumb_url ?? img.original_url,
      order: img.order ?? 0,
    })),
    seller: {
      ...card.seller,
      phone: row.users?.phone ?? null,
      city: row.users?.city ?? null,
      memberSince: new Date(row.users?.created_at ?? Date.now()),
      listingCount,
    },
  }
}
