// lib/supabase/types.ts
// Auto-generated Supabase types placeholder
// Replace this file by running:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
//
// For now, this provides a minimal Database type so TypeScript compiles.

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string
                    name: string
                    icon: string | null
                    order: number | null
                    created_at: string | null
                }
                Insert: {
                    id: string
                    name: string
                    icon?: string | null
                    order?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    icon?: string | null
                    order?: number | null
                    created_at?: string | null
                }
            }
            category_attributes: {
                Row: {
                    id: string
                    category_id: string
                    key: string
                    label: string
                    type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN'
                    required: boolean | null
                    options: Json | null
                    order: number | null
                }
                Insert: {
                    id?: string
                    category_id: string
                    key: string
                    label: string
                    type?: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN'
                    required?: boolean | null
                    options?: Json | null
                    order?: number | null
                }
                Update: {
                    id?: string
                    category_id?: string
                    key?: string
                    label?: string
                    type?: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN'
                    required?: boolean | null
                    options?: Json | null
                    order?: number | null
                }
            }
            users: {
                Row: {
                    id: string
                    email: string | null
                    phone: string | null
                    phone_verified_at: string | null
                    name: string | null
                    image: string | null
                    city: string | null
                    bio: string | null
                    is_verified: boolean
                    is_admin: boolean
                    is_banned: boolean
                    push_subscription: Json | null
                    avg_rating: number
                    total_ratings: number
                    listings_count: number
                    listing_count_today: number
                    listing_reset_date: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email?: string | null
                    phone?: string | null
                    phone_verified_at?: string | null
                    name?: string | null
                    image?: string | null
                    city?: string | null
                    bio?: string | null
                    is_verified?: boolean
                    is_admin?: boolean
                    is_banned?: boolean
                    push_subscription?: Json | null
                    avg_rating?: number
                    total_ratings?: number
                    listings_count?: number
                    listing_count_today?: number
                    listing_reset_date?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    phone?: string | null
                    phone_verified_at?: string | null
                    name?: string | null
                    image?: string | null
                    city?: string | null
                    bio?: string | null
                    is_verified?: boolean
                    is_admin?: boolean
                    is_banned?: boolean
                    push_subscription?: Json | null
                    avg_rating?: number
                    total_ratings?: number
                    listings_count?: number
                    listing_count_today?: number
                    listing_reset_date?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            listings: {
                Row: {
                    id: string
                    slug: string | null
                    title: string
                    description: string | null
                    price: number | null
                    currency: string
                    condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | null
                    status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REJECTED' | 'REMOVED'
                    category_id: string | null
                    city: string | null
                    attributes: Json
                    moderation_score: number | null
                    moderation_flags: Json | null
                    is_premium: boolean
                    view_count: number
                    favorite_count: number
                    user_id: string
                    search_vector: unknown | null
                    created_at: string
                    updated_at: string
                    expires_at: string
                }
                Insert: {
                    id?: string
                    slug?: string | null
                    title: string
                    description?: string | null
                    price?: number | null
                    currency?: string
                    condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | null
                    status?: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REJECTED' | 'REMOVED'
                    category_id?: string | null
                    city?: string | null
                    attributes?: Json
                    moderation_score?: number | null
                    moderation_flags?: Json | null
                    is_premium?: boolean
                    view_count?: number
                    favorite_count?: number
                    user_id: string
                    created_at?: string
                    updated_at?: string
                    expires_at?: string
                }
                Update: {
                    id?: string
                    slug?: string | null
                    title?: string
                    description?: string | null
                    price?: number | null
                    currency?: string
                    condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | null
                    status?: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REJECTED' | 'REMOVED'
                    category_id?: string | null
                    city?: string | null
                    attributes?: Json
                    moderation_score?: number | null
                    moderation_flags?: Json | null
                    is_premium?: boolean
                    view_count?: number
                    favorite_count?: number
                    user_id?: string
                    created_at?: string
                    updated_at?: string
                    expires_at?: string
                }
            }
            listing_images: {
                Row: {
                    id: string
                    listing_id: string
                    original_url: string
                    medium_url: string | null
                    thumb_url: string | null
                    order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    listing_id: string
                    original_url: string
                    medium_url?: string | null
                    thumb_url?: string | null
                    order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    listing_id?: string
                    original_url?: string
                    medium_url?: string | null
                    thumb_url?: string | null
                    order?: number
                    created_at?: string
                }
            }
            favorites: {
                Row: {
                    id: string
                    user_id: string
                    listing_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    listing_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    listing_id?: string
                    created_at?: string
                }
            }
            swipe_events: {
                Row: {
                    id: string
                    user_id: string
                    listing_id: string
                    direction: 'LEFT' | 'RIGHT' | 'UP'
                    time_spent_ms: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    listing_id: string
                    direction: 'LEFT' | 'RIGHT' | 'UP'
                    time_spent_ms?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    listing_id?: string
                    direction?: 'LEFT' | 'RIGHT' | 'UP'
                    time_spent_ms?: number | null
                    created_at?: string
                }
            }
            search_profiles: {
                Row: {
                    id: string
                    user_id: string
                    name: string | null
                    category_ids: string[]
                    price_min: number | null
                    price_max: number | null
                    city: string | null
                    radius_km: number | null
                    keywords: string[] | null
                    conditions: ('NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR')[] | null
                    notify_on_new: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name?: string | null
                    category_ids?: string[]
                    price_min?: number | null
                    price_max?: number | null
                    city?: string | null
                    radius_km?: number | null
                    keywords?: string[] | null
                    conditions?: ('NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR')[] | null
                    notify_on_new?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string | null
                    category_ids?: string[]
                    price_min?: number | null
                    price_max?: number | null
                    city?: string | null
                    radius_km?: number | null
                    keywords?: string[] | null
                    conditions?: ('NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR')[] | null
                    notify_on_new?: boolean
                    created_at?: string
                }
            }
            conversations: {
                Row: {
                    id: string
                    listing_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    listing_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    listing_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            conversation_participants: {
                Row: {
                    conversation_id: string
                    user_id: string
                    unread_count: number
                }
                Insert: {
                    conversation_id: string
                    user_id: string
                    unread_count?: number
                }
                Update: {
                    conversation_id?: string
                    user_id?: string
                    unread_count?: number
                }
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
            reports: {
                Row: {
                    id: string
                    reporter_id: string
                    listing_id: string | null
                    reason: 'SPAM' | 'SCAM' | 'PROHIBITED_ITEM' | 'WRONG_CATEGORY' | 'DUPLICATE' | 'OFFENSIVE' | 'OTHER'
                    description: string | null
                    status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
                    resolved_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    reporter_id: string
                    listing_id?: string | null
                    reason: 'SPAM' | 'SCAM' | 'PROHIBITED_ITEM' | 'WRONG_CATEGORY' | 'DUPLICATE' | 'OFFENSIVE' | 'OTHER'
                    description?: string | null
                    status?: 'PENDING' | 'RESOLVED' | 'DISMISSED'
                    resolved_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    reporter_id?: string
                    listing_id?: string | null
                    reason?: 'SPAM' | 'SCAM' | 'PROHIBITED_ITEM' | 'WRONG_CATEGORY' | 'DUPLICATE' | 'OFFENSIVE' | 'OTHER'
                    description?: string | null
                    status?: 'PENDING' | 'RESOLVED' | 'DISMISSED'
                    resolved_at?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            listing_status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REJECTED' | 'REMOVED'
            item_condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
            swipe_direction: 'LEFT' | 'RIGHT' | 'UP'
            report_reason: 'SPAM' | 'SCAM' | 'PROHIBITED_ITEM' | 'WRONG_CATEGORY' | 'DUPLICATE' | 'OFFENSIVE' | 'OTHER'
            report_status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
            attribute_type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN'
        }
    }
}
