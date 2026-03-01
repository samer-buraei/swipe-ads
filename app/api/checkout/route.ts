import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any })

export async function POST(req: NextRequest) {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { listingId } = body
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    // Verify the listing belongs to this user
    const { data: listingResponse } = await supabase
        .from('listings')
        .select('id, title, slug')
        .eq('id', listingId)
        .eq('user_id', user.id)
        .single()

    const listing = listingResponse as any

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'rsd',
                product_data: {
                    name: `Premium oglas: ${listing.title}`,
                    description: '30 dana na vrhu pretrage i swipe špila',
                },
                unit_amount: 49900, // 499 RSD in paras (smallest unit)
            },
            quantity: 1,
        }],
        mode: 'payment',
        // Pass listing ID through so the webhook knows what to promote
        metadata: { listingId: listing.id, userId: user.id },
        success_url: `${appUrl}/listing/${listing.slug}?promoted=1`,
        cancel_url: `${appUrl}/profile`,
    })

    return NextResponse.json({ url: session.url })
}
