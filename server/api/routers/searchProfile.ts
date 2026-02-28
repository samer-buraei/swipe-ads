// server/api/routers/searchProfile.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

import { createSearchProfileSchema } from '@/contracts/validators';

export const searchProfileRouter = createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.supabase
            .from('search_profiles')
            .select('*')
            .eq('user_id', ctx.user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return (data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            categoryIds: row.category_ids ?? [],
            minPrice: row.price_min ? Number(row.price_min) : null,
            maxPrice: row.price_max ? Number(row.price_max) : null,
            city: row.city,
            radiusKm: row.radius_km,
            keywords: row.keywords ?? [],
            conditions: row.conditions ?? [],
            notifyNew: row.notify_on_new ?? false,
            createdAt: new Date(row.created_at)
        }));
    }),

    create: protectedProcedure
        .input(createSearchProfileSchema)
        .mutation(async ({ ctx, input }) => {
            const { count } = await ctx.supabase
                .from('search_profiles')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', ctx.user.id);

            if ((count ?? 0) >= 5) {
                throw new Error('Maksimalan broj sačuvanih pretraga je 5.');
            }

            const { data, error } = await ctx.supabase
                .from('search_profiles')
                .insert({
                    user_id: ctx.user.id,
                    name: input.name,
                    category_ids: input.categoryIds ?? [],
                    price_min: input.minPrice,
                    price_max: input.maxPrice,
                    city: input.city,
                    radius_km: input.radiusKm,
                    keywords: input.keywords ?? null,
                    conditions: input.conditions ?? null,
                    notify_on_new: input.notifyNew ?? false,
                })
                .select()
                .single();

            if (error) throw new Error(error.message);

            return {
                id: data.id,
                name: data.name,
                categoryIds: data.category_ids ?? [],
                minPrice: data.price_min ? Number(data.price_min) : null,
                maxPrice: data.price_max ? Number(data.price_max) : null,
                city: data.city,
                radiusKm: data.radius_km,
                keywords: data.keywords ? data.keywords.split(',') : [],
                conditions: [],
                notifyNew: data.notify_on_new ?? false,
                createdAt: new Date(data.created_at)
            };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.supabase
                .from('search_profiles')
                .delete()
                .eq('id', input.id)
                .eq('user_id', ctx.user.id);

            if (error) throw new Error(error.message);
            return { success: true };
        })
});
