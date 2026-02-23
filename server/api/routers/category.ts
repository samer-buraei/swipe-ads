// server/api/routers/category.ts
import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import type { CategoryItem } from '@/contracts/api'

export const categoryRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }): Promise<CategoryItem[]> => {
    const { data: categories, error } = await ctx.supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true })

    if (error) throw new Error(error.message)

    // Get listing counts per category
    const { data: listings } = await ctx.supabase
      .from('listings')
      .select('category_id')
      .eq('status', 'ACTIVE')

    const countMap = new Map<string, number>()
    for (const l of listings ?? []) {
      if (l.category_id) {
        countMap.set(l.category_id, (countMap.get(l.category_id) ?? 0) + 1)
      }
    }

    return (categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon ?? '',
      listingCount: countMap.get(c.id) ?? 0,
    }))
  }),

  getAttributes: publicProcedure
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('category_attributes')
        .select('*')
        .eq('category_id', input.categoryId)
        .order('order', { ascending: true })

      if (error) throw new Error(error.message)
      return data ?? []
    }),
})
