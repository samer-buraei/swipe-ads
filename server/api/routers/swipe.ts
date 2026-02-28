// server/api/routers/swipe.ts
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { recordSwipeSchema, getSwipeDeckSchema } from '@/contracts/validators'
import type { SwipeDeckResponse, SwipeResult } from '@/contracts/api'
import { toListingCard } from '../helpers'

export const swipeRouter = createTRPCRouter({
  record: protectedProcedure
    .input(recordSwipeSchema)
    .mutation(async ({ ctx, input }): Promise<SwipeResult> => {
      // Upsert swipe event: check if exists first
      const { data: existing } = await ctx.supabase
        .from('swipe_events')
        .select('id')
        .eq('user_id', ctx.user.id)
        .eq('listing_id', input.listingId)
        .maybeSingle()

      if (existing) {
        await ctx.supabase
          .from('swipe_events')
          .update({
            direction: input.direction as any,
            time_spent_ms: input.timeSpentMs ?? null,
          })
          .eq('id', existing.id)
      } else {
        await ctx.supabase
          .from('swipe_events')
          .insert({
            user_id: ctx.user.id,
            listing_id: input.listingId,
            direction: input.direction as any,
            time_spent_ms: input.timeSpentMs ?? null,
          })
      }

      // If swiped RIGHT, also add to favorites
      if (input.direction === 'RIGHT') {
        const { data: existingFav } = await ctx.supabase
          .from('favorites')
          .select('id')
          .eq('user_id', ctx.user.id)
          .eq('listing_id', input.listingId)
          .maybeSingle()

        if (!existingFav) {
          await ctx.supabase
            .from('favorites')
            .insert({
              user_id: ctx.user.id,
              listing_id: input.listingId,
            })
        }
      }

      return { success: true, isFavorited: input.direction === 'RIGHT' }
    }),

  getDeck: protectedProcedure
    .input(getSwipeDeckSchema)
    .query(async ({ ctx, input }): Promise<SwipeDeckResponse> => {
      const count = input.count ?? 20

      // Get IDs of already-swiped listings
      const { data: swipedRows } = await ctx.supabase
        .from('swipe_events')
        .select('listing_id')
        .eq('user_id', ctx.user.id)

      const swipedIds = swipedRows?.map((s) => s.listing_id) ?? []

      // Build query for unswiped active listings
      let query = ctx.supabase
        .from('listings')
        .select(`
          *,
          listing_images(id, original_url, medium_url, thumb_url, "order"),
          users(id, name, image, is_verified)
        `)
        .eq('status', 'ACTIVE')
        .neq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(count)

      if (input.categoryId) query = query.eq('category_id', input.categoryId)
      if (input.city) query = query.ilike('city', `%${input.city}%`)

      // Exclude already swiped
      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`)
      }

      const { data, error } = await query
      if (error) throw new Error(error.message)

      const cards = (data ?? []).map((l) => toListingCard(l, ctx.user.id))

      // Count total remaining
      let countQuery = ctx.supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .neq('user_id', ctx.user.id)

      if (input.categoryId) countQuery = countQuery.eq('category_id', input.categoryId)
      if (input.city) countQuery = countQuery.ilike('city', `%${input.city}%`)
      if (swipedIds.length > 0) {
        countQuery = countQuery.not('id', 'in', `(${swipedIds.join(',')})`)
      }

      const { count: totalRemaining } = await countQuery

      return {
        cards,
        remaining: Math.max(0, (totalRemaining ?? 0) - cards.length),
      }
    }),
})
