import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any })

export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')!

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const listingId = session.metadata?.listingId
        if (!listingId) return NextResponse.json({ received: true })

        // Use service role to bypass RLS — this is a server webhook, not a user action
        const adminSupabase = createServiceRoleClient()

        // Idempotency check: Stripe has at-least-once delivery — webhook can fire more than once.
        // If the listing is already premium and hasn't expired, skip the update.
        const { data: existing } = await (adminSupabase.from('listings') as any)
            .select('is_premium, featured_until')
            .eq('id', listingId)
            .single()

        if (existing?.is_premium && existing?.featured_until && new Date(existing.featured_until) > new Date()) {
            // Already processed — acknowledge and exit
            return NextResponse.json({ received: true })
        }

        const premiumUntil = new Date()
        premiumUntil.setDate(premiumUntil.getDate() + 30)

        const { error: updateError } = await (adminSupabase.from('listings') as any)
            .update({
                is_premium: true,
                featured_until: premiumUntil.toISOString(),
            })
            .eq('id', listingId)

        // If DB update fails, return 500 so Stripe retries the webhook automatically
        if (updateError) {
            console.error('Webhook: failed to update listing premium status', updateError)
            return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
        }
    }

    return NextResponse.json({ received: true })
}
