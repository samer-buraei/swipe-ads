// contracts/api.ts
// API Response Types and Interfaces
// These define what tRPC endpoints return
// Frontend components should import these types


// ============================================================================
// GENERIC RESPONSE TYPES
// ============================================================================

// Paginated list response
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number; // Optional, expensive to compute
}

// Standard mutation response
export interface MutationResponse {
  success: boolean;
  message?: string;
}

// ============================================================================
// LISTING TYPES
// ============================================================================

// Listing card (for grids and swipe cards)
export interface ListingCard {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  isNegotiable: boolean;
  city: string;
  condition: string;
  categoryId: string;
  createdAt: Date;
  // Image
  heroImage: {
    thumbUrl: string;
    mediumUrl: string;
  } | null;
  // Seller preview
  seller: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  // User-specific (requires auth)
  isFavorited?: boolean;
  hasSwiped?: boolean;
  // Attributes
  attributes?: Record<string, any> | null;
  isPremium?: boolean;
  status?: string;
}

// Full listing detail
export interface ListingDetail extends ListingCard {
  description: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  viewCount: number;
  expiresAt: Date;
  attributes: Record<string, any> | null;
  // All images
  images: {
    id: string;
    originalUrl: string;
    mediumUrl: string;
    thumbUrl: string;
    order: number;
  }[];
  // Full seller info
  seller: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    phone: string | null; // Only if user allows
    city: string | null;
    memberSince: Date;
    listingCount: number;
  };
}

// Listing list response
export type ListingsResponse = PaginatedResponse<ListingCard>;

// Create listing response
export interface CreateListingResponse {
  id: string;
  slug: string;
  status: string;
}

// ============================================================================
// SWIPE TYPES
// ============================================================================

// Swipe deck response (cards to swipe)
export interface SwipeDeckResponse {
  cards: ListingCard[];
  remaining: number; // Approximate count of remaining matches
}

// Swipe result
export interface SwipeResult {
  success: boolean;
  isFavorited: boolean; // True if RIGHT swipe
}

// ============================================================================
// USER TYPES
// ============================================================================

// Current user (self)
export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  city: string | null;
  bio?: string | null;
  isVerified: boolean;
  phoneVerifiedAt?: Date | null;
  isAdmin?: boolean;
  createdAt: Date;
  // Stats
  stats: {
    activeListings: number;
    totalListings: number;
    favoritesCount: number;
  };
}

// Public user profile (other users)
export interface PublicProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  city: string | null;
  isVerified: boolean;
  memberSince: Date;
  // Public stats
  activeListings: number;
  // Their active listings
  listings: ListingCard[];
}

// ============================================================================
// FAVORITE TYPES
// ============================================================================

export interface FavoriteItem {
  id: string;
  createdAt: Date;
  listing: ListingCard;
}

export type FavoritesResponse = PaginatedResponse<FavoriteItem>;

export interface ToggleFavoriteResponse {
  isFavorited: boolean;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

// Conversation preview (for list)
export interface ConversationPreview {
  id: string;
  listing: {
    id: string;
    title: string;
    heroImage: string | null;
    status: string;
  };
  otherUser: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: Date;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
  updatedAt: Date;
}

export type ConversationsResponse = PaginatedResponse<ConversationPreview>;

// Full conversation with messages
export interface ConversationDetail {
  id: string;
  listing: {
    id: string;
    slug: string;
    title: string;
    price: number;
    currency: string;
    heroImage: string | null;
    status: string;
    sellerId: string;
    images?: { thumbUrl: string }[];
  };
  otherUser: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  messages: MessageItem[];
}

export interface MessageItem {
  id: string;
  content: string;
  isFromMe: boolean;
  isRead: boolean;
  createdAt: Date;
}

export interface SendMessageResponse {
  messageId: string;
  conversationId: string;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  listingCount?: number; // Optional aggregate
}

// ============================================================================
// SEARCH PROFILE TYPES
// ============================================================================

export interface SearchProfileItem {
  id: string;
  name: string;
  categoryIds: string[];
  minPrice: number | null;
  maxPrice: number | null;
  city: string | null;
  radiusKm: number | null;
  keywords: string[];
  conditions: string[];
  notifyNew: boolean;
  createdAt: Date;
  // Computed
  matchCount?: number; // How many listings match
}

// ============================================================================
// IMAGE UPLOAD TYPES
// ============================================================================

export interface UploadUrlResponse {
  uploadUrl: string; // Pre-signed URL
  tempId: string; // Temporary ID to reference this upload
  expiresAt: Date;
}

export interface ConfirmUploadResponse {
  imageId: string;
  thumbUrl: string;
  mediumUrl: string;
  originalUrl: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

// Standard error codes (match tRPC error codes)
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR';

// Validation error (from Zod)
export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// MODERATION TYPES (internal use)
// ============================================================================

export interface ModerationResult {
  isApproved: boolean;
  score: number; // 0-1, higher = more problematic
  flags: string[];
  details?: Record<string, unknown>;
}

// ============================================================================
// ANALYTICS TYPES (for future features)
// ============================================================================

export interface ListingAnalytics {
  listingId: string;
  views: number;
  favorites: number;
  swipesRight: number;
  swipesLeft: number;
  messages: number;
  // Time series (last 30 days)
  dailyViews: { date: string; count: number }[];
}
