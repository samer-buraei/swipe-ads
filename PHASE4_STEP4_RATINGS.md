# PHASE 4 — STEP 4: Seller Ratings
**Prerequisite:** PHASE4_STEP3_LISTING_MGMT.md complete (sellers must be able to mark listings as SOLD)
**Estimated time:** 4 tasks × ~30 minutes = ~2 hours

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

## TASK 4.1 — Run the database migration for the Rating table

**Files to read first:** `prisma/schema.prisma` (understand existing models and relations)

**Create new file `supabase/migrations/20260301000000_add_ratings.sql`:**

```sql
-- Create Rating table
CREATE TABLE IF NOT EXISTS "Rating" (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "raterId"    TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "sellerId"   TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "listingId"  TEXT        NOT NULL REFERENCES "Listing"(id) ON DELETE CASCADE,
  score        INTEGER     NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment      VARCHAR(500),
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("raterId", "listingId")
);

CREATE INDEX IF NOT EXISTS rating_seller_idx ON "Rating"("sellerId");
CREATE INDEX IF NOT EXISTS rating_rater_idx  ON "Rating"("raterId");

-- Add rating summary columns to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "averageRating" FLOAT,
  ADD COLUMN IF NOT EXISTS "ratingCount"   INTEGER NOT NULL DEFAULT 0;
```

**Run this migration in Supabase:**
1. Go to https://supabase.com/dashboard → project `awbtohtpjrqlxfoqtita`
2. Click **SQL Editor** in the left sidebar
3. Paste the SQL above and click **Run**
4. Confirm: no errors in the output panel

**Done when:** You can see the `Rating` table in the Supabase Table Editor, and `averageRating` and `ratingCount` columns appear on the `User` table.

---

## TASK 4.2 — Create the rating tRPC router

**Files to read first:**
- `server/api/trpc.ts` (to understand protectedProcedure and publicProcedure)
- `server/api/routers/listing.ts` (to understand how ownership checks are done — follow the same pattern)

**Create new file `server/api/routers/rating.ts`:**

```typescript
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { moderateText } from '../../../lib/moderation'

export const ratingRouter = createTRPCRouter({
  /**
   * Submit a rating for a seller after purchasing their listing.
   * Rules:
   * - Listing must be SOLD
   * - Rater cannot be the seller
   * - Rater must have had a conversation about this listing (proof of interest)
   * - One rating per (rater, listing) pair
   */
  create: protectedProcedure
    .input(z.object({
      listingId: z.string().min(1),
      score: z.number().int().min(1, 'Minimalna ocena je 1').max(5, 'Maksimalna ocena je 5'),
      comment: z.string().max(500, 'Komentar ne sme biti duži od 500 znakova').optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Load the listing
      const { data: listing, error: listingErr } = await ctx.supabase
        .from('listings')
        .select('id, user_id, status, title')
        .eq('id', input.listingId)
        .single()

      if (listingErr || !listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Oglas nije pronađen.' })
      }
      if (listing.status !== 'SOLD') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Možete oceniti prodavca samo za prodate oglase.' })
      }
      if (listing.user_id === ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Ne možete oceniti sami sebe.' })
      }

      // 2. Check rater had a conversation about this listing
      const { data: conversation } = await ctx.supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', input.listingId)
        .contains('participant_ids', [ctx.user.id])
        .maybeSingle()

      if (!conversation) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Možete oceniti prodavca samo ako ste kontaktirali u vezi ovog oglasa.',
        })
      }

      // 3. Moderate comment text if provided
      if (input.comment) {
        const modResult = await moderateText(input.comment)
        if (!modResult.isApproved) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Komentar sadrži neprikladni sadržaj. Proverite tekst i pokušajte ponovo.',
          })
        }
      }

      // 4. Insert the rating
      const { data: newRating, error: insertErr } = await ctx.supabase
        .from('Rating')
        .insert({
          raterId:   ctx.user.id,
          sellerId:  listing.user_id,
          listingId: input.listingId,
          score:     input.score,
          comment:   input.comment ?? null,
        })
        .select()
        .single()

      if (insertErr) {
        if (insertErr.code === '23505') {
          throw new TRPCError({ code: 'CONFLICT', message: 'Već ste ocenili ovog prodavca za ovaj oglas.' })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: insertErr.message })
      }

      // 5. Recalculate seller's average rating
      const { data: allRatings } = await ctx.supabase
        .from('Rating')
        .select('score')
        .eq('sellerId', listing.user_id)

      if (allRatings && allRatings.length > 0) {
        const avg = allRatings.reduce((sum: number, r: any) => sum + r.score, 0) / allRatings.length
        await ctx.supabase
          .from('users')
          .update({
            averageRating: Math.round(avg * 10) / 10,
            ratingCount:   allRatings.length,
          })
          .eq('id', listing.user_id)
      }

      return { success: true, ratingId: newRating.id }
    }),

  /**
   * Get all ratings for a seller. Public — anyone can see a seller's ratings.
   */
  getBySeller: publicProcedure
    .input(z.object({
      sellerId: z.string().min(1),
      limit:    z.number().int().min(1).max(50).default(10),
      cursor:   z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('Rating')
        .select(`
          id, score, comment, createdAt,
          rater:raterId ( id, name, avatarUrl:image )
        `)
        .eq('sellerId', input.sellerId)
        .order('createdAt', { ascending: false })
        .limit(input.limit + 1)

      if (input.cursor) {
        query = query.lt('createdAt', input.cursor)
      }

      const { data, error } = await query
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      const items = data ?? []
      const hasMore = items.length > input.limit
      if (hasMore) items.pop()

      return {
        items,
        nextCursor: hasMore ? items[items.length - 1]?.createdAt : undefined,
        hasMore,
      }
    }),

  /**
   * Check if the current user has already rated a specific listing.
   * Used to decide whether to show the "Rate this seller" prompt.
   */
  hasRated: protectedProcedure
    .input(z.object({ listingId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from('Rating')
        .select('id')
        .eq('raterId', ctx.user.id)
        .eq('listingId', input.listingId)
        .maybeSingle()

      return { hasRated: !!data }
    }),
})
```

**Now register the router in `server/api/root.ts`.**

Add the import at the top:
```typescript
import { ratingRouter } from './routers/rating'
```

Add to the router object:
```typescript
rating: ratingRouter,
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## TASK 4.3 — Add ratings display to the public profile page

**Files to read first:**
- `app/profile/[userId]/page.tsx` (read the whole file — you will add sections to it)

**In `app/profile/[userId]/page.tsx`**, add the ratings section after the listings section:

First, add a star display helper function at the top of the file (outside the component):
```typescript
function StarRating({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const starSize = size === 'lg' ? 'text-xl' : 'text-sm'
  return (
    <div className={`flex gap-0.5 ${starSize}`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= Math.round(score) ? 'text-amber-400' : 'text-gray-200'}>
          ★
        </span>
      ))}
    </div>
  )
}
```

Add the query inside the component (alongside the existing user profile query):
```typescript
const { data: ratingsData, isLoading: ratingsLoading } = api.rating.getBySeller.useQuery(
  { sellerId: userId, limit: 5 },
  { enabled: !!userId }
)
```

Add the ratings section in the JSX, after the user's active listings section:
```tsx
{/* Ratings section */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <h2 className="text-base font-bold text-gray-900">Recenzije</h2>
    {profile?.ratingCount > 0 && (
      <div className="flex items-center gap-1.5">
        <StarRating score={profile.averageRating} />
        <span className="text-sm font-semibold text-gray-700">{profile.averageRating?.toFixed(1)}</span>
        <span className="text-xs text-gray-400">({profile.ratingCount})</span>
      </div>
    )}
  </div>

  {ratingsLoading ? (
    <div className="space-y-2">
      {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  ) : !ratingsData?.items.length ? (
    <div className="text-center py-8 text-gray-400">
      <p className="text-3xl mb-2">⭐</p>
      <p className="text-sm">Još nema recenzija</p>
    </div>
  ) : (
    <div className="space-y-3">
      {ratingsData.items.map((rating: any) => (
        <div key={rating.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                {rating.rater?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm font-medium text-gray-700">{rating.rater?.name ?? 'Korisnik'}</span>
            </div>
            <div className="flex items-center gap-1">
              <StarRating score={rating.score} />
            </div>
          </div>
          {rating.comment && (
            <p className="text-sm text-gray-600 leading-relaxed">{rating.comment}</p>
          )}
          <p className="text-xs text-gray-400">
            {new Date(rating.createdAt).toLocaleDateString('sr-RS')}
          </p>
        </div>
      ))}
    </div>
  )}
</div>
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## TASK 4.4 — Add "Rate this seller" prompt on SOLD listings

**Files to read first:**
- `app/listing/[slug]/page.tsx` (find where the listing detail renders — you will add the rating form here)

**In `app/listing/[slug]/page.tsx`**, add the rating prompt when the listing is SOLD and the current user is NOT the seller but had a conversation:

Add these queries inside the page component:
```typescript
const { data: hasRatedData } = api.rating.hasRated.useQuery(
  { listingId: listing?.id ?? '' },
  { enabled: !!listing?.id && !!currentUserId && listing?.seller?.id !== currentUserId && listing?.status === 'SOLD' }
)

const [ratingScore, setRatingScore] = useState(0)
const [ratingComment, setRatingComment] = useState('')
const [ratingError, setRatingError] = useState('')

const submitRating = api.rating.create.useMutation({
  onSuccess: () => {
    setRatingScore(0)
    setRatingComment('')
    utils.rating.hasRated.invalidate({ listingId: listing?.id })
  },
  onError: (err) => setRatingError(err.message),
})
```

Add the rating UI below the contact/owner action buttons, only shown when:
- Listing status is SOLD
- Current user is not the seller
- Current user has not already rated

```tsx
{listing?.status === 'SOLD' && currentUserId && currentUserId !== listing?.seller?.id && !hasRatedData?.hasRated && (
  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
    <p className="text-sm font-semibold text-amber-800">Jeste li kupili ovaj predmet? Ocenite prodavca!</p>

    {/* Star picker */}
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => setRatingScore(n)}
          className={`text-3xl transition-transform ${n <= ratingScore ? 'text-amber-400 scale-110' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
    </div>

    {ratingScore > 0 && (
      <>
        <textarea
          value={ratingComment}
          onChange={e => setRatingComment(e.target.value)}
          placeholder="Opišite iskustvo sa prodavcem (opciono)..."
          rows={2}
          maxLength={500}
          className="w-full text-sm border border-amber-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300 bg-white resize-none"
        />
        {ratingError && <p className="text-xs text-red-500">{ratingError}</p>}
        <button
          onClick={() => submitRating.mutate({
            listingId: listing.id,
            score: ratingScore,
            comment: ratingComment.trim() || undefined,
          })}
          disabled={submitRating.isLoading}
          className="w-full bg-amber-500 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {submitRating.isLoading ? 'Slanje...' : 'Pošalji ocenu'}
        </button>
      </>
    )}
  </div>
)}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## Step 4 pass criteria

```
[ ] Rating table exists in Supabase — visible in Table Editor
[ ] averageRating and ratingCount columns exist on User table
[ ] Seller public profile shows star rating and review count when ratings exist
[ ] Seller public profile shows 5 most recent reviews with rater name, stars, comment, date
[ ] SOLD listing detail shows "Ocenite prodavca" prompt to non-owner buyers
[ ] Clicking a star highlights it and shows comment textarea + submit button
[ ] Submitting a rating saves to DB and hides the prompt
[ ] Submitting same listing rating twice returns "Već ste ocenili" error
[ ] Rating with comment text passing moderation saves successfully
[ ] Seller's averageRating and ratingCount update after submission
[ ] npm run typecheck → 0 errors
```

**Next:** Open `PHASE4_STEP5_PUSH.md` or `PHASE4_STEP6_STRIPE.md`
