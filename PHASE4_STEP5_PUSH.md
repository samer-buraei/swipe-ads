# PHASE 4 — STEP 5: Push Notifications for Saved Searches
**Prerequisite:** PHASE4_STEP1_BLOCKERS.md complete
**Can run in parallel with Step 3 and Step 4**
**Estimated time:** 5 tasks × ~25 minutes = ~2 hours

---

## Session context header (paste at the top of every agent session for this step)

```
PROJECT: SwipeMarket — Serbian classifieds marketplace
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2
AUTH: Supabase Auth (Google OAuth) — NO NextAuth
DB: Supabase hosted PostgreSQL — supabase client only, never raw Prisma
KEY RULE: tRPC v10 — mutations use isLoading NOT isPending
ROOT: C:\Users\sam\Desktop\swipemarket\
CURRENT TASK: [paste the specific task heading below]
```

---

## TASK 5.1 — Install web-push and generate VAPID keys

**Run in terminal:**
```bash
npm install web-push
npm install --save-dev @types/web-push
```

**Generate VAPID keys (run once, save the output):**
```bash
npx web-push generate-vapid-keys
```

Copy the output — it looks like:
```
Public Key:
BDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...

Private Key:
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...
```

**Add to `.env.local`:**
```bash
VAPID_PUBLIC_KEY="BDxxxxxxx..."
VAPID_PRIVATE_KEY="xxxxxxx..."
VAPID_EMAIL="mailto:admin@swipemarket.rs"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BDxxxxxxx..."
```

Note: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is the same value as `VAPID_PUBLIC_KEY` — it must be prefixed with `NEXT_PUBLIC_` so it is accessible in the browser.

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

**Done when:** Keys are in `.env.local` and `npm install` succeeded.

---

## TASK 5.2 — Add pushSubscription column to User table

**Run this SQL in the Supabase SQL Editor:**

```sql
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "pushSubscription" JSONB;
```

1. Go to https://supabase.com/dashboard → project `awbtohtpjrqlxfoqtita`
2. Click **SQL Editor**
3. Paste and run the SQL above

**Done when:** The `pushSubscription` column appears on the `User` table in the Table Editor.

---

## TASK 5.3 — Create the push subscription API route

**Files to read first:**
- `app/api/upload/route.ts` (to see the pattern for authenticated API route handlers)
- `lib/supabase/server.ts` (to understand createServerSupabaseClient and createServiceRoleClient)

**Create new file `app/api/push/subscribe/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // 1. Verify user is authenticated
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse the push subscription object from the request body
  let subscription: PushSubscriptionJSON
  try {
    subscription = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate it has the required fields
  if (!subscription.endpoint || !subscription.keys) {
    return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 })
  }

  // 3. Store the subscription in the User record (use service role to bypass RLS on update)
  const adminSupabase = createServiceRoleClient()
  const { error: updateError } = await adminSupabase
    .from('users')
    .update({ pushSubscription: subscription })
    .eq('id', user.id)

  if (updateError) {
    console.error('Failed to store push subscription:', updateError)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminSupabase = createServiceRoleClient()
  await adminSupabase.from('users').update({ pushSubscription: null }).eq('id', user.id)
  return NextResponse.json({ success: true })
}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## TASK 5.4 — Create the service worker file

**Create new file `public/sw.js`:**

```javascript
// SwipeMarket Service Worker — handles push notifications

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'SwipeMarket', body: event.data.text(), url: '/' }
  }

  const options = {
    body:    data.body    ?? 'Nova poruka od SwipeMarket',
    icon:    data.icon    ?? '/icon-192.png',
    badge:   data.badge   ?? '/icon-72.png',
    data:  { url: data.url ?? '/' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'SwipeMarket', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
```

Note: This file goes in `/public/sw.js` (not in `app/` or `src/`) so Next.js serves it at the root URL `/sw.js`, which is required for service workers.

**Done when:** File exists at `public/sw.js`.

---

## TASK 5.5 — Register service worker and request permission

**Files to read first:**
- `app/layout.tsx` (read the whole file — you will add the registration logic here)
- `app/search-profiles/page.tsx` (you will add the subscribe button here)

**In `app/layout.tsx`**, find the root layout component and add a `useEffect` to register the service worker.

First, make sure the layout component is a client component or extract this into a separate client component. If `layout.tsx` is a server component (no `'use client'`), create a new file `components/PushNotificationRegistrar.tsx`:

**Create `components/PushNotificationRegistrar.tsx`:**

```typescript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function PushNotificationRegistrar() {
  useEffect(() => {
    // Only register if browser supports service workers and push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Register the service worker
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered:', registration.scope)
    }).catch(err => {
      console.error('SW registration failed:', err)
    })
  }, [])

  return null // This component renders nothing visible
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    const registration = await navigator.serviceWorker.ready

    // Request notification permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    })

    // Send subscription to our server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    })

    return true
  } catch (err) {
    console.error('Push subscription failed:', err)
    return false
  }
}

// Helper: convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}
```

**Now import and use it in `app/layout.tsx`:**

Open `app/layout.tsx`. Add the import near the top:
```typescript
import { PushNotificationRegistrar } from '@/components/PushNotificationRegistrar'
```

Inside the returned JSX, add the component (it renders nothing visible — just runs the effect):
```tsx
<body>
  <PushNotificationRegistrar />
  {children}
</body>
```

**In `app/search-profiles/page.tsx`**, add an "Enable notifications" button:

Find the existing save/create search profile UI. Add this button near the top of the page, outside of the search profile list:

```typescript
import { subscribeToPush } from '@/components/PushNotificationRegistrar'

// Inside the component:
const [notifEnabled, setNotifEnabled] = useState(false)
const [notifLoading, setNotifLoading] = useState(false)

useEffect(() => {
  if ('Notification' in window) {
    setNotifEnabled(Notification.permission === 'granted')
  }
}, [])

const handleEnableNotifications = async () => {
  setNotifLoading(true)
  const success = await subscribeToPush()
  setNotifEnabled(success)
  setNotifLoading(false)
}
```

Add this banner in the JSX before the search profiles list:
```tsx
{!notifEnabled && (
  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-3">
    <div>
      <p className="text-sm font-semibold text-indigo-900">Dobijajte obaveštenja</p>
      <p className="text-xs text-indigo-600 mt-0.5">Javimo vam kad se pojavi oglas koji tražite</p>
    </div>
    <button
      onClick={handleEnableNotifications}
      disabled={notifLoading}
      className="shrink-0 text-sm bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50"
    >
      {notifLoading ? '...' : 'Uključi'}
    </button>
  </div>
)}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## TASK 5.6 — Create the notifications helper and hook into listing creation

**Files to read first:**
- `server/api/routers/searchProfile.ts` (to understand how search profiles are stored and what filters they have)
- `server/api/routers/listing.ts` (find where a listing is created — you will call `notifySearchProfileMatches` there)

**Create new file `lib/notifications.ts`:**

```typescript
import webpush from 'web-push'
import { createServiceRoleClient } from './supabase/server'

// Configure VAPID credentials once
webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface NotificationPayload {
  title: string
  body:  string
  url:   string
}

/**
 * Find all saved search profiles that match the newly created listing,
 * then send a push notification to each matching user.
 *
 * This function should be called AFTER a listing is created with status=ACTIVE.
 * Call it without await (fire and forget) — don't let notification failures
 * block the listing creation response.
 */
export async function notifySearchProfileMatches(listingId: string): Promise<void> {
  const supabase = createServiceRoleClient()

  // 1. Load the new listing
  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, title, city, price, category_id, condition, slug')
    .eq('id', listingId)
    .single()

  if (error || !listing) {
    console.error('notifySearchProfileMatches: listing not found', listingId)
    return
  }

  // 2. Load all search profiles where notifyNew = true
  const { data: profiles } = await supabase
    .from('search_profiles')
    .select(`
      id, user_id, category_ids, min_price, max_price,
      city, keywords, conditions, notify_new,
      users ( id, pushSubscription )
    `)
    .eq('notify_new', true)

  if (!profiles?.length) return

  // 3. Filter profiles that match this listing
  const matchingProfiles = profiles.filter((profile: any) => {
    // Category filter: if profile has categories, listing must be in one of them
    if (profile.category_ids?.length && !profile.category_ids.includes(listing.category_id)) return false
    // Price filter
    if (profile.min_price != null && Number(listing.price) < profile.min_price) return false
    if (profile.max_price != null && Number(listing.price) > profile.max_price) return false
    // City filter (case-insensitive partial match)
    if (profile.city && !listing.city?.toLowerCase().includes(profile.city.toLowerCase())) return false
    // Condition filter
    if (profile.conditions?.length && !profile.conditions.includes(listing.condition)) return false
    // Keywords: at least one keyword must appear in the title
    if (profile.keywords?.length) {
      const titleLower = listing.title.toLowerCase()
      const hasKeyword = profile.keywords.some((kw: string) => titleLower.includes(kw.toLowerCase()))
      if (!hasKeyword) return false
    }
    return true
  })

  if (!matchingProfiles.length) return

  // 4. Send push notification to each matching user
  const payload: NotificationPayload = {
    title: 'SwipeMarket — Novi oglas',
    body:  `${listing.title} — ${Number(listing.price).toLocaleString('sr-RS')} RSD`,
    url:   `/listing/${listing.slug}`,
  }

  const sendPromises = matchingProfiles.map(async (profile: any) => {
    const subscription = profile.users?.pushSubscription
    if (!subscription) return // User has no push subscription — skip silently

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload))
    } catch (err: any) {
      // 410 Gone means the subscription is expired — clean it up
      if (err.statusCode === 410) {
        await supabase
          .from('users')
          .update({ pushSubscription: null })
          .eq('id', profile.user_id)
      } else {
        console.error('Push notification failed for user', profile.user_id, err.message)
      }
    }
  })

  await Promise.allSettled(sendPromises)
}
```

**Now hook this into `server/api/routers/listing.ts`:**

Find the `create` mutation in the listing router. After the listing is successfully created with status `ACTIVE`, add this line:

```typescript
// Fire and forget — don't await, don't let notification errors block the response
if (newListing.status === 'ACTIVE') {
  import('../../../lib/notifications')
    .then(({ notifySearchProfileMatches }) => {
      notifySearchProfileMatches(newListing.id).catch(console.error)
    })
}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## Step 5 pass criteria

```
[ ] npm install web-push completed without errors
[ ] VAPID keys are set in .env.local (all 4 variables)
[ ] pushSubscription column exists on User table in Supabase
[ ] public/sw.js file exists and is served at http://localhost:3000/sw.js
[ ] /search-profiles page shows "Uključi obaveštenja" banner when permission not granted
[ ] Clicking "Uključi" triggers browser notification permission dialog
[ ] After granting permission, banner disappears
[ ] PushSubscription JSON is stored in User.pushSubscription in Supabase (verify in Table Editor)
[ ] Creating a new ACTIVE listing triggers notifySearchProfileMatches (check server logs)
[ ] Users with matching saved search profiles receive push notification (requires real Twilio + VAPID)
[ ] Expired subscriptions (410) are cleaned up automatically
[ ] npm run typecheck → 0 errors
```

**Next:** Open `PHASE4_STEP6_STRIPE.md`
