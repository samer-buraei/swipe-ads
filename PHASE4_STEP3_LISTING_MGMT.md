# PHASE 4 — STEP 3: Listing Management (Edit / Mark Sold / Renew)
**Prerequisite:** PHASE4_STEP1_BLOCKERS.md complete
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

## TASK 3.1 — Add listing management procedures to the listing router

**Files to read first:**
- `server/api/routers/listing.ts` (read the whole file — add to the EXISTING router, do not replace it)
- `contracts/validators.ts` (find updateListingSchema — already exists)
- `lib/supabase/types.ts` (check exact column names on the listings table)

**Add these 4 new procedures inside the existing `listingRouter` in `server/api/routers/listing.ts`.**

Find the closing `})` of `createTRPCRouter({...})` and add before it:

```typescript
  /**
   * Get all listings belonging to the current user, grouped by status.
   * Used on the seller's own profile management page.
   */
  getOwn: protectedProcedure
    .input(z.object({
      status: z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SOLD', 'EXPIRED', 'REJECTED', 'REMOVED']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('listings')
        .select('*, listing_images(id, thumb_url, medium_url, order)')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })

      if (input.status) {
        query = query.eq('status', input.status)
      }

      const { data, error } = await query
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      return data ?? []
    }),

  /**
   * Update a listing. Only the owner can update their own listing.
   * Runs content moderation on updated title/description.
   */
  update: protectedProcedure
    .input(updateListingSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership
      const { data: existing, error: fetchError } = await ctx.supabase
        .from('listings')
        .select('user_id, status')
        .eq('id', input.id)
        .single()

      if (fetchError || !existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Oglas nije pronađen.' })
      }
      if (existing.user_id !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Nemate dozvolu da menjate ovaj oglas.' })
      }
      if (!['ACTIVE', 'DRAFT'].includes(existing.status)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ovaj oglas više ne može biti izmenjen.' })
      }

      // 2. Run text moderation if title or description changed
      if (input.title || input.description) {
        const { moderateText } = await import('../../../lib/moderation')
        const textToCheck = [input.title, input.description].filter(Boolean).join(' ')
        const result = await moderateText(textToCheck)
        if (!result.isApproved) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Sadržaj oglasa nije prošao moderaciju. Proverite tekst i pokušajte ponovo.',
          })
        }
      }

      // 3. Update listing
      const { id, ...updateData } = input
      const { data, error } = await ctx.supabase
        .from('listings')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      return data
    }),

  /**
   * Mark a listing as SOLD. Only the owner can do this.
   */
  markSold: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabase
        .from('listings')
        .select('user_id, status')
        .eq('id', input.id)
        .single()

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Oglas nije pronađen.' })
      if (existing.user_id !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Nemate dozvolu.' })
      if (existing.status === 'SOLD') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Oglas je već označen kao prodat.' })

      const { error } = await ctx.supabase
        .from('listings')
        .update({ status: 'SOLD', updated_at: new Date().toISOString() })
        .eq('id', input.id)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      return { success: true }
    }),

  /**
   * Renew an EXPIRED listing. Resets expires_at to 30 days from now and status to ACTIVE.
   */
  renew: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabase
        .from('listings')
        .select('user_id, status')
        .eq('id', input.id)
        .single()

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Oglas nije pronađen.' })
      if (existing.user_id !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Nemate dozvolu.' })
      if (existing.status !== 'EXPIRED') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Samo istekli oglasi mogu biti obnovljeni.' })

      const newExpiry = new Date()
      newExpiry.setDate(newExpiry.getDate() + 30)

      const { error } = await ctx.supabase
        .from('listings')
        .update({
          status: 'ACTIVE',
          expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      return { success: true }
    }),
```

Also make sure `updateListingSchema` is imported at the top of the file. Check the imports section — if it's not there, add it:
```typescript
import { updateListingSchema } from '../../../contracts/validators'
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## TASK 3.2 — Create the seller's listing management page

**Files to read first:**
- `contracts/api.ts` (to understand ListingCard type)
- `lib/supabase/types.ts` (for exact status values)

**Create new file `app/profile/listings/page.tsx`:**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc'
import { Pencil, CheckCircle, RefreshCw, Clock, XCircle, AlertCircle } from 'lucide-react'

type ListingStatus = 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'PENDING_REVIEW' | 'DRAFT' | 'REJECTED'

const TABS: { status: ListingStatus | undefined; label: string; emoji: string }[] = [
  { status: 'ACTIVE',         label: 'Aktivni',     emoji: '✅' },
  { status: 'PENDING_REVIEW', label: 'Na čekanju',  emoji: '⏳' },
  { status: 'EXPIRED',        label: 'Istekli',     emoji: '⌛' },
  { status: 'SOLD',           label: 'Prodato',     emoji: '🤝' },
  { status: 'REJECTED',       label: 'Odbijeni',    emoji: '❌' },
]

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE:         'bg-green-100 text-green-700',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
    EXPIRED:        'bg-gray-100 text-gray-500',
    SOLD:           'bg-blue-100 text-blue-700',
    REJECTED:       'bg-red-100 text-red-600',
    DRAFT:          'bg-gray-100 text-gray-500',
  }
  const labels: Record<string, string> = {
    ACTIVE: 'Aktivan', PENDING_REVIEW: 'Na čekanju',
    EXPIRED: 'Istekao', SOLD: 'Prodato', REJECTED: 'Odbijen', DRAFT: 'Nacrt',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[status] ?? status}
    </span>
  )
}

export default function MyListingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ListingStatus>('ACTIVE')
  const utils = api.useContext()

  const { data: listings, isLoading } = api.listing.getOwn.useQuery({ status: activeTab })

  const markSold = api.listing.markSold.useMutation({
    onSuccess: () => utils.listing.getOwn.invalidate(),
  })
  const renew = api.listing.renew.useMutation({
    onSuccess: () => utils.listing.getOwn.invalidate(),
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Moji oglasi</h1>
        <button
          onClick={() => router.push('/new')}
          className="text-sm bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium"
        >
          + Novi oglas
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(tab => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status as ListingStatus)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.status
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : !listings?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Nema oglasa u ovoj kategoriji</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing: any) => {
            const hero = listing.listing_images?.sort((a: any, b: any) => a.order - b.order)[0]
            return (
              <div
                key={listing.id}
                className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {hero?.thumb_url ? (
                    <img src={hero.thumb_url} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-sm text-gray-900 truncate">{listing.title}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={listing.status} />
                    <span className="text-xs text-gray-400">
                      {new Date(listing.created_at).toLocaleDateString('sr-RS')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-indigo-600">
                    {Number(listing.price).toLocaleString('sr-RS')} {listing.currency}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  {listing.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => router.push(`/listing/${listing.slug}/edit`)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        <Pencil className="w-3 h-3" /> Izmeni
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Označiti oglas kao prodat?')) {
                            markSold.mutate({ id: listing.id })
                          }
                        }}
                        disabled={markSold.isLoading}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3" /> Prodato
                      </button>
                    </>
                  )}
                  {listing.status === 'EXPIRED' && (
                    <button
                      onClick={() => renew.mutate({ id: listing.id })}
                      disabled={renew.isLoading}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" /> Obnovi
                    </button>
                  )}
                  {listing.status === 'PENDING_REVIEW' && (
                    <span className="text-xs text-yellow-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Čeka pregled
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

Then open http://localhost:3000/profile/listings and confirm it loads without errors.

---

## TASK 3.3 — Create the edit listing page

**Files to read first:**
- `app/new/page.tsx` (read the whole file — the edit page reuses the same form structure)
- `components/listings/ImageUploader.tsx` (understand the UploadedImage interface)
- `components/listings/DynamicAttributeFields.tsx` (understand how category attributes work)
- `contracts/validators.ts` (find updateListingSchema)

**Create new file `app/listing/[slug]/edit/page.tsx`:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/trpc'
import { ImageUploader } from '@/components/listings/ImageUploader'
import { DynamicAttributeFields } from '@/components/listings/DynamicAttributeFields'
import { createClient } from '@/lib/supabase/client'
import type { UploadedImage } from '@/components/listings/ImageUploader'

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [attributes, setAttributes] = useState<Record<string, any>>({})
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [isNegotiable, setIsNegotiable] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [condition, setCondition] = useState<string>('GOOD')
  const [error, setError] = useState('')

  // Load current user
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
    })
  }, [])

  // Load existing listing
  const { data: listing, isLoading } = api.listing.get.useQuery({ slug })

  // Populate form when listing loads
  useEffect(() => {
    if (!listing) return
    setTitle(listing.title ?? '')
    setDescription(listing.description ?? '')
    setPrice(String(listing.price ?? ''))
    setCity(listing.city ?? '')
    setIsNegotiable(listing.isNegotiable ?? false)
    setCategoryId(listing.categoryId ?? '')
    setCondition(listing.condition ?? 'GOOD')
    setAttributes(listing.attributes ?? {})
    // Map existing images to UploadedImage shape
    if (listing.images?.length) {
      setImages(listing.images.map((img: any) => ({
        originalUrl: img.originalUrl,
        mediumUrl: img.mediumUrl,
        thumbUrl: img.thumbUrl,
        localPreview: img.mediumUrl,
        uploading: false,
      })))
    }
  }, [listing])

  const updateListing = api.listing.update.useMutation({
    onSuccess: (data) => {
      router.push(`/listing/${data.slug}`)
    },
    onError: (err) => setError(err.message),
  })

  // Redirect if not owner
  useEffect(() => {
    if (listing && currentUserId && listing.seller?.id !== currentUserId) {
      router.replace(`/listing/${slug}`)
    }
  }, [listing, currentUserId])

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
      </div>
    )
  }

  if (!listing) {
    return <p className="text-center py-16 text-gray-400">Oglas nije pronađen.</p>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pendingUploads = images.filter(img => img.uploading)
    if (pendingUploads.length > 0) {
      setError('Sačekajte da se slike učitaju pre slanja.')
      return
    }

    updateListing.mutate({
      id: listing.id,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      city: city.trim(),
      isNegotiable,
      condition: condition as any,
      attributes,
      images: images
        .filter(img => img.originalUrl)
        .map(img => ({ originalUrl: img.originalUrl, mediumUrl: img.mediumUrl, thumbUrl: img.thumbUrl })),
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-xl font-bold text-gray-900">Izmeni oglas</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Images */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <ImageUploader value={images} onChange={setImages} maxImages={15} />
        </div>

        {/* Core fields */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Naslov</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
              required
              placeholder="Npr. iPhone 14 Pro Max 256GB"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Opis</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              required
              placeholder="Opišite predmet, stanje, razlog prodaje..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Cena (RSD)</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                min={0}
                placeholder="5000"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Grad</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
                placeholder="Beograd"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isNegotiable}
              onChange={e => setIsNegotiable(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500"
            />
            <span className="text-sm text-gray-700">Cena je dogovor</span>
          </label>
        </div>

        {/* Condition */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Stanje</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'NEW',      label: 'Novo' },
              { value: 'LIKE_NEW', label: 'Kao novo' },
              { value: 'GOOD',     label: 'Dobro' },
              { value: 'FAIR',     label: 'Prihvatljivo' },
            ].map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCondition(c.value)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  condition === c.value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category-specific attributes */}
        {categoryId && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <DynamicAttributeFields
              categoryId={categoryId}
              value={attributes}
              onChange={setAttributes}
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}

        {/* Submit */}
        <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100">
          <button
            type="submit"
            disabled={updateListing.isLoading}
            className="w-full bg-indigo-500 text-white rounded-2xl py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateListing.isLoading ? 'Čuvanje...' : 'Sačuvaj izmene'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

---

## TASK 3.4 — Add owner action buttons to the listing detail page

**Files to read first:**
- `app/listing/[slug]/page.tsx` (read the whole file — find where the contact button is rendered)

**In `app/listing/[slug]/page.tsx`**, find the section that renders the "Kontaktiraj prodavca" button.
Add owner-specific actions ABOVE the contact button, conditionally shown only when `currentUserId === listing.seller?.id`:

Find the `contactButton` or the button section and wrap it like this:

```tsx
{/* Show different actions depending on whether the viewer is the owner */}
{currentUserId === listing.seller?.id ? (
  <div className="flex gap-2">
    <button
      onClick={() => router.push(`/listing/${listing.slug}/edit`)}
      className="flex-1 border border-indigo-300 text-indigo-600 rounded-2xl py-3.5 font-semibold text-sm hover:bg-indigo-50"
    >
      ✏️ Izmeni oglas
    </button>
    <button
      onClick={() => {
        if (confirm('Označiti oglas kao prodat?')) {
          markSold.mutate({ id: listing.id })
        }
      }}
      disabled={markSold.isLoading || listing.status === 'SOLD'}
      className="flex-1 bg-green-500 text-white rounded-2xl py-3.5 font-semibold text-sm hover:bg-green-600 disabled:opacity-50"
    >
      {listing.status === 'SOLD' ? '✅ Prodato' : '🤝 Označi prodato'}
    </button>
  </div>
) : (
  <button
    onClick={() => startConversation.mutate({ listingId: listing.id, initialMessage: `Zdravo, zainteresovan/a sam za oglas "${listing.title}". Da li je još uvek dostupno?` })}
    disabled={startConversation.isLoading}
    className="w-full bg-indigo-500 text-white rounded-2xl py-3.5 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50"
  >
    {startConversation.isLoading ? 'Učitavanje...' : '💬 Kontaktiraj prodavca'}
  </button>
)}
```

You will also need to add the `markSold` mutation near the other mutations in the page:
```typescript
const markSold = api.listing.markSold.useMutation({
  onSuccess: () => utils.listing.get.invalidate({ slug }),
})
```

And make sure `useRouter` is imported:
```typescript
import { useRouter } from 'next/navigation'
```

**Verify:**
```bash
npm run typecheck
```
Expected: 0 errors.

Then open any listing detail page as its owner and confirm the Edit + Mark Sold buttons appear instead of the Contact button.

---

## Step 3 pass criteria

```
[ ] /profile/listings loads with tabs: Aktivni / Na čekanju / Istekli / Prodato / Odbijeni
[ ] Each listing row shows thumbnail, title, price, status badge, and action buttons
[ ] Owner clicks "Izmeni" → lands on /listing/[slug]/edit with pre-filled form
[ ] Submitting the edit form updates the listing and redirects to the detail page
[ ] "Označi prodato" button marks listing as SOLD — status badge changes immediately
[ ] "Obnovi" button on expired listings resets expiry to 30 days and status to ACTIVE
[ ] Non-owner visiting /listing/[slug]/edit is redirected to the detail page
[ ] Non-owner cannot call listing.markSold or listing.update for someone else's listing (403)
[ ] npm run typecheck → 0 errors
```

**Next:** Open `PHASE4_STEP4_RATINGS.md` or `PHASE4_STEP5_PUSH.md` (these can be done in parallel)
