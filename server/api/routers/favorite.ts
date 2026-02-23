// server/api/routers/favorite.ts
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { toggleFavoriteSchema, listFavoritesSchema } from '@/contracts/validators'
import type { FavoritesResponse, ToggleFavoriteResponse } from '@/contracts/api'
import { toListingCard } from '../helpers'

export const favoriteRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(toggleFavoriteSchema)
    .mutation(async ({ ctx, input }): Promise<ToggleFavoriteResponse> => {
      // Check if already favorited
      const { data: existing } = await ctx.supabase
        .from('favorites')
        .select('id')
        .eq('user_id', ctx.user.id)
        .eq('listing_id', input.listingId)
        .maybeSingle()

      if (existing) {
        await ctx.supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id)
        return { isFavorited: false }
      }

      await ctx.supabase
        .from('favorites')
        .insert({
          user_id: ctx.user.id,
          listing_id: input.listingId,
        })

      return { isFavorited: true }
    }),

  list: protectedProcedure
    .input(listFavoritesSchema)
    .query(async ({ ctx }): Promise<FavoritesResponse> => {
      const { data: favorites, error } = await ctx.supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          listing_id,
          listings (
            *,
            listing_images(id, original_url, medium_url, thumb_url, "order"),
            users(id, name, image, is_verified)
          )
        `)
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      const items = (favorites ?? [])
        .filter((f: any) => f.listings?.status === 'ACTIVE')
        .map((f: any) => ({
          id: f.id,
          createdAt: new Date(f.created_at),
          listing: toListingCard(f.listings, ctx.user.id, { isFavorited: true }),
        }))

      return {
        items,
        nextCursor: null,
        hasMore: false,
        totalCount: items.length,
      }
    }),
})
