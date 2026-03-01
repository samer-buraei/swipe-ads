// server/api/routers/admin.ts
import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../trpc';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export const adminRouter = createTRPCRouter({
    getQueue: adminProcedure.query(async ({ ctx }) => {
        const adminSupabase = createServiceRoleClient() as SupabaseClient;
        const { data: listings } = await adminSupabase
            .from('listings')
            .select('*')
            .eq('status', 'PENDING_REVIEW')
            .order('created_at', { ascending: false });

        return listings ?? [];
    }),

    approveListing: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const adminSupabase = createServiceRoleClient() as SupabaseClient;
            await adminSupabase
                .from('listings')
                .update({ status: 'ACTIVE' })
                .eq('id', input.id);
            return { success: true };
        }),

    rejectListing: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const adminSupabase = createServiceRoleClient() as SupabaseClient;
            await adminSupabase
                .from('listings')
                .update({ status: 'REJECTED' })
                .eq('id', input.id);
            return { success: true };
        }),

    getReports: adminProcedure.query(async ({ ctx }) => {
        const adminSupabase = createServiceRoleClient() as SupabaseClient;
        const { data: reports } = await adminSupabase
            .from('reports')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        return reports ?? [];
    }),

    resolveReport: adminProcedure
        .input(z.object({ id: z.string(), status: z.enum(['ACTION_TAKEN', 'DISMISSED']) }))
        .mutation(async ({ ctx, input }) => {
            const adminSupabase = createServiceRoleClient() as SupabaseClient;
            await adminSupabase
                .from('reports')
                .update({ status: input.status, resolved_at: new Date().toISOString() })
                .eq('id', input.id);
            return { success: true };
        })
});
