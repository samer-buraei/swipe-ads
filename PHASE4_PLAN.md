# SwipeMarket — Phase 4 Execution Plan
**Prerequisite:** Phase 1–3 + Phase 7 complete. Production blockers resolved (DEMO_MODE=false, Prisma in package.json, ESLint config fixed).
**Goal:** Fully production-ready app — real phone auth, push notifications, listing management, ratings, and premium payments.
**Last updated:** 2026-02-28

---

## Context Header (paste at the top of every agent session)

```
PROJECT: SwipeMarket — Serbian classifieds marketplace (Tinder swipe meets Halo Oglasi)
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2, Supabase (Auth/Storage/Realtime/DB)
ROOT: C:\Users\sam\Desktop\swipemarket\
AUTH: Supabase Auth (Google OAuth) — NO NextAuth, NO Docker
DB: Supabase hosted PostgreSQL — use supabase client, never raw Prisma
PHASE: Phase 4
CRITICAL: tRPC v10 — use isLoading not isPending on mutations
CURRENT SESSION GOAL: [paste the specific step heading you are working on]
```

---

## Phase 4 Overview

| Step | Feature | Depends On | Estimated Effort |
|------|---------|-----------|-----------------|
| 1 | Fix production blockers | Nothing | 1–2 hours |
| 2 | Phone OTP auth | Supabase phone provider enabled | 1 day |
| 3 | Listing management (edit/sell/renew) | Nothing | 0.5 day |
| 4 | Seller ratings | Listing management | 1 day |
| 5 | Push notifications for saved searches | Search profiles working | 1 day |
| 6 | Premium payments (Stripe) | Ratings complete | 2 days |

Each step is fully self-contained. If one blocks, skip ahead and return.

---

## STEP 1 — Fix Production Blockers

**Must be done before any other step. These three things prevent the app from deploying.**

### 1.1 — Set DEMO_MODE to false

In `.env.local`:
```bash
DEMO_MODE="false"
NEXT_PUBLIC_APP_URL="https://swipemarket.rs"   # or your Vercel preview URL for staging
```

### 1.2 — Add Prisma to package.json

```bash
npm install --save-dev prisma@^5.0.0
npm install @prisma/client@^5.0.0
```

Then add to `package.json` scripts:
```json
{
  "db:push": "prisma db push",
  "db:generate": "prisma generate",
  "db:studio": "prisma studio"
}
```

Then run:
```bash
npm run db:generate
```

### 1.3 — Fix ESLint config

In `eslint.config.mjs`, change:
```js
// FROM:
import nextConfig from "eslint-config-next/core-web-vitals"
// TO:
import nextConfig from "eslint-config-next/core-web-vitals.js"
```

Then verify:
```bash
npm run lint
```

### 1.4 — Verify Supabase Storage bucket

In the Supabase dashboard:
- Confirm bucket `listing-images` exists
- Confirm it is set to **public** (read access)
- Confirm CORS allows your domain (`https://swipemarket.rs`)

### 1.5 — Pass criteria for Step 1

```
[ ] npm run typecheck → 0 errors
[ ] npm run lint → 0 errors
[ ] npm run build → completes without error
[ ] App loads at localhost:3000 with DEMO_MODE=false showing real Supabase data
[ ] Google OAuth sign-in completes end-to-end
```

---

## STEP 2 — Phone OTP Authentication

**Why:** Serbian marketplace users trust phone number auth over Google OAuth. One phone = one account = standard fraud prevention.

### 2.1 — Enable Supabase Phone Provider

In Supabase Dashboard → Authentication → Providers → Phone:
- Enable Phone provider
- Select **Twilio** as SMS provider
- Enter your Twilio Account SID, Auth Token, and phone number
- Save

Add to `.env.local`:
```bash
# These are used by Supabase internally — you configure them in the dashboard, not here
# But add for reference:
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=+1...
```

### 2.2 — Create `server/api/routers/auth.ts`

```typescript
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { createClient } from '../../lib/supabase/client'

export const authRouter = createTRPCRouter({
  sendOtp: publicProcedure
    .input(z.object({
      phone: z.string().regex(/^\+381[0-9]{8,9}$/, 'Unesite validan srpski mobilni broj (npr. +381641234567)')
    }))
    .mutation(async ({ input }) => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({ phone: input.phone })
      if (error) throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
      return { success: true }
    }),

  verifyOtp: publicProcedure
    .input(z.object({
      phone: z.string().regex(/^\+381[0-9]{8,9}$/),
      token: z.string().length(6).regex(/^\d{6}$/, 'Kod mora imati 6 cifara')
    }))
    .mutation(async ({ input }) => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        phone: input.phone,
        token: input.token,
        type: 'sms'
      })
      if (error) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Neispravan kod. Pokušajte ponovo.' })
      return { success: true, user: data.user }
    }),
})
```

### 2.3 — Register router in `server/api/root.ts`

```typescript
import { authRouter } from './routers/auth'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // ... existing routers
})
```

### 2.4 — Update `app/(auth)/login/page.tsx`

Replace or update the login page to have two steps:

**Step 1 — Phone input:**
- Serbian flag prefix `+381` shown as static prefix
- Input for the rest of the number (8–9 digits)
- "Pošalji kod" button → calls `api.auth.sendOtp.useMutation()`
- On success → show Step 2

**Step 2 — OTP input:**
- 6 individual digit boxes (auto-advance on input)
- "Potvrdi" button → calls `api.auth.verifyOtp.useMutation()`
- "Nisam primio kod" link with 60-second countdown before resend is allowed
- On success → `router.push('/')`

Below both steps, keep a divider and "Nastavi sa Google" button for OAuth fallback.

### 2.5 — Add Serbian phone helpers to `lib/utils.ts`

```typescript
// Converts "064 123 4567" or "0641234567" → "+381641234567"
export function toE164Serbian(local: string): string {
  const digits = local.replace(/\D/g, '')
  if (digits.startsWith('381')) return `+${digits}`
  if (digits.startsWith('0')) return `+381${digits.slice(1)}`
  return `+381${digits}`
}

// Formats "+381641234567" → "064 123 4567" for display
export function formatSerbianPhone(e164: string): string {
  const local = e164.replace('+381', '0')
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
}

// Validates Serbian mobile (06x prefix)
export function isValidSerbianMobile(phone: string): boolean {
  return /^\+3816[0-9]{8}$/.test(phone)
}
```

### 2.6 — Wire PhoneVerification component

`components/profile/PhoneVerification.tsx` already exists as a scaffold.
Wire it to use the `authRouter` procedures and call `supabase.auth.updateUser({ phone })` for adding phone to an existing Google OAuth account.

### 2.7 — Pass criteria for Step 2

```
[ ] User can enter Serbian mobile number and receive SMS with 6-digit code
[ ] Entering correct code signs user in and redirects to home
[ ] Entering wrong code shows "Neispravan kod" error in Serbian
[ ] "Nisam primio kod" link is disabled for 60 seconds after send
[ ] Google OAuth still works as fallback
[ ] User with Google account can add phone via profile page
[ ] Phone number stored in Supabase Auth user metadata
```

---

## STEP 3 — Listing Management (Edit / Mark as Sold / Renew)

**Why:** Sellers need to manage their own listings. Currently there is no way to edit, close, or renew a listing after posting.

### 3.1 — Add tRPC procedures to `server/api/routers/listing.ts`

**`listing.getOwn`** — protected procedure, returns all listings by the current user with status:
```typescript
getOwn: protectedProcedure
  .input(z.object({ status: ListingStatusSchema.optional(), limit: z.number().default(20) }))
  .query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from('listings')
      .select('*, listing_images(*)')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })
    return data ?? []
  }),
```

**`listing.update`** — protected procedure, validates ownership before updating:
```typescript
update: protectedProcedure
  .input(updateListingSchema)  // already in contracts/validators.ts
  .mutation(async ({ ctx, input }) => {
    // 1. Verify ownership
    const { data: existing } = await ctx.supabase
      .from('listings').select('user_id').eq('id', input.id).single()
    if (existing?.user_id !== ctx.user.id)
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Nije vaš oglas' })
    // 2. Run moderation on updated content
    // 3. Update
    const { data, error } = await ctx.supabase
      .from('listings').update({ ...input, updated_at: new Date() })
      .eq('id', input.id).select().single()
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
    return data
  }),
```

**`listing.markSold`** — shortcut to change status to SOLD:
```typescript
markSold: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => { /* verify ownership, set status=SOLD */ }),
```

**`listing.renew`** — resets `expires_at` to now + 30 days, status back to ACTIVE if EXPIRED:
```typescript
renew: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => { /* verify ownership, update expires_at */ }),
```

### 3.2 — Create `app/profile/listings/page.tsx`

Page showing the current user's own listings in tabs:
- **Aktivni** — ACTIVE listings with Edit and Mark as Sold buttons
- **Prodato** — SOLD listings (read-only)
- **Istekli** — EXPIRED listings with Renew button
- **Na čekanju** — PENDING_REVIEW listings

Each listing row: thumbnail + title + price + posted date + status badge + action buttons.

### 3.3 — Create `app/listing/[slug]/edit/page.tsx`

Pre-filled edit form reusing the create listing form components (`ImageUploader`, `DynamicAttributeFields`).
- Loads existing listing data via `api.listing.get.useQuery({ slug })`
- Submits via `api.listing.update.useMutation()`
- Only accessible to the listing owner (redirect others to the detail page)

### 3.4 — Pass criteria for Step 3

```
[ ] Seller can see all their listings at /profile/listings grouped by status
[ ] Seller can edit title, description, price, and images of an ACTIVE listing
[ ] After edit, listing shows updated content immediately
[ ] Seller can mark a listing as SOLD — status badge changes to "Prodato"
[ ] Seller cannot edit another user's listing (403 returned)
[ ] EXPIRED listing shows Renew button — clicking sets new 30-day expiry and status to ACTIVE
[ ] Rate limit still enforced: cannot create more than 5 listings/day even after renew
```

---

## STEP 4 — Seller Ratings

**Why:** Trust and safety. Buyers need to know if a seller is reliable before messaging them.

### 4.1 — Schema change: add Rating model

Add to `prisma/schema.prisma`:
```prisma
model Rating {
  id          String   @id @default(cuid())
  raterId     String
  sellerId    String
  listingId   String
  score       Int      // 1–5
  comment     String?  @db.VarChar(500)
  createdAt   DateTime @default(now())

  rater       User     @relation("RatingsGiven", fields: [raterId], references: [id])
  seller      User     @relation("RatingsReceived", fields: [sellerId], references: [id])
  listing     Listing  @relation(fields: [listingId], references: [id])

  @@unique([raterId, listingId])  // One rating per transaction per rater
  @@index([sellerId])
}
```

Add relations to the User model:
```prisma
ratingsGiven     Rating[] @relation("RatingsGiven")
ratingsReceived  Rating[] @relation("RatingsReceived")
```

Create Supabase migration SQL in `supabase/migrations/`:
```sql
CREATE TABLE "Rating" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "raterId" TEXT NOT NULL REFERENCES "User"(id),
  "sellerId" TEXT NOT NULL REFERENCES "User"(id),
  "listingId" TEXT NOT NULL REFERENCES "Listing"(id),
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment VARCHAR(500),
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("raterId", "listingId")
);
CREATE INDEX rating_seller_idx ON "Rating"("sellerId");
```

### 4.2 — Create `server/api/routers/rating.ts`

```typescript
export const ratingRouter = createTRPCRouter({
  // Submit a rating (buyer rates seller after SOLD transaction)
  create: protectedProcedure
    .input(z.object({
      listingId: z.string(),
      score: z.number().int().min(1).max(5),
      comment: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify listing is SOLD
      // 2. Verify current user is NOT the seller (can't rate yourself)
      // 3. Verify current user had a conversation about this listing (proof of transaction intent)
      // 4. Insert rating
      // 5. Update User.averageRating (computed field or trigger)
    }),

  // Get ratings for a seller (public)
  getBySeller: publicProcedure
    .input(z.object({ sellerId: z.string(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => { /* return paginated ratings with rater info */ }),
})
```

### 4.3 — Add `averageRating` and `ratingCount` to User model

```prisma
averageRating  Float?
ratingCount    Int    @default(0)
```

Update these via a Supabase database function/trigger OR recalculate in the `rating.create` mutation.

### 4.4 — Update `app/profile/[userId]/page.tsx`

Add a ratings section below the seller's listings:
- Star display (1–5, filled/empty)
- Average score + review count: "4.8 ★ (23 recenzije)"
- Last 5 reviews with rater name, score, comment, date
- "Prikaži sve" link to a full ratings page

### 4.5 — Add rating prompt after SOLD

When a listing is marked as SOLD, show a banner to the buyer:
"Jeste li kupili ovaj predmet? Ocenite prodavca →" linking to the rating form.

### 4.6 — Pass criteria for Step 4

```
[ ] Buyer can rate seller 1–5 stars with optional comment after listing is SOLD
[ ] Cannot rate your own listing
[ ] Cannot rate the same listing twice (unique constraint enforced)
[ ] Seller's public profile shows average rating and review count
[ ] Ratings appear on listing cards for premium sellers (star badge)
[ ] Rating count and average update immediately after submission
[ ] Review text is moderated through lib/moderation.ts before saving
```

---

## STEP 5 — Push Notifications for Saved Searches

**Why:** SearchProfile model has `notifyNew` boolean — when a matching new listing is posted, users expect a notification. Currently this is a zombie feature: saved but never triggers anything.

### 5.1 — Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

Add to `.env.local`:
```bash
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_EMAIL="mailto:admin@swipemarket.rs"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."   # Same key, exposed to client for subscription
```

Install dependency:
```bash
npm install web-push
npm install --save-dev @types/web-push
```

### 5.2 — Add `pushSubscription` to User table

Add to `prisma/schema.prisma`:
```prisma
pushSubscription Json?   // Stores browser PushSubscription object
```

Supabase migration:
```sql
ALTER TABLE "User" ADD COLUMN "pushSubscription" JSONB;
```

### 5.3 — Create `app/api/push/subscribe/route.ts`

```typescript
export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await req.json()
  await supabase.from('users').update({ pushSubscription: subscription }).eq('id', user.id)
  return Response.json({ success: true })
}
```

### 5.4 — Create `app/sw.ts` — Service Worker

```typescript
// Handles push events and shows notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
```

Register in `app/layout.tsx`:
```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
}, [])
```

### 5.5 — Create `lib/notifications.ts`

```typescript
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function notifySearchProfileMatches(listingId: string) {
  // 1. Load new listing details
  // 2. Query SearchProfiles where notifyNew=true
  // 3. Filter: listing category/city/price must match profile filters
  // 4. For each matching profile's user: load pushSubscription
  // 5. Call webpush.sendNotification() — fire and forget, catch errors silently
}
```

### 5.6 — Hook into listing creation

In `server/api/routers/listing.ts`, after a listing is created with status ACTIVE:
```typescript
// Fire and forget — don't await, don't block response
notifySearchProfileMatches(newListing.id).catch(console.error)
```

### 5.7 — Pass criteria for Step 5

```
[ ] Browser prompts for notification permission when user creates first saved search
[ ] Permission grant stores PushSubscription in Supabase User record
[ ] When a new ACTIVE listing matches a saved search filter, subscribed user receives push notification
[ ] Notification shows listing title and city as body text
[ ] Clicking notification navigates to the listing detail page
[ ] Notification not sent if user has no pushSubscription stored (graceful skip)
[ ] Failed notifications don't crash the listing create endpoint
```

---

## STEP 6 — Premium Listings via Stripe

**Why:** `is_premium` field is already in the Listing schema and the UI shows the amber badge. Revenue stream needed.

### 6.1 — Install Stripe

```bash
npm install stripe @stripe/stripe-js
```

Add to `.env.local`:
```bash
STRIPE_SECRET_KEY="sk_live_..."          # or sk_test_... for staging
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### 6.2 — Create pricing

In Stripe Dashboard:
- Create a product: "SwipeMarket Premium Oglas"
- Create two prices:
  - 7-day premium: 299 RSD one-time
  - 30-day premium: 999 RSD one-time

Add price IDs to `.env.local`:
```bash
STRIPE_PRICE_7DAY="price_..."
STRIPE_PRICE_30DAY="price_..."
```

### 6.3 — Create `app/api/stripe/checkout/route.ts`

```typescript
// POST: creates a Stripe Checkout Session for premium upgrade
// Input: { listingId, priceId }
// Returns: { url } — redirect to Stripe hosted checkout
// Success URL: /listing/[slug]?premium=success
// Cancel URL: /listing/[slug]
```

### 6.4 — Create `app/api/stripe/webhook/route.ts`

Handles `checkout.session.completed` event:
```typescript
// 1. Verify Stripe signature (STRIPE_WEBHOOK_SECRET)
// 2. Extract listingId and priceId from session metadata
// 3. Set listing.is_premium = true and listing.premium_expires_at = now + 7 or 30 days
// 4. Return 200
```

### 6.5 — Add premium expiry to schema

```prisma
premiumExpiresAt  DateTime?
```

Supabase migration:
```sql
ALTER TABLE "Listing" ADD COLUMN "premium_expires_at" TIMESTAMPTZ;
```

In the listing query, compute `is_premium` dynamically:
```sql
is_premium = premium_expires_at IS NOT NULL AND premium_expires_at > now()
```

### 6.6 — Add "Podigni oglas" button to listing detail

On `app/listing/[slug]/page.tsx`, if current user is the listing owner and listing is not premium:

```tsx
<button onClick={() => router.push(`/api/stripe/checkout?listingId=${listing.id}&priceId=...`)}>
  ⭐ Podigni oglas na premium — 299 RSD (7 dana)
</button>
```

Show two options: 7-day and 30-day with prices.

### 6.7 — Pass criteria for Step 6

```
[ ] Owner of a listing sees "Podigni oglas" button on their listing detail page
[ ] Clicking redirects to Stripe Checkout with correct price
[ ] After successful payment, Stripe webhook sets is_premium=true and premium_expires_at
[ ] Premium listing appears with amber badge in swipe deck and grid
[ ] Premium listings sort to top of listing queries
[ ] After premium_expires_at passes, is_premium computed as false and badge disappears
[ ] Stripe webhook signature verified — rejects invalid requests
[ ] Payment failures handled gracefully (listing stays non-premium, user shown error)
```

---

## Pre-Production Final Checklist

Run through this before cutting the first production release:

### Security
```
[ ] Supabase RLS policies active on ALL tables (verify in Supabase dashboard)
[ ] SUPABASE_SERVICE_ROLE_KEY never exposed to client (grep: "service_role" in app/ should return 0)
[ ] STRIPE_SECRET_KEY never exposed to client (grep: "sk_live" in app/ should return 0)
[ ] Stripe webhook signature verified in /api/stripe/webhook
[ ] All tRPC protected procedures use protectedProcedure (not publicProcedure)
[ ] Content moderation running on listing create and update
[ ] Rate limiting (5 listings/day) enforced at API level
```

### Performance
```
[ ] Images served via Supabase Transform (not full-size originals)
[ ] listing_images joined efficiently (not N+1 queries)
[ ] Exchange rate cached (not fetched on every render)
[ ] Listing list queries paginated (cursor-based, not offset)
```

### UX / Correctness
```
[ ] All user-facing text is in Serbian
[ ] Prices show both RSD and EUR everywhere
[ ] Loading, error, and empty states on every page
[ ] Mobile layout works at 375px width
[ ] Swipe deck works on touch screens (Framer Motion drag)
[ ] Back navigation works correctly in all flows
```

### Deployment
```
[ ] All env vars set in Vercel project settings (not just .env.local)
[ ] DEMO_MODE=false in Vercel env
[ ] NEXT_PUBLIC_APP_URL=https://swipemarket.rs in Vercel env
[ ] Supabase project not on free tier pause (upgrade to Pro if needed)
[ ] listing-images Supabase Storage bucket is public
[ ] Google OAuth redirect URIs include https://swipemarket.rs/auth/callback
[ ] Stripe webhook endpoint registered at https://swipemarket.rs/api/stripe/webhook
[ ] Custom domain configured in Vercel
[ ] CI pipeline green on main branch before deploy
```
