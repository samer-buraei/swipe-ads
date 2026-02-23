// server/api/trpc.ts
// tRPC context and procedure definitions — Supabase edition
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  image?: string | null
}

export interface TRPCContext {
  supabase: SupabaseClient
  user: SessionUser | null
}

export async function createTRPCContext(): Promise<TRPCContext> {
  // Use session-aware client to identify the user
  const supabaseForAuth = createServerSupabaseClient()
  let user: SessionUser | null = null

  try {
    const { data: { user: authUser } } = await supabaseForAuth.auth.getUser()
    if (authUser) {
      user = {
        id: authUser.id,
        email: authUser.email ?? '',
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        image: authUser.user_metadata?.avatar_url ?? null,
      }
    }
  } catch {
    user = null
  }

  // Demo mode fallback
  if (!user && process.env.DEMO_MODE === 'true') {
    user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo@swipemarket.rs',
      name: 'Demo Korisnik',
      image: null,
    }
  }

  // Use service role client for DB queries (full access)
  // Note: in production, switch this to supabaseForAuth to respect RLS
  const supabase = createServiceRoleClient()

  return { supabase, user }
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Morate biti prijavljeni.' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})
