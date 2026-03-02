import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { createServerSupabaseClient } from '../../../lib/supabase/server'

const serbianPhoneSchema = z.string().refine(
    (val) => /^\+3816[0-79]\d{7}$/.test(val),
    { message: 'Unesite validan srpski mobilni broj (npr. +381641234567)' }
)

export const authRouter = createTRPCRouter({
    /**
     * Step 1 of phone OTP: send a 6-digit SMS code to the given phone number.
     * The phone must be in E.164 format: +381XXXXXXXXX
     */
    sendOtp: publicProcedure
        .input(z.object({ phone: serbianPhoneSchema }))
        .mutation(async ({ input }) => {
            const supabase = createServerSupabaseClient()
            const { error } = await supabase.auth.signInWithOtp({
                phone: input.phone,
            })
            if (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error.message ?? 'Greška pri slanju koda. Pokušajte ponovo.',
                })
            }
            return { success: true }
        }),

    /**
     * Step 2 of phone OTP: verify the 6-digit code the user received by SMS.
     * On success, Supabase sets a session cookie automatically.
     */
    verifyOtp: publicProcedure
        .input(z.object({
            phone: serbianPhoneSchema,
            token: z.string().length(6, 'Kod mora imati tačno 6 cifara').regex(/^\d{6}$/, 'Kod sme da sadrži samo cifre'),
        }))
        .mutation(async ({ input }) => {
            const supabase = createServerSupabaseClient()
            const { data, error } = await supabase.auth.verifyOtp({
                phone: input.phone,
                token: input.token,
                type: 'sms',
            })
            if (error || !data.user || !data.session) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Neispravan ili istekao kod. Pokušajte ponovo.',
                })
            }
            return {
                success: true,
                userId: data.user.id,
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
            }
        }),

    /**
     * Add a phone number to an existing Google OAuth account.
     * Sends OTP to the provided phone — user must then call verifyOtp.
     */
    addPhone: protectedProcedure
        .input(z.object({ phone: serbianPhoneSchema }))
        .mutation(async ({ ctx, input }) => {
            const supabase = createServerSupabaseClient()
            const { error } = await supabase.auth.updateUser({ phone: input.phone })
            if (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error.message ?? 'Greška pri dodavanju broja telefona.',
                })
            }
            return { success: true }
        }),
})
