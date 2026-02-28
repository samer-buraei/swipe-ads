// contracts/validators.ts
// Zod schemas for runtime validation
// These MUST match prisma/schema.prisma
// Used by: tRPC routers, forms, API validation
import { z } from 'zod';
import { LIMITS } from '@/lib/constants';

// ============================================================================
// ENUMS (must match Prisma enums)
// ============================================================================

export const ListingStatusSchema = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'SOLD',
  'EXPIRED',
  'REJECTED',
  'REMOVED',
]);

export const ItemConditionSchema = z.enum([
  'NEW',
  'LIKE_NEW',
  'GOOD',
  'FAIR',
]);

export const SwipeDirectionSchema = z.enum([
  'LEFT',
  'RIGHT',
  'UP',
]);

export const ReportReasonSchema = z.enum([
  'SPAM',
  'SCAM',
  'PROHIBITED_ITEM',
  'WRONG_CATEGORY',
  'DUPLICATE',
  'OFFENSIVE',
  'OTHER',
]);

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

// Pagination (cursor-based)
export const paginationSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(), // Last item ID for pagination
});

// Location
export const locationSchema = z.object({
  city: z.string().min(1).max(100),
  address: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Price
export const priceSchema = z.object({
  price: z.number().min(0).max(999999999),
  currency: z.string().default('RSD'),
  isNegotiable: z.boolean().default(false),
});

// ============================================================================
// LISTING SCHEMAS
// ============================================================================

// Create listing - input validation
export const createListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Naslov mora imati najmanje 3 karaktera')
    .max(100, 'Naslov može imati najviše 100 karaktera')
    .trim(),

  description: z
    .string()
    .min(10, 'Opis mora imati najmanje 10 karaktera')
    .max(2000, 'Opis može imati najviše 2000 karaktera')
    .trim(),

  price: z
    .number()
    .min(0, 'Cena ne može biti negativna')
    .max(999999999, 'Cena je prevelika'),

  currency: z.string().default('RSD'),
  city: z.string().min(1, 'Unesite grad').max(100),
  categoryId: z.string().min(1, 'Izaberite kategoriju'),
  condition: ItemConditionSchema.default('GOOD'),

  // Images (URLs after upload)
  imageIds: z
    .array(z.string())
    .min(1, 'Dodajte najmanje 1 sliku')
    .max(LIMITS.MAX_IMAGES_PER_LISTING, `Možete dodati najviše ${LIMITS.MAX_IMAGES_PER_LISTING} slika`),

  // Dynamic Attributes
  attributes: z.record(z.any()).optional(),
});

// Update listing - partial, ID required
export const updateListingSchema = createListingSchema.partial().extend({
  id: z.string().min(1),
});

// Change listing status
export const changeListingStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['SOLD', 'ACTIVE']), // Only these can be set by users
});

// List/search listings
export const listListingsSchema = z.object({
  // Filters
  categoryId: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().optional(),
  conditions: z.array(ItemConditionSchema).optional(),
  query: z.string().max(100).optional(), // Full-text search

  // Filter by status (admin only can see non-active)
  status: ListingStatusSchema.optional(),
  userId: z.string().uuid().optional(),

  // Exclude listings user has already swiped on
  excludeSwiped: z.boolean().default(false),

  // Pagination
  limit: z.number().min(1).max(LIMITS.MAX_PAGE_SIZE).default(LIMITS.DEFAULT_PAGE_SIZE),
  cursor: z.string().optional(),

  // Sort
  sortBy: z.enum(['createdAt', 'price']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Get single listing
export const getListingSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
}).refine(data => data.id || data.slug, {
  message: 'Either id or slug is required',
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .regex(/^[\d\s+()-]+$/, 'Neispravan format telefona')
    .optional()
    .nullable(),
  city: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phoneVerifiedAt: z.string().optional(),
});

export const getUserSchema = z.object({
  id: z.string().min(1),
});

// ============================================================================
// FAVORITE SCHEMAS
// ============================================================================

export const toggleFavoriteSchema = z.object({
  listingId: z.string().min(1),
});

export const listFavoritesSchema = paginationSchema;

// ============================================================================
// SWIPE SCHEMAS
// ============================================================================

export const recordSwipeSchema = z.object({
  listingId: z.string().min(1),
  direction: SwipeDirectionSchema,
  timeSpentMs: z.number().min(0).max(300000).optional(), // Max 5 min
});

// Get swipe deck (listings for swiping)
export const getSwipeDeckSchema = z.object({
  // Same filters as list, but optimized for swipe
  categoryId: z.string().optional(),
  city: z.string().optional(),
  radiusKm: z.number().min(1).max(500).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().optional(),

  // How many cards to load at once
  count: z.number().min(5).max(30).default(20),
});

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

export const sendMessageSchema = z.object({
  listingId: z.string().min(1),
  receiverId: z.string().min(1),
  content: z
    .string()
    .min(1, 'Poruka ne može biti prazna')
    .max(2000, 'Poruka je predugačka')
    .trim(),
});

export const listConversationsSchema = paginationSchema;

export const getConversationSchema = z.object({
  conversationId: z.string().min(1),
});

export const markMessagesReadSchema = z.object({
  conversationId: z.string().min(1),
});

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

export const createReportSchema = z.object({
  listingId: z.string().optional(),
  reportedUserId: z.string().optional(),
  reason: ReportReasonSchema,
  details: z.string().max(1000).optional(),
}).refine(data => data.listingId || data.reportedUserId, {
  message: 'Must report either a listing or a user',
});

// ============================================================================
// SEARCH PROFILE SCHEMAS
// ============================================================================

export const createSearchProfileSchema = z.object({
  name: z.string().min(1).max(50),
  categoryIds: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().optional(),
  city: z.string().optional(),
  radiusKm: z.number().min(1).max(500).optional(),
  keywords: z.array(z.string().max(50)).max(10).optional(),
  conditions: z.array(ItemConditionSchema).optional(),
  notifyNew: z.boolean().default(false),
});

export const updateSearchProfileSchema = createSearchProfileSchema.partial().extend({
  id: z.string().min(1),
});

// ============================================================================
// IMAGE UPLOAD SCHEMAS
// ============================================================================

export const getUploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
  ]),
});

export const confirmUploadSchema = z.object({
  tempId: z.string().min(1), // Temp ID from upload
  listingId: z.string().optional(), // If attaching to existing listing
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListListingsInput = z.infer<typeof listListingsSchema>;
export type GetListingInput = z.infer<typeof getListingSchema>;

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GetUserInput = z.infer<typeof getUserSchema>;

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
export type RecordSwipeInput = z.infer<typeof recordSwipeSchema>;
export type GetSwipeDeckInput = z.infer<typeof getSwipeDeckSchema>;

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type CreateSearchProfileInput = z.infer<typeof createSearchProfileSchema>;
