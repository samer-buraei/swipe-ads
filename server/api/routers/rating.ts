import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { createRatingSchema, listRatingsSchema } from '@/contracts/validators'
import type { RatingItem, RatingSummary, RatingsResponse } from '@/contracts/api'
import { ERRORS } from '@/lib/constants'

export const ratingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createRatingSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.toUserId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ne možete oceniti sami sebe.',
        })
      }

      const { error } = await ctx.supabase
        .from('ratings')
        .insert({
          from_user_id: ctx.user.id,
          to_user_id: input.toUserId,
          listing_id: input.listingId ?? null,
          score: input.score,
          comment: input.comment ?? null,
        })

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Već ste ocenili ovog prodavca za ovaj oglas.',
          })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERRORS.GENERIC_ERROR })
      }

      return { success: true }
    }),

  list: publicProcedure
    .input(listRatingsSchema)
    .query(async ({ ctx, input }): Promise<RatingsResponse> => {
      const offset = input.cursor ? parseInt(input.cursor, 10) : 0

      const { data, error } = await ctx.supabase
        .from('ratings')
        .select(`
          id,
          score,
          comment,
          created_at,
          listing_id,
          listings(title),
          from_user:users!from_user_id(id, name, image)
        `)
        .eq('to_user_id', input.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERRORS.GENERIC_ERROR })

      const rows = data ?? []
      const items = rows.slice(0, input.limit)
      const hasMore = rows.length > input.limit

      return {
        items: items.map((r: any): RatingItem => ({
          id: r.id,
          score: r.score,
          comment: r.comment ?? null,
          createdAt: new Date(r.created_at),
          listingId: r.listing_id ?? null,
          listingTitle: r.listings?.title ?? null,
          fromUser: {
            id: r.from_user?.id ?? '',
            name: r.from_user?.name ?? null,
            avatarUrl: r.from_user?.image ?? null,
          },
        })),
        nextCursor: hasMore ? String(offset + input.limit) : null,
        hasMore,
      }
    }),

  summary: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }): Promise<RatingSummary> => {
      const { data, error } = await ctx.supabase
        .from('ratings')
        .select('score')
        .eq('to_user_id', input.userId)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERRORS.GENERIC_ERROR })

      const rows = data ?? []
      if (rows.length === 0) return { average: 0, count: 0, breakdown: [] }

      const sum = rows.reduce((acc: number, r: any) => acc + r.score, 0)
      const average = Math.round((sum / rows.length) * 10) / 10

      const breakdown = [5, 4, 3, 2, 1].map(score => ({
        score,
        count: rows.filter((r: any) => r.score === score).length,
      }))

      return { average, count: rows.length, breakdown }
    }),
})
