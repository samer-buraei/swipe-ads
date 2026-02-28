// server/api/routers/report.ts
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { createReportSchema } from '@/contracts/validators'
import { LIMITS, SUCCESS } from '@/lib/constants'

export const reportRouter = createTRPCRouter({
    create: protectedProcedure
        .input(createReportSchema)
        .mutation(async ({ ctx, input }) => {
            // 1. Check daily limit
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { count, error: countError } = await ctx.supabase
                .from('reports')
                .select('id', { count: 'exact', head: true })
                .eq('reporter_id', ctx.user.id)
                .gte('created_at', today.toISOString())

            if (countError) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Greška pri proveri limita.' })
            }

            if ((count ?? 0) >= LIMITS.MAX_REPORTS_PER_DAY) {
                throw new TRPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: `Možete poslati najviše ${LIMITS.MAX_REPORTS_PER_DAY} prijava dnevno.`,
                })
            }

            // 2. Insert report
            const { error } = await ctx.supabase.from('reports').insert({
                reporter_id: ctx.user.id,
                reported_user_id: input.reportedUserId,
                listing_id: input.listingId,
                reason: input.reason,
                details: input.details,
                status: 'PENDING',
            })

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Greška prilikom slanja prijave.',
                })
            }

            // 3. Auto-hide logic for listings
            if (input.listingId) {
                const { count: reportCount } = await ctx.supabase
                    .from('reports')
                    .select('id', { count: 'exact', head: true })
                    .eq('listing_id', input.listingId)
                    .eq('status', 'PENDING') // Count only unresolved reports

                if ((reportCount ?? 0) >= LIMITS.REPORTS_TO_AUTO_HIDE) {
                    // Hide listing automatically
                    await ctx.supabase
                        .from('listings')
                        .update({ status: 'PENDING_REVIEW' as any })
                        .eq('id', input.listingId)
                }
            }

            return { success: true, message: SUCCESS.REPORT_SUBMITTED }
        }),
})
