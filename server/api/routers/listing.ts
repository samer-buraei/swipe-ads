// server/api/routers/listing.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push'
import {
  createListingSchema,
  updateListingSchema,
  listListingsSchema,
  getListingSchema,
  changeListingStatusSchema,
} from '@/contracts/validators'
import type {
  ListingDetail,
  ListingsResponse,
  CreateListingResponse,
  MutationResponse,
} from '@/contracts/api'
import { ERRORS, SUCCESS } from '@/lib/constants'
import { toListingCard, toListingDetail, generateSlug } from '../helpers'
import { moderateContent } from '@/lib/moderation'

const LISTING_SELECT = `
  *,
  listing_images(id, original_url, medium_url, thumb_url, "order"),
  users(id, name, image, is_verified, phone, city, created_at)
`

const CARD_SELECT = `
  *,
  listing_images(id, original_url, medium_url, thumb_url, "order"),
  users(id, name, image, is_verified)
`

export const listingRouter = createTRPCRouter({
  get: publicProcedure
    .input(getListingSchema)
    .query(async ({ ctx, input }): Promise<ListingDetail> => {
      let query = ctx.supabase
        .from('listings')
        .select(LISTING_SELECT)

      if (input.id) {
        query = query.eq('id', input.id)
      } else if (input.slug) {
        // Query by exact slug
        query = query.eq('slug', input.slug)
      }

      const { data: listing, error } = await query.single()

      if (error || !listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: ERRORS.LISTING_NOT_FOUND,
        })
      }

      // Increment view count (fire and forget)
      ctx.supabase
        .from('listings')
        .update({ view_count: (listing.view_count ?? 0) + 1 })
        .eq('id', listing.id)
        .then(() => { })

      // Get seller's active listing count
      const { count: listingCount } = await ctx.supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', listing.user_id)
        .eq('status', 'ACTIVE')

      // Check if user favorited / swiped
      let isFavorited: boolean | undefined
      let hasSwiped: boolean | undefined
      if (ctx.user) {
        const { data: fav } = await ctx.supabase
          .from('favorites')
          .select('id')
          .eq('user_id', ctx.user.id)
          .eq('listing_id', listing.id)
          .maybeSingle()
        isFavorited = !!fav

        const { data: swipe } = await ctx.supabase
          .from('swipe_events')
          .select('id')
          .eq('user_id', ctx.user.id)
          .eq('listing_id', listing.id)
          .maybeSingle()
        hasSwiped = !!swipe
      }

      return toListingDetail(listing, listingCount ?? 0, ctx.user?.id, { isFavorited, hasSwiped })
    }),

  list: publicProcedure
    .input(listListingsSchema)
    .query(async ({ ctx, input }): Promise<ListingsResponse> => {
      const limit = input.limit ?? 20

      let query = ctx.supabase
        .from('listings')
        .select(CARD_SELECT)
        .eq('status', 'ACTIVE')

      if (input.userId) {
        query = query.eq('user_id', input.userId)
      }

      // Full-text search
      if (input.query) {
        const tsQuery = input.query.trim().split(/\s+/).join(' & ')
        query = query.textSearch('search_vector', tsQuery, { type: 'plain' })
      }

      // Filters
      if (input.categoryId) query = query.eq('category_id', input.categoryId)
      if (input.city) query = query.ilike('city', `%${input.city}%`)
      if (input.minPrice !== undefined) query = query.gte('price', input.minPrice)
      if (input.maxPrice !== undefined) query = query.lte('price', input.maxPrice)
      if (input.conditions?.length) query = query.in('condition', input.conditions)

      // Exclude swiped listings
      if (input.excludeSwiped && ctx.user) {
        const { data: swipedIds } = await ctx.supabase
          .from('swipe_events')
          .select('listing_id')
          .eq('user_id', ctx.user.id)

        const ids = swipedIds?.map(s => s.listing_id) ?? []
        if (ids.length > 0) {
          query = query.not('id', 'in', `(${ids.join(',')})`)
        }
      }

      // Sorting: Premium first, then by selected sort criteria
      const sortBy = input.sortBy === 'price' ? 'price' : 'created_at'
      const ascending = input.sortOrder === 'asc'
      query = query.order('is_premium', { ascending: false }).order(sortBy, { ascending })

      // Offset pagination (cursor = offset number as string)
      const offset = input.cursor ? parseInt(input.cursor, 10) : 0
      query = query.range(offset, offset + limit)

      const { data, error } = await query
      if (error) throw new Error(error.message)

      const items = (data ?? []).slice(0, limit)
      const hasMore = (data ?? []).length > limit

      return {
        items: items.map((l) => toListingCard(l, ctx.user?.id)),
        nextCursor: hasMore ? String(offset + limit) : null,
        hasMore,
      }
    }),

  create: protectedProcedure
    .input(createListingSchema)
    .mutation(async ({ ctx, input }): Promise<CreateListingResponse> => {
      // Rate limiting: max 5 listings per day
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count } = await ctx.supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ctx.user.id)
        .gte('created_at', today.toISOString())

      if ((count ?? 0) >= 5) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Dostigli ste dnevni limit od 5 oglasa.',
        })
      }

      // 2. Moderate Text & Images
      const moderationMsg = `${input.title}\n${input.description}`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const imageUrls = input.imageIds?.map(id => `${supabaseUrl}/storage/v1/object/public/listing-images/${id}`) ?? [];

      const moderation = await moderateContent({
        text: moderationMsg,
        imageUrls
      });

      const serviceClient = createServiceRoleClient()

      // Create the listing
      // @ts-ignore
      const { data: listing, error } = await serviceClient
        .from('listings')
        .insert({
          title: input.title,
          description: input.description,
          price: input.price,
          currency: input.currency ?? 'RSD',
          category_id: input.categoryId,
          condition: (input.condition ?? 'GOOD') as any,
          city: input.city,
          user_id: ctx.user.id,
          status: moderation.isApproved ? 'ACTIVE' : ('PENDING_REVIEW' as any),
          attributes: input.attributes as any ?? {},
          moderation_score: moderation.score,
          moderation_flags: moderation.flags as any,
        } as any)
        .select()
        .single()

      if (error || !listing) throw new Error(error?.message ?? 'Failed to create listing')

      // Update with slug
      const slug = generateSlug(input.title, (listing as any).id)
      // @ts-ignore
      await (serviceClient.from('listings').update({ slug } as any) as any).eq('id', `${(listing as any).id}`)

      // Insert images if provided
      if (input.imageIds?.length) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const imageRows = input.imageIds.map((id, index) => {
          const base = `${supabaseUrl}/storage/v1/object/public/listing-images/${id}`
          return {
            listing_id: (listing as any).id,
            original_url: base,
            medium_url: `${base}?width=800&quality=80`,
            thumb_url: `${base}?width=400&height=400&resize=cover&quality=70`,
            order: index,
          }
        })
        await serviceClient.from('listing_images').insert(imageRows as any)
      }

      // Fire-and-forget push notifications to matching saved searches
      ; (async () => {
        try {
          // Filter at DB level: only load profiles matching this listing's city.
          // Profiles with city=null mean "all cities" — .or() handles both cases.
          // This avoids loading every search profile into memory on every listing create.
          const { data: profiles } = await ctx.supabase
            .from('search_profiles')
            .select('user_id, category_ids, keywords, city')
            .eq('notify_on_new', true)
            .or(`city.is.null,city.ilike.${input.city}`)

          if (!profiles?.length) return

          // Keyword and category matching still done in JS (can't do this in PostgREST easily)
          const matchingUserIds = profiles
            .filter(p => {
              // Empty category_ids means "all categories"
              const catMatch = !p.category_ids?.length || p.category_ids.includes(input.categoryId)
              const kwMatch = !p.keywords?.length || p.keywords.some((kw: string) =>
                input.title.toLowerCase().includes(kw.toLowerCase()) ||
                input.description.toLowerCase().includes(kw.toLowerCase())
              )
              return catMatch && kwMatch
            })
            .map(p => p.user_id)
            // Don't notify the poster about their own listing
            .filter((id: string) => id !== ctx.user.id)

          if (!matchingUserIds.length) return

          // Fetch push subscriptions for matching users
          const { data: subs } = await ctx.supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .in('user_id', matchingUserIds)

          if (!subs?.length) return

          const listingUrl = `/listing/${slug}`
          for (const sub of subs) {
            const result = await sendPushNotification(sub, {
              title: 'Novi oglas koji te zanima',
              body: `${input.title} — ${input.city}`,
              url: listingUrl,
            })
            // Clean up expired subscriptions
            if (result?.expired) {
              await ctx.supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            }
          }
        } catch (e) {
          // Never let push notification errors break listing creation
          console.error('Push notification error:', e)
        }
      })()

      return { id: (listing as any).id, slug, status: (listing as any).status }
    }),

  update: protectedProcedure
    .input(updateListingSchema)
    .mutation(async ({ ctx, input }): Promise<MutationResponse> => {
      const { id, ...data } = input

      // Verify ownership
      const { data: existing } = await ctx.supabase
        .from('listings')
        .select('user_id')
        .eq('id', id)
        .single()

      if (!existing || existing.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: ERRORS.LISTING_NOT_FOUND,
        })
      }

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
      if (data.title) updateData.title = data.title
      if (data.description) updateData.description = data.description
      if (data.price !== undefined) updateData.price = data.price
      if (data.currency) updateData.currency = data.currency
      if (data.categoryId) updateData.category_id = data.categoryId
      if (data.condition) updateData.condition = data.condition
      if (data.city) updateData.city = data.city
      if (data.attributes) updateData.attributes = data.attributes

      await ctx.supabase
        .from('listings')
        .update(updateData)
        .eq('id', id)

      return { success: true, message: SUCCESS.LISTING_UPDATED }
    }),

  changeStatus: protectedProcedure
    .input(changeListingStatusSchema)
    .mutation(async ({ ctx, input }): Promise<MutationResponse> => {
      const { data: existing } = await ctx.supabase
        .from('listings')
        .select('user_id')
        .eq('id', input.id)
        .single()

      if (!existing || existing.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: ERRORS.LISTING_NOT_FOUND,
        })
      }

      await ctx.supabase
        .from('listings')
        .update({ status: input.status as any })
        .eq('id', input.id)

      return {
        success: true,
        message: input.status === 'SOLD' ? SUCCESS.LISTING_SOLD : SUCCESS.LISTING_UPDATED,
      }
    }),

  myListings: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(['ACTIVE', 'SOLD', 'EXPIRED', 'PENDING_REVIEW', 'REJECTED', 'REMOVED'])
          .optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }): Promise<ListingsResponse> => {
      let query = ctx.supabase
        .from('listings')
        .select(CARD_SELECT)
        .eq('user_id', ctx.user.id)

      if (input.status) {
        query = query.eq('status', input.status)
      }

      query = query.order('created_at', { ascending: false })

      const offset = input.cursor ? parseInt(input.cursor, 10) : 0
      query = query.range(offset, offset + input.limit)

      const { data, error } = await query
      if (error) throw new Error(error.message)

      const items = (data ?? []).slice(0, input.limit)
      const hasMore = (data ?? []).length > input.limit

      return {
        items: items.map((l) => toListingCard(l, ctx.user.id)),
        nextCursor: hasMore ? String(offset + input.limit) : null,
        hasMore,
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<MutationResponse> => {
      const { data: existing } = await ctx.supabase
        .from('listings')
        .select('user_id')
        .eq('id', input.id)
        .single()

      if (!existing || existing.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: ERRORS.LISTING_NOT_FOUND,
        })
      }

      await ctx.supabase
        .from('listings')
        .update({ status: 'REMOVED' as any })
        .eq('id', input.id)

      return { success: true, message: SUCCESS.LISTING_DELETED }
    }),
})
