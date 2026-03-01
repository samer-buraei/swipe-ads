import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    // body.subscription is a standard PushSubscription JSON object from the browser
    const { endpoint, keys } = body.subscription
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const supabaseAny = supabase as any;
    await supabaseAny.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
    }, { onConflict: 'user_id,endpoint' })

    return NextResponse.json({ success: true })
}
