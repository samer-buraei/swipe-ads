# PHASE 4 — STEP 6: Stripe Premium Payments
**Prerequisite:** PHASE4_STEP3_LISTING_MGMT.md complete (sellers must be able to see their own listings)
**Estimated time:** 5 tasks × ~30 minutes = ~2.5 hours

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

## TASK 6.1 — Install Stripe and configure the dashboard

**Run in terminal:**
```bash
npm install stripe @stripe/stripe-js
```

**Add to `.env.local`:**
```bash
STRIPE_SECRET_KEY="sk_test_..."              # Use test key for dev, live key for production
STRIPE_WEBHOOK_SECRET="whsec_..."            # Get this after creating the webhook (Task 6.4)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_7DAY="price_..."               # Create in Stripe dashboard (below)
STRIPE_PRICE_30DAY="price_..."              # Create in Stripe dashboard (below)
```

**Set up products in the Stripe Dashboard:**
1. Go to https://dashboard.stripe.com/products (use test mode for dev)
2. Click **+ Add product**
3. Name: `SwipeMarket Premium Oglas`
4. Click **Add price** → One time → 299 RSD → Save
5. Click **Add another price** → One time → 999 RSD → Save
6. Copy the two price IDs (they look like `price_1Abc...`) into `.env.local` as `STRIPE_PRICE_7DAY` and `STRIPE_PRICE_30DAY`

**Done when:** `npm install` succeeded and all env vars are set.

---

## TASK 6.2 — Add premiumExpiresAt column to Listing table

**Run this SQL in the Supabase SQL Editor:**

```sql
ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "premium_expires_at" TIMESTAMPTZ;
```

1. Go to https://supabase.com/dashboard → project `awbtohtpjrqlxfoqtita`
2. Click **SQL Editor**
3. Paste and run the SQL above

Also add a migration file so it's tracked:

**Create new file `supabase/migrations/20260301000001_add_premium_expiry.sql`:**
```sql
ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "premium_expires_at" TIMESTAMPTZ;
```

**Done when:** `premium_expires_at` column visible in Supabase Table Editor on the `listings` table.

---

## TASK 6.3 — Create Stripe instance and checkout API route

**Files to read first:**
- `app/api/upload/route.ts` (to see the pattern for authenticated route handlers)
- `lib/supabase/server.ts` (to understand createServerSupabaseClient)

**Create new file `lib/stripe.ts`:**

```typescript
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const STRIPE_PRICES = {
  PREMIUM_7DAY:  process.env.STRIPE_PRICE_7DAY  ?? '',
  PREMIUM_30DAY: process.env.STRIPE_PRICE_30DAY ?? '',
} as const

export const PREMIUM_DURATIONS: Record<string, number> = {
  [process.env.STRIPE_PRICE_7DAY  ?? '']: 7,
  [process.env.STRIPE_PRICE_30DAY ?? '']: 30,
}
```

**Create new file `app/api/stripe/checkout/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Morate biti prijavljeni' }, { status: 401 })
  }

  // 2. Parse request body
  const { listingId, priceId } = await req.json()

  if (!listingId || !priceId) {
    return NextResponse.json({ error: 'listingId and priceId are required' }, { status: 400 })
  }

  // 3. Validate priceId is one of our known prices
  const validPriceIds = Object.values(STRIPE_PRICES)
  if (!validPriceIds.includes(priceId)) {
    return NextResponse.json({ error: 'Nepoznata cena' }, { status: 400 })
  }

  // 4. Verify the listing exists and belongs to this user
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, slug, title, user_id, status')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Oglas nije pronađen' }, { status: 404 })
  }
  if (listing.user_id !== user.id) {
    return NextResponse.json({ error: 'Niste vlasnik ovog oglasa' }, { status: 403 })
  }
  if (listing.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Samo aktivni oglasi mogu biti podignuti na premium' }, { status: 400 })
  }

  // 5. Create Stripe Checkout Session
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price:    priceId,
        quantity: 1,
      },
    ],
    metadata: {
      listingId: listing.id,
      userId:    user.id,
      priceId,
    },
    success_url: `${appUrl}/listing/${listing.slug}?premium=success`,
    cancel_url:  `${appUrl}/listing/${listing.slug}?premium=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## TASK 6.4 — Create the Stripe webhook handler

**Files to read first:**
- `lib/stripe.ts` (just created — use the stripe instance and PREMIUM_DURATIONS from here)
- `lib/supabase/server.ts` (to use createServiceRoleClient for updating listing)

**Create new file `app/api/stripe/webhook/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe, PREMIUM_DURATIONS } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Stripe webhooks must use the raw body — do NOT parse as JSON
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // 1. Verify the webhook signature
  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 2. Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    const listingId = session.metadata?.listingId
    const priceId   = session.metadata?.priceId

    if (!listingId || !priceId) {
      console.error('Webhook: missing metadata', session.metadata)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Calculate expiry based on which price was purchased
    const durationDays = PREMIUM_DURATIONS[priceId]
    if (!durationDays) {
      console.error('Webhook: unknown priceId', priceId)
      return NextResponse.json({ error: 'Unknown price' }, { status: 400 })
    }

    const premiumExpiresAt = new Date()
    premiumExpiresAt.setDate(premiumExpiresAt.getDate() + durationDays)

    // 3. Update the listing — use service role to bypass RLS
    const supabase = createServiceRoleClient()
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        is_premium:         true,
        premium_expires_at: premiumExpiresAt.toISOString(),
        updated_at:         new Date().toISOString(),
      })
      .eq('id', listingId)

    if (updateError) {
      console.error('Webhook: failed to update listing', updateError)
      // Return 500 — Stripe will retry the webhook
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    console.log(`Listing ${listingId} upgraded to premium for ${durationDays} days`)
  }

  // Always return 200 for events we don't handle — Stripe will not retry
  return NextResponse.json({ received: true })
}
```

**Register the webhook in Stripe:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click **+ Add endpoint**
3. Endpoint URL: `https://your-vercel-url.vercel.app/api/stripe/webhook`
   - For local testing, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Select events: `checkout.session.completed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`) into `.env.local` as `STRIPE_WEBHOOK_SECRET`

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## TASK 6.5 — Add "Podigni na Premium" button to listing detail

**Files to read first:**
- `app/listing/[slug]/page.tsx` (read the whole file — find the owner action buttons section from Step 3)

**In `app/listing/[slug]/page.tsx`**, find the owner action buttons (Edit + Mark Sold) from Step 3.

Add the premium upgrade section BELOW the owner action buttons:

First add this state and handler inside the component:
```typescript
const [premiumLoading, setPremiumLoading] = useState<string | null>(null)

const handleUpgradeToPremium = async (priceId: string) => {
  setPremiumLoading(priceId)
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id, priceId }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url // Redirect to Stripe Checkout
    } else {
      alert(data.error ?? 'Greška. Pokušajte ponovo.')
    }
  } catch {
    alert('Greška. Pokušajte ponovo.')
  } finally {
    setPremiumLoading(null)
  }
}
```

Add this UI block below the Edit/MarkSold buttons (only for the owner, only for ACTIVE non-premium listings):
```tsx
{currentUserId === listing?.seller?.id && listing?.status === 'ACTIVE' && !listing?.isPremium && (
  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
    <div>
      <p className="text-sm font-bold text-amber-900">⭐ Podigni oglas na Premium</p>
      <p className="text-xs text-amber-700 mt-0.5">
        Premium oglasi su prikazani na vrhu pretrage i imaju zlatnu oznaku
      </p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => handleUpgradeToPremium(process.env.NEXT_PUBLIC_STRIPE_PRICE_7DAY ?? '')}
        disabled={!!premiumLoading}
        className="bg-amber-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
      >
        {premiumLoading === process.env.NEXT_PUBLIC_STRIPE_PRICE_7DAY ? '...' : (
          <>7 dana<br /><span className="font-normal text-xs">299 RSD</span></>
        )}
      </button>
      <button
        onClick={() => handleUpgradeToPremium(process.env.NEXT_PUBLIC_STRIPE_PRICE_30DAY ?? '')}
        disabled={!!premiumLoading}
        className="bg-amber-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
      >
        {premiumLoading === process.env.NEXT_PUBLIC_STRIPE_PRICE_30DAY ? '...' : (
          <>30 dana<br /><span className="font-normal text-xs">999 RSD</span></>
        )}
      </button>
    </div>
  </div>
)}
```

Also expose the price IDs to the client by adding to `.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PRICE_7DAY="price_..."   # Same as STRIPE_PRICE_7DAY
NEXT_PUBLIC_STRIPE_PRICE_30DAY="price_..."  # Same as STRIPE_PRICE_30DAY
```

Handle the success/cancelled URL params — add this to the component:
```typescript
const searchParams = useSearchParams()
const premiumStatus = searchParams.get('premium')

// Show success/cancelled banner
{premiumStatus === 'success' && (
  <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-sm text-green-700 font-medium">
    ✅ Oglas je uspešno podignut na Premium!
  </div>
)}
{premiumStatus === 'cancelled' && (
  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm text-gray-600">
    Plaćanje je otkazano. Oglas ostaje bez Premium statusa.
  </div>
)}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## Step 6 pass criteria

```
[ ] npm install stripe @stripe/stripe-js completed without errors
[ ] premium_expires_at column visible on listings table in Supabase Table Editor
[ ] Listing owner sees "Podigni na Premium" section with 7-day and 30-day buttons
[ ] Clicking a button redirects to Stripe Checkout (test mode card: 4242 4242 4242 4242)
[ ] After successful test payment, Stripe webhook updates is_premium=true and premium_expires_at
[ ] Premium listing shows ⭐ PREMIUM badge in swipe deck and grid (this was already built)
[ ] Premium listing appears at the top of category listing queries
[ ] After premium_expires_at passes, the badge disappears (is_premium query is dynamic)
[ ] Cancelled payment redirects back to listing with cancellation banner
[ ] Successful payment redirects back to listing with success banner
[ ] Stripe webhook rejects requests with invalid signature (security check)
[ ] npm run typecheck → 0 errors
```

---

## Phase 4 complete — final production checklist

Run through this after all 6 steps are done before going live:

```
SECURITY
[ ] grep -r "service_role" app/ → should return 0 results (service role only in lib/ and server/)
[ ] grep -r "sk_live" app/ → should return 0 results (Stripe secret never in app code)
[ ] DEMO_MODE=false in Vercel environment variables
[ ] Supabase RLS policies enabled on all tables (check in Supabase dashboard)
[ ] Stripe webhook signature verified in /api/stripe/webhook

VERCEL DEPLOYMENT
[ ] All env vars set in Vercel project settings (not just .env.local):
    NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
    DEMO_MODE=false, NEXT_PUBLIC_APP_URL=https://swipemarket.rs
    VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL, NEXT_PUBLIC_VAPID_PUBLIC_KEY
    STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    STRIPE_PRICE_7DAY, STRIPE_PRICE_30DAY, NEXT_PUBLIC_STRIPE_PRICE_7DAY, NEXT_PUBLIC_STRIPE_PRICE_30DAY
    OPENAI_API_KEY (optional), SIGHTENGINE_USER, SIGHTENGINE_SECRET (optional)
[ ] Google OAuth redirect URI includes https://swipemarket.rs/auth/callback in Supabase dashboard
[ ] Stripe webhook endpoint registered for https://swipemarket.rs/api/stripe/webhook
[ ] npm run build completes without errors
[ ] npm run typecheck → 0 errors
[ ] CI pipeline green on main branch
```
