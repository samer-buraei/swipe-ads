import webpush from 'web-push'

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

export interface PushSubscriptionRow {
    endpoint: string
    p256dh: string
    auth: string
}

export async function sendPushNotification(
    subscription: PushSubscriptionRow,
    payload: { title: string; body: string; url: string }
) {
    try {
        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            JSON.stringify(payload)
        )
    } catch (err: any) {
        // 410 = subscription expired/unsubscribed — caller should delete it
        if (err.statusCode === 410) return { expired: true }
        // Other errors are non-fatal — log and continue
        console.error('Push send failed:', err.message)
    }
    return { expired: false }
}
