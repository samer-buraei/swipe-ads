// server/api/routers/user.ts
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { getUserSchema, updateProfileSchema } from '@/contracts/validators'
import type { CurrentUser, PublicProfile, MutationResponse } from '@/contracts/api'
import { ERRORS, SUCCESS } from '@/lib/constants'
import { toListingCard } from '../helpers'

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }): Promise<CurrentUser> => {
    const { data: user, error } = await ctx.supabase
      .from('users')
      .select('*')
      .eq('id', ctx.user.id)
      .single()

    if (error || !user) {
      // If user doesn't exist in our users table yet (first login), create them
      const { data: newUser, error: createError } = await ctx.supabase
        .from('users')
        .insert({
          id: ctx.user.id,
          email: ctx.user.email,
          name: ctx.user.name,
          image: ctx.user.image,
        })
        .select()
        .single()

      if (createError || !newUser) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERRORS.GENERIC_ERROR })
      }

      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        avatarUrl: newUser.image,
        city: newUser.city,
        isVerified: newUser.is_verified,
        isAdmin: newUser.is_admin,
        createdAt: new Date(newUser.created_at),
        stats: {
          activeListings: 0,
          totalListings: 0,
          favoritesCount: 0,
        },
      }
    }

    // Get active listing count
    const { count: activeListings } = await ctx.supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id)
      .eq('status', 'ACTIVE')

    // Get total listing count
    const { count: totalListings } = await ctx.supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id)

    // Get favorites count
    const { count: favoritesCount } = await ctx.supabase
      .from('favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.image,
      city: user.city,
      isVerified: user.is_verified,
      phoneVerifiedAt: user.phone_verified_at ? new Date(user.phone_verified_at) : null,
      isAdmin: user.is_admin,
      createdAt: new Date(user.created_at),
      stats: {
        activeListings: activeListings ?? 0,
        totalListings: totalListings ?? 0,
        favoritesCount: favoritesCount ?? 0,
      },
    }
  }),

  get: publicProcedure
    .input(getUserSchema)
    .query(async ({ ctx, input }): Promise<PublicProfile> => {
      const { data: user, error } = await ctx.supabase
        .from('users')
        .select('*')
        .eq('id', input.id)
        .single()

      if (error || !user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: ERRORS.GENERIC_ERROR })
      }

      // Get active listing count
      const { count: activeCount } = await ctx.supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', input.id)
        .eq('status', 'ACTIVE')

      // Get recent active listings
      const { data: listingsData } = await ctx.supabase
        .from('listings')
        .select(`
          *,
          listing_images(id, original_url, medium_url, thumb_url, "order"),
          users(id, name, image, is_verified)
        `)
        .eq('user_id', input.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(6)

      return {
        id: user.id,
        name: user.name,
        avatarUrl: user.image,
        city: user.city,
        isVerified: user.is_verified,
        memberSince: new Date(user.created_at),
        activeListings: activeCount ?? 0,
        listings: (listingsData ?? []).map((l) => toListingCard(l, ctx.user?.id)),
      }
    }),

  update: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }): Promise<MutationResponse> => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
      if (input.name !== undefined) updateData.name = input.name
      if (input.phone !== undefined) updateData.phone = input.phone
      if (input.city !== undefined) updateData.city = input.city
      if (input.bio !== undefined) updateData.bio = input.bio
      if (input.phoneVerifiedAt !== undefined) updateData.phone_verified_at = input.phoneVerifiedAt

      await ctx.supabase
        .from('users')
        .update(updateData)
        .eq('id', ctx.user.id)

      return { success: true, message: SUCCESS.PROFILE_UPDATED }
    }),
})
