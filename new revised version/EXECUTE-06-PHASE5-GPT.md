# EXECUTE: PHASE 5 - UTILITIES (ChatGPT) - UPDATED v2

## Changes from v1
- ✅ Added video compression (720p/30fps) - CRITICAL for budget
- ✅ Added optimistic update patterns in hooks
- ✅ Added cursor-based pagination in all list hooks

## Instructions

1. Open ChatGPT (chatgpt.com)
2. **Paste APP-CONTRACT.md first** with every prompt
3. **Paste types.ts** with every prompt
4. Execute prompts: 5A → 5B → 5C → 5D → 5E
5. Save outputs to correct folders

---

## PROMPT 5B: Media Utilities (UPDATED - Critical)

```
# Task: Create Media Handling Utilities with Video Compression

## App Contract
[PASTE APP-CONTRACT.md HERE]

## TypeScript Types
[PASTE types.ts HERE]

## CRITICAL REQUIREMENT: Video Compression

Modern phones record in 4K (100-200MB per minute). Without compression:
- Users on mobile data will abandon uploads
- Supabase bandwidth costs will explode ($0.09/GB)
- A viral app could cost $500+/month in bandwidth alone

**ALL videos MUST be compressed to 720p/30fps before upload.**

## Video Compression Implementation

```typescript
// utils/media/video.ts

import * as VideoCompressor from 'react-native-compressor';
import * as FileSystem from 'expo-file-system';

interface CompressVideoOptions {
  uri: string;
  maxDuration?: number;  // seconds, default 60
  onProgress?: (progress: number) => void;
}

interface CompressedVideo {
  uri: string;
  duration: number;      // seconds
  width: number;
  height: number;
  size: number;          // bytes
  originalSize: number;  // bytes (for showing savings)
}

/**
 * Compress video to 720p/30fps for upload
 * This is CRITICAL for budget and UX
 */
export async function compressVideo(
  options: CompressVideoOptions
): Promise<CompressedVideo> {
  const { uri, maxDuration = 60, onProgress } = options;
  
  // 1. Get original file info
  const originalInfo = await FileSystem.getInfoAsync(uri);
  if (!originalInfo.exists) {
    throw new Error('Video file not found');
  }
  
  // 2. Validate duration first (fail fast)
  const duration = await getVideoDuration(uri);
  if (duration > maxDuration) {
    throw new VideoTooLongError(
      `Video mora biti kraći od ${maxDuration} sekundi. Trenutno: ${Math.round(duration)}s`,
      duration,
      maxDuration
    );
  }
  
  // 3. Compress to 720p/30fps
  // Target: ~2Mbps bitrate = ~15MB per minute
  const compressedUri = await VideoCompressor.compress(uri, {
    compressionMethod: 'auto',
    maxSize: 720,           // Max dimension (720p)
    bitrate: 2000000,       // 2 Mbps
    // fps: 30,             // Not always supported, but target
  }, (progress) => {
    onProgress?.(progress);
  });
  
  // 4. Get compressed file info
  const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
  
  // 5. Validate compressed size (should be < 50MB for 60s)
  const maxSizeBytes = 50 * 1024 * 1024; // 50MB
  if (compressedInfo.size && compressedInfo.size > maxSizeBytes) {
    throw new VideoTooLargeError(
      `Video je prevelik za upload. Pokušaj kraći video.`,
      compressedInfo.size,
      maxSizeBytes
    );
  }
  
  return {
    uri: compressedUri,
    duration,
    width: 720,  // Approximate
    height: 1280, // Assuming portrait
    size: compressedInfo.size || 0,
    originalSize: originalInfo.size || 0,
  };
}

/**
 * Get video duration without loading full video
 */
export async function getVideoDuration(uri: string): Promise<number> {
  // Use expo-av to get duration
  const { createVideoAsync } = await import('expo-av').then(m => m.Video);
  // ... implementation
}

/**
 * Pick video from library or camera with validation
 */
export async function pickVideo(options: {
  source: 'camera' | 'library';
  maxDuration?: number;
}): Promise<CompressedVideo | null> {
  const { source, maxDuration = 60 } = options;
  
  // 1. Pick video
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    quality: 1, // We'll compress ourselves
    videoMaxDuration: maxDuration,
  });
  
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  
  // 2. Compress before returning
  return compressVideo({
    uri: result.assets[0].uri,
    maxDuration,
  });
}

/**
 * Custom error classes for better error handling
 */
export class VideoTooLongError extends Error {
  constructor(
    message: string,
    public actualDuration: number,
    public maxDuration: number
  ) {
    super(message);
    this.name = 'VideoTooLongError';
  }
}

export class VideoTooLargeError extends Error {
  constructor(
    message: string,
    public actualSize: number,
    public maxSize: number
  ) {
    super(message);
    this.name = 'VideoTooLargeError';
  }
}
```

## Upload with Progress

```typescript
// utils/media/upload.ts

interface UploadOptions {
  uri: string;
  bucket: string;
  path: string;
  contentType: string;
  onProgress?: (progress: number) => void;
}

export async function uploadToSupabase(options: UploadOptions): Promise<{
  path: string;
  url: string;
}> {
  const { uri, bucket, path, contentType, onProgress } = options;
  
  // Read file as blob
  const response = await fetch(uri);
  const blob = await response.blob();
  
  // Upload with progress tracking
  // Note: Supabase JS doesn't support progress natively
  // For progress, use XMLHttpRequest or tus-js-client
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType,
      upsert: false,
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Upload video with compression and progress
 */
export async function uploadVideo(
  uri: string,
  listingId: string,
  onProgress?: (stage: 'compressing' | 'uploading', progress: number) => void
): Promise<{ path: string; url: string; thumbnail: string }> {
  // 1. Compress
  onProgress?.('compressing', 0);
  const compressed = await compressVideo({
    uri,
    maxDuration: 60,
    onProgress: (p) => onProgress?.('compressing', p),
  });
  
  // 2. Generate thumbnail
  const thumbnail = await generateVideoThumbnail(compressed.uri);
  
  // 3. Upload video
  onProgress?.('uploading', 0);
  const videoResult = await uploadToSupabase({
    uri: compressed.uri,
    bucket: 'listings',
    path: `videos/${listingId}/${Date.now()}.mp4`,
    contentType: 'video/mp4',
    onProgress: (p) => onProgress?.('uploading', p),
  });
  
  // 4. Upload thumbnail
  const thumbResult = await uploadToSupabase({
    uri: thumbnail,
    bucket: 'listings',
    path: `thumbnails/${listingId}/${Date.now()}.jpg`,
    contentType: 'image/jpeg',
  });
  
  return {
    path: videoResult.path,
    url: videoResult.url,
    thumbnail: thumbResult.url,
  };
}
```

## Dependencies

```json
{
  "react-native-compressor": "^1.x",
  "expo-image-picker": "~14.x",
  "expo-av": "~13.x",
  "expo-file-system": "~16.x"
}
```

Rest of prompt same as v1 (image compression, blurhash, etc.)
```

---

## PROMPT 5D: Supabase Hooks (UPDATED - Optimistic Updates)

```
# Task: Create React Query Hooks with Optimistic Updates

## App Contract
[PASTE APP-CONTRACT.md HERE]

## TypeScript Types  
[PASTE types.ts HERE]

## CRITICAL: Optimistic Updates

The app must feel INSTANT. All mutations should:
1. Update local cache immediately
2. Show success state
3. Fire API call in background
4. Rollback on error + show toast

## Swipe Hook with Optimistic Update

```typescript
// hooks/useSwipeActions.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

interface RecordSwipeParams {
  listingId: string;
  action: 'like' | 'nope' | 'maybe' | 'contact';
  viewDurationMs?: number;
}

export function useRecordSwipe() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: RecordSwipeParams) => {
      const { data, error } = await supabase
        .from('swipe_actions')
        .upsert({
          listing_id: params.listingId,
          action: params.action,
          view_duration_ms: params.viewDurationMs,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    // OPTIMISTIC UPDATE - runs BEFORE API call
    onMutate: async (params) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['swipeFeed'] });
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      await queryClient.cancelQueries({ queryKey: ['maybes'] });
      
      // Snapshot previous values for rollback
      const previousFeed = queryClient.getQueryData(['swipeFeed']);
      const previousFavorites = queryClient.getQueryData(['favorites']);
      const previousMaybes = queryClient.getQueryData(['maybes']);
      
      // Optimistically remove from feed
      queryClient.setQueryData(['swipeFeed'], (old: Listing[] | undefined) => 
        old?.filter(l => l.id !== params.listingId) ?? []
      );
      
      // Optimistically add to appropriate list
      if (params.action === 'like') {
        // Add to favorites (we don't have the full listing, but that's OK)
        // It will be refreshed on next fetch
      }
      if (params.action === 'maybe') {
        // Add to maybes
      }
      
      return { previousFeed, previousFavorites, previousMaybes };
    },
    
    // ROLLBACK on error
    onError: (err, params, context) => {
      // Restore previous state
      if (context?.previousFeed) {
        queryClient.setQueryData(['swipeFeed'], context.previousFeed);
      }
      
      // Show error toast with retry
      Toast.show({
        type: 'error',
        text1: 'Greška pri čuvanju',
        text2: 'Dodirnite da pokušate ponovo',
        onPress: () => {
          // Retry the mutation
          queryClient.getMutationCache().find({ 
            mutationKey: ['recordSwipe', params.listingId] 
          })?.execute();
        },
      });
      
      // Haptic error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    
    // On success, just invalidate to get fresh data
    onSuccess: (data, params) => {
      // Invalidate relevant queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['maybes'] });
    },
  });
}
```

## Cursor-Based Pagination for Lists

```typescript
// hooks/useListings.ts

import { useInfiniteQuery } from '@tanstack/react-query';

interface UseSwipeFeedOptions {
  categoryId?: string;
  enabled?: boolean;
}

export function useSwipeFeed(options: UseSwipeFeedOptions = {}) {
  const { categoryId, enabled = true } = options;
  
  return useInfiniteQuery({
    queryKey: ['swipeFeed', categoryId],
    enabled,
    
    queryFn: async ({ pageParam }) => {
      // Use the optimized RPC function from Phase 1
      const { data, error } = await supabase.rpc('get_swipe_feed', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_category_id: categoryId || null,
        p_cursor_created_at: pageParam?.createdAt || new Date().toISOString(),
        p_cursor_id: pageParam?.id || null,
        p_limit: 20,
      });
      
      if (error) throw error;
      
      return {
        listings: data as Listing[],
        nextCursor: data.length === 20 ? {
          createdAt: data[data.length - 1].created_at,
          id: data[data.length - 1].id,
        } : null,
      };
    },
    
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    
    // Flatten pages into single array
    select: (data) => ({
      listings: data.pages.flatMap(p => p.listings),
      pageParams: data.pageParams,
    }),
    
    // Keep previous data while fetching
    placeholderData: (prev) => prev,
  });
}

/**
 * Favorites list with cursor pagination
 */
export function useFavorites() {
  return useInfiniteQuery({
    queryKey: ['favorites'],
    
    queryFn: async ({ pageParam }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      let query = supabase
        .from('swipe_actions')
        .select(`
          listing_id,
          created_at,
          listing:listings(*)
        `)
        .eq('user_id', userId)
        .eq('action', 'like')
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Cursor pagination
      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return {
        favorites: data.map(d => d.listing) as Listing[],
        nextCursor: data.length === 20 ? data[data.length - 1].created_at : null,
      };
    },
    
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
```

## Message Sending with Optimistic Update

```typescript
// hooks/useMessages.ts

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    // Optimistically add message to chat
    onMutate: async (content) => {
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        conversation_id: conversationId,
        content,
        sender_id: 'me', // Will be replaced
        created_at: new Date().toISOString(),
        is_pending: true, // UI can show "sending..."
      };
      
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      
      const previous = queryClient.getQueryData(['messages', conversationId]);
      
      queryClient.setQueryData(
        ['messages', conversationId],
        (old: Message[] | undefined) => [...(old || []), tempMessage]
      );
      
      return { previous, tempId };
    },
    
    onError: (err, content, context) => {
      // Remove optimistic message
      queryClient.setQueryData(['messages', conversationId], context?.previous);
      
      Toast.show({
        type: 'error',
        text1: 'Poruka nije poslata',
        text2: 'Dodirnite da pokušate ponovo',
      });
    },
    
    onSuccess: (data, content, context) => {
      // Replace temp message with real one
      queryClient.setQueryData(
        ['messages', conversationId],
        (old: Message[] | undefined) => 
          old?.map(m => m.id === context?.tempId ? data : m) || [data]
      );
    },
  });
}
```

Rest of prompt same as v1 (auth hooks, categories, profile, etc.)
All list hooks must use cursor-based pagination pattern.
```

---

## Prompts 5A, 5C, 5E

Same as v1 - no critical changes needed.

---

## Next: Proceed to EXECUTE-07-PHASE6A-INTEGRATION.md
