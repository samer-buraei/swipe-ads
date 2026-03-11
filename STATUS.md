# SwipeMarket — Master Collaboration & Review File

> **Version:** 3.0 — fully source-verified (2026-03-09)
> **Purpose:** Every LLM agent, QA reviewer, or developer working on this project reads this first.
> **For active implementation priority and workstreams, read `REVAMP_TODO.md` after this file.**
> **Live site:** https://swipe-ads.vercel.app | **Supabase:** `awbtohtpjrqlxfoqtita`
> **Stack:** Next.js 14 (App Router) · tRPC v10 · Supabase (PostgreSQL + Auth + Storage + Realtime) · Tailwind 4 · Framer Motion 11

---

## QUICK START FOR COLLABORATING AGENTS

```
1. Read this file top to bottom before touching any code.
2. All tRPC procedures: Section 4 — exact names matter (tRPC v10, NOT v11).
3. Every button → code trace: Section 5.
4. All known bugs with fix locations: Section 7.
5. 29-step test plan to verify everything works: Section 8.
6. Key rule: use isLoading on mutations — NEVER isPending (that is tRPC v11).
7. Key rule: report status values are ACTION_TAKEN | DISMISSED — never RESOLVED.
8. Key rule: active Next.js config is next.config.mjs — next.config.ts does NOT exist.
```

---

## 1. All Routes & Pages

> Every page verified by reading the source file. Routes that are in `ROUTES` constants but have no page file are flagged.

| Route | File | What it renders | Auth required |
|-------|------|-----------------|---------------|
| `/` | `app/page.tsx` | **Home.** Hero + inline search bar + category filter pills (toggle) + "Najnoviji oglasi" listing grid. Buttons link to `/quick-browse` and `/new`. | No |
| `/quick-browse` | `app/quick-browse/page.tsx` | **Swipe Deck.** Tinder-style card stack. Calls `api.swipe.getDeck`. LEFT = skip, RIGHT = save to favorites. Shows instruction text in Serbian. | Yes (redirects to `/login`) |
| `/search` | `app/search/page.tsx` | **Search.** Full-text query + collapsible filter panel (category, conditions, min/max price, city). Active filter chips with X to remove. | No |
| `/listing/[slug]` | `app/listing/[slug]/page.tsx` | **Detail.** Hero image (50vh), description, RSD+EUR price, seller card, contact/rate/report buttons, gallery if >1 image. | No (contact requires auth) |
| `/listing/[slug]/edit` | `app/listing/[slug]/edit/page.tsx` | **Edit.** Owner-only. Title, desc, price, city, condition fields. | Yes |
| `/new` | `app/new/page.tsx` | **Create listing.** Multi-step form: images → info → category attributes. Up to 5 images, 5 listings/day limit. | Yes |
| `/favorites` | `app/favorites/page.tsx` | **Saved.** Grid of favorited listings. Empty state with heart icon + link to search. | Yes |
| `/messages` | `app/messages/page.tsx` | **Inbox.** Split layout — ConversationList (left) + ConversationView (right). Mobile: panels toggle. | Yes |
| `/messages/[id]` | `app/messages/[id]/page.tsx` | **Conversation.** Product snippet, message thread, real-time updates. Input has image button (⚠️ no handler — not wired). | Yes |
| `/profile` | `app/profile/page.tsx` | **Own profile.** Edit name/city/bio inline, phone OTP widget, my listings with management actions, settings/logout. | Yes |
| `/profile/[userId]` | `app/profile/[userId]/page.tsx` | **Public profile.** Read-only. Seller info + their active listings. | No |
| `/admin` | `app/admin/page.tsx` | **Admin dashboard.** Approve/reject PENDING_REVIEW listings. Resolve/dismiss reports. Admin-only (`is_admin = true`). | Yes + admin |
| `/search-profiles` | `app/search-profiles/page.tsx` | **Saved searches.** Create/delete saved search profiles. Push notification opt-in per profile. | Yes |
| `/login` | `app/(auth)/login/page.tsx` | **Login.** Phone OTP (primary, Serbian +381). Google OAuth (secondary). | No |
| `/register` | `app/(auth)/register/page.tsx` | **Register page.** File exists. ⚠️ Route listed in `ROUTES` constant — needs verification of whether it's linked anywhere or is a dead route. | No |

### Routes in `ROUTES` constant with no page file
```
ROUTES.category → /category/[id]   — no page file found
ROUTES.user     → /user/[id]       — no page file; actual public profile is /profile/[userId]
```

---

## 2. Navigation Structure

### Bottom Nav — 5 tabs (mobile, exact order)
```
┌──────────┬──────────┬────────────┬──────────┬──────────┐
│ 🏠        │ ✨        │    ➕       │ 👤        │ 💬        │
│ Početna  │  Swipe   │    Novo    │  Profil  │  Poruke  │
│    /     │/quick-   │    /new    │ /profile │/messages │
│          │ browse   │            │          │          │
└──────────┴──────────┴────────────┴──────────┴──────────┘
```

### Header — Desktop (hidden on mobile)
```
[S SwipeMarket]  [🔍 Pretraži oglase...]   Swipe · Omiljeni · Poruke · [Profil|Prijavi se]   [➕ Postavi oglas]
                                          /quick-browse /favorites /messages  /profile|/login       /new
```
- **Auth-reactive:** Shows "Profil" when logged in, "Prijavi se" when logged out via `supabase.auth.onAuthStateChange`

---

## 3. All API Endpoints

### 3a. tRPC (POST /api/trpc/[router].[procedure])
> See Section 4 for full procedure details.

### 3b. REST API Routes (not tRPC)

| Method | Endpoint | File | What it does |
|--------|----------|------|--------------|
| `POST` | `/api/upload` | `app/api/upload/route.ts` | Upload image to Supabase Storage. Auth required. Returns `{ id: storagePath, url, originalUrl, mediumUrl, thumbUrl }` — all URL fields are the same plain public URL (no transform params — paid Supabase feature). Max 10MB. Accepts jpeg/png/webp. |
| `GET` | `/api/exchange-rate` | `app/api/exchange-rate/route.ts` | Fetches EUR/RSD rate from `frankfurter.app`. 24-hour ISR cache. Falls back to `117.5` if external API fails. Response: `{ rate: number, updatedAt: string, cached?: boolean }` |
| `POST` | `/api/push/subscribe` | `app/api/push/subscribe/route.ts` | Saves browser push subscription to `push_subscriptions` table. Auth required. Input: `{ subscription: { endpoint, keys: { p256dh, auth } } }`. Upserts on `(user_id, endpoint)`. |
| `GET` | `/auth/callback` | `app/auth/callback/route.ts` | Handles Supabase OAuth redirect. Exchanges `code` param for session via `supabase.auth.exchangeCodeForSession(code)`. Redirects to `next` param (default `/`) on success, `/auth/error` on failure. |

### 3c. Service Worker

| File | What it does |
|------|--------------|
| `public/sw.js` | Handles web push `push` events: shows browser notification with title, body, icon (`/icon-192.png`), and `url` data. On `notificationclick`: opens `url` from notification data. |

---

## 4. All tRPC Procedures

> **Router key → exact procedure name.** Use `api.[router].[procedure]` in components.
> tRPC v10: `mutation.isLoading` for loading state — **NEVER** `mutation.isPending`.

### `api.auth`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `sendOtp` | mutation | public | Sends 6-digit SMS OTP to a Serbian phone number (must be +381 format) |
| `verifyOtp` | mutation | public | Verifies SMS code. Returns `{ accessToken, refreshToken }` — caller must run `supabase.setSession(tokens)` client-side |
| `addPhone` | mutation | 🔒 required | Adds/changes phone on an existing Google OAuth account via OTP |

### `api.listing`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `get` | query | public | Fetch single listing by `{ id }` or `{ slug }`. Increments `view_count` (fire-and-forget). Returns `ListingDetail`. |
| `list` | query | public | Paginated list. Filters: `query` (FTS), `categoryId`, `city`, `conditions[]`, `minPrice`, `maxPrice`, `userId`, `excludeSwiped`, `sortBy`, `sortOrder`. Sorts premium first. |
| `create` | mutation | 🔒 required | Create listing. Rate-limits (5/day). Runs text + image moderation (OpenAI + Sightengine, optional). Sends push notifications to matching saved searches. Returns `{ id, slug, status }`. |
| `update` | mutation | 🔒 required | Update own listing. Fields: title, description, price, city, condition, imageIds, attributes. |
| `changeStatus` | mutation | 🔒 required | Set own listing status to `SOLD` or `ACTIVE` only. |
| `delete` | mutation | 🔒 required | Soft-delete own listing (sets status to `REMOVED`). |
| `myListings` | query | 🔒 required | All listings by current user, all statuses, no filters. |

### `api.swipe`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `record` | mutation | 🔒 required | Record a swipe. Direction: `LEFT`, `RIGHT`, or `UP`. RIGHT automatically adds to favorites inside the server procedure. |
| `getDeck` | query | 🔒 required | Returns up to 20 unswiped, ACTIVE listings. Excludes own listings and already-swiped listings. |

### `api.favorite`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `toggle` | mutation | 🔒 required | Add or remove a listing from favorites. Returns `{ isFavorited: boolean }`. |
| `list` | query | 🔒 required | Paginated list of user's favorited listings. |

### `api.message`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `listConversations` | query | 🔒 required | All conversations for current user with last message + unread count. |
| `getConversation` | query | 🔒 required | Full conversation by `conversationId`: all messages, listing info, other user details. |
| `send` | mutation | 🔒 required | Send a message. Creates conversation if none exists. Rate-limited (50/hr). Pass `conversationId` to skip expensive RLS lookup. Returns `{ messageId, conversationId }`. |
| `markRead` | mutation | 🔒 required | Mark all messages in a conversation as read (sets `read_at`). |

### `api.user`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `me` | query | 🔒 required | Current user with stats: `activeListings`, `totalListings`, `favoritesCount`. |
| `get` | query | public | Public profile by `{ userId }` with up to 6 recent active listings. |
| `update` | mutation | 🔒 required | Update `name`, `phone`, `city`, `bio`, `phoneVerifiedAt`. |

### `api.category`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `list` | query | public | All categories with `listingCount` per category. |
| `getAttributes` | query | public | Category-specific form field definitions (label, type, options) for a given `categoryId`. Used in `/new` to show dynamic fields. |

### `api.report`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `create` | mutation | 🔒 required | Report a listing or user. Reasons: `SPAM`, `SCAM`, `PROHIBITED_ITEM`, `WRONG_CATEGORY`, `DUPLICATE`, `OFFENSIVE`, `OTHER`. Rate-limited (10/day). Listing auto-hidden after 3 reports. |

### `api.searchProfile`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `list` | query | 🔒 required | All saved search profiles for current user. Max 5 per user. |
| `create` | mutation | 🔒 required | Create saved search. Fields: name, keywords[], city, minPrice, maxPrice, conditions[], notifyNew. ⚠️ Bug: see Section 7 Bug-3. |
| `delete` | mutation | 🔒 required | Delete a saved search by `id`. |

### `api.admin` — requires `is_admin = true` in `public.users` table
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `getQueue` | query | 🔒 admin | Lists all listings with status `PENDING_REVIEW`. |
| `approveListing` | mutation | 🔒 admin | Sets listing status to `ACTIVE`. |
| `rejectListing` | mutation | 🔒 admin | Sets listing status to `REJECTED`. |
| `getReports` | query | 🔒 admin | Lists all `PENDING` reports. |
| `resolveReport` | mutation | 🔒 admin | Sets report status to `ACTION_TAKEN` or `DISMISSED`. **Never** `RESOLVED` — that value does not exist. |

### `api.rating`
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `create` | mutation | 🔒 required | Rate a seller 1–5 stars with optional comment. One rating per user per listing. Self-rating prevented. |
| `list` | query | public | Paginated ratings received by a user (cursor-based). |
| `summary` | query | public | Returns `{ average, count, breakdown: [{score, count}] }` for a user. |

---

## 5. Button / Feature → Code Map

> Complete trace: UI element → handler → tRPC/REST call → DB table.

### Home Page (`/`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| Category pill (toggle) | `setCategoryId(id)` | Re-triggers `api.listing.list.useQuery({ categoryId })` | `listings` |
| "Resetuj filtere" button | `setQuery(''); setCategoryId(undefined)` | Re-triggers `api.listing.list.useQuery({})` | `listings` |
| "Quick Browse" button | `router.push(ROUTES.quickBrowse)` | Navigate | — |
| "Postavi oglas" button | `router.push(ROUTES.newListing)` | Navigate | — |
| "Swipe prikaz →" link | `Link href={ROUTES.quickBrowse}` | Navigate | — |
| Listing card click | `Link href={ROUTES.listing(slug)}` | Navigate | — |
| ❤️ heart on card | `api.favorite.toggle.mutate({ listingId })` | `POST /api/trpc/favorite.toggle` | `favorites` |

### Quick Browse (`/quick-browse`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| Swipe LEFT (drag or button) | `handleSwipe('LEFT')` | `api.swipe.record.mutate({ listingId, direction: 'LEFT' })` | `swipe_events` |
| Swipe RIGHT (drag or button) | `handleSwipe('RIGHT')` | `api.swipe.record.mutate({ listingId, direction: 'RIGHT' })` | `swipe_events` + `favorites` |
| Undo button | `setCards(prev => [lastSwiped, ...prev])` | Local state only — swipe event is NOT un-recorded in DB | — |
| Empty deck "Refresh" | `refetch()` | `api.swipe.getDeck.useQuery` refetch | `listings`, `swipe_events` |
| Card tap/info | Navigate to `/listing/[slug]` | — | — |

### Listing Detail (`/listing/[slug]`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| ❤️ favorite (header) | `handleFavoriteClick()` | `api.favorite.toggle.mutate({ listingId })` | `favorites` |
| Share button | `handleShare()` | `navigator.share()` or `navigator.clipboard.writeText()` | — |
| ← back | `router.back()` | Navigate | — |
| "Kontaktiraj prodavca" | `handleContact()` | `api.message.send.mutate({ listingId, receiverId, content })` → redirect to `/messages/[id]` | `conversations`, `messages` |
| "Oceni prodavca" link | `setShowRateModal(true)` | Opens `<RateSellerModal>` | — |
| Star rating submit | `api.rating.create.mutate({ toUserId, listingId, score, comment })` | `POST /api/trpc/rating.create` | `ratings` |
| "Prijavi oglas" | Opens `<ReportModal>` | `api.report.create.mutate({ listingId, reason })` | `reports` |
| "Ovo je vaš oglas" (owner) | `router.push(ROUTES.profile)` | Navigate | — |

### Create Listing (`/new`)
| Element | Handler | Calls | DB / Storage |
|---------|---------|-------|--------------|
| Image drop zone / pick | `handleFiles(files)` | `POST /api/upload` (per file) | `listing-images` bucket |
| Remove image (×) | `removeImage(index)` | Revokes blob URL, removes from local state | — |
| Category pill | `handleCategoryChange(id)` | `api.category.getAttributes.useQuery({ categoryId })` | `category_attributes` |
| Dynamic attribute field | `handleAttributeChange(name, value)` | Updates local `attributes` state | — |
| "Postavi oglas" submit | `handleSubmit()` | `api.listing.create.mutate({ title, description, price, currency, categoryId, condition, city, imageIds, attributes })` | `listings`, `listing_images`, `push_subscriptions` |

### Edit Listing (`/listing/[slug]/edit`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| Any field change | Local state | — | — |
| "Sačuvaj" button | Submit handler | `api.listing.update.mutate({ id, ...fields })` | `listings` |
| ← cancel | `router.back()` | Navigate | — |

### Messages — Inbox (`/messages`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| Conversation row click | `setSelectedId(id)` / navigate | `api.message.getConversation.useQuery({ conversationId })` | `messages`, `conversations` |
| Auto mark-read | `useEffect` on open | `api.message.markRead.mutate({ conversationId })` | `messages` |

### Messages — Conversation (`/messages/[id]`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| ← back | `router.back()` | Navigate | — |
| "Vidi oglas" link | `router.push(ROUTES.listing(slug))` | Navigate | — |
| Image button (📷) | ⚠️ **No handler — not implemented** | — | — |
| More button (⋮) | ⚠️ **No handler — not implemented** | — | — |
| Message textarea Enter | `handleSend()` | `api.message.send.mutate({ listingId, receiverId, content, conversationId })` | `messages`, `conversations` |
| Real-time updates | `useRealtimeMessages` hook | `supabase.channel('messages:'+id).on('postgres_changes', …).subscribe()` | Realtime |

### Own Profile (`/profile`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| ✏️ edit icon | `setIsEditing(true)` | Local state | — |
| "Sačuvaj" (save profile) | `handleSave()` | `api.user.update.mutate({ name, city, bio })` | `users` |
| "Otkaži" (cancel edit) | `setIsEditing(false)` | Local state | — |
| Phone verification widget | See `PhoneVerification.tsx` | `api.auth.sendOtp` → `api.auth.addPhone` or `api.auth.verifyOtp` | `users` |
| "Izmeni" (edit listing) | `router.push('/listing/'+slug+'/edit')` | Navigate | — |
| "Prodato" button | `changeStatus.mutate({ id, status: 'SOLD' })` | `api.listing.changeStatus` | `listings` |
| "Reaktiviraj" button | `changeStatus.mutate({ id, status: 'ACTIVE' })` | `api.listing.changeStatus` | `listings` |
| "Obriši" button | confirm → `deleteListing.mutate({ id })` | `api.listing.delete` | `listings` |
| "Prikaži sve oglase" | `setShowAll(true)` | Local state | — |
| "Podešavanja naloga" | ⚠️ **Not clickable — display only** | — | — |
| "Premium nalog" | ⚠️ **No handler — not wired to payment** | — | — |
| "Admin Panel" (admin only) | `router.push('/admin')` | Navigate | — |
| "Odjavi se" | `handleSignOut()` | `supabase.auth.signOut()` → redirect `/login` | Supabase Auth |

### Admin Dashboard (`/admin`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| "Odobri" button | `approve.mutate({ id })` | `api.admin.approveListing` | `listings` |
| "Odbij" button | `reject.mutate({ id })` | `api.admin.rejectListing` | `listings` |
| "Reši" (resolve report) | `resolve.mutate({ id, status: 'ACTION_TAKEN' })` | `api.admin.resolveReport` | `reports` |
| "Otkaži" (dismiss report) | `resolve.mutate({ id, status: 'DISMISSED' })` | `api.admin.resolveReport` | `reports` |

### Saved Searches (`/search-profiles`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| Enable notifications button | `handleEnableNotifications()` | `navigator.requestPermission()` → `POST /api/push/subscribe` | `push_subscriptions` |
| "Sačuvaj pretragu" | `create.mutate({ name, keywords, city, … })` | `api.searchProfile.create` | `search_profiles` |
| 🗑️ delete search | `delete.mutate({ id })` | `api.searchProfile.delete` | `search_profiles` |

### Login (`/login`)
| Element | Handler | Calls | DB |
|---------|---------|-------|-----|
| "Pošalji kod" | `sendOtp.mutate({ phone })` | `api.auth.sendOtp` | Supabase Auth (SMS) |
| "Potvrdi" | `verifyOtp.mutate({ phone, token })` → `supabase.setSession(tokens)` | `api.auth.verifyOtp` | Supabase Auth |
| "Nastavi sa Google" | `supabase.auth.signInWithOAuth({ provider: 'google' })` | OAuth redirect → `/auth/callback` | Supabase Auth |

---

## 6. Full Data Flow Diagrams

### System Overview
```
BROWSER (Next.js 14, React 18)
│
├── app/page.tsx            → api.listing.list          → listings + listing_images + users
├── app/quick-browse/       → api.swipe.getDeck          → listings + swipe_events
├── app/search/             → api.listing.list (filtered)
├── app/listing/[slug]/     → api.listing.get            → listing + images + users
│                           → api.rating.summary         → ratings
│                           → api.message.send           → conversations + messages
├── app/new/                → POST /api/upload           → Storage (listing-images bucket)
│                           → api.listing.create         → listings + listing_images
├── app/messages/           → api.message.listConversations → conversations + messages + users
├── app/messages/[id]/      → api.message.getConversation   → messages + listing + users
│                           → Supabase Realtime channel  (postgres_changes on messages INSERT)
├── app/profile/            → api.user.me                → users
│                           → api.listing.myListings     → listings
├── app/profile/[userId]/   → api.user.get               → users + listings
├── app/favorites/          → api.favorite.list          → favorites + listings
├── app/admin/              → api.admin.getQueue         → listings
│                           → api.admin.getReports       → reports
├── app/search-profiles/    → api.searchProfile.list     → search_profiles
│                           → POST /api/push/subscribe   → push_subscriptions
└── app/login/              → api.auth.sendOtp/verifyOtp → Supabase Auth SMS
                            → supabase.auth.signInWithOAuth → Google → /auth/callback

Each tRPC call → POST /api/trpc/[router].[procedure]
                 → server/api/routers/[router].ts
                 → one of two Supabase clients:
                   ┌─ createServerSupabaseClient() ── RLS enforced, user JWT, used for SELECTs
                   └─ createServiceRoleClient()    ── bypasses RLS, used for INSERTs/UPDATEs
                        ↓
                   Supabase PostgreSQL (project: awbtohtpjrqlxfoqtita)
```

### Image Upload Flow
```
User selects file → <ImageUploader> component
  → uploadFile(file) → POST /api/upload (FormData)
    → app/api/upload/route.ts:
      1. Verify auth via createServerSupabaseClient().auth.getUser()
      2. Validate: type (jpeg/png/webp), size (max 10MB)
      3. Generate path: userId/timestamp-random.ext
      4. supabase.storage.from('listing-images').upload(path, bytes) — service role
      5. getPublicUrl(path) → plain public URL (no ?width= params — paid feature)
      6. Return { id: data.path, url: publicUrl, originalUrl, mediumUrl, thumbUrl }
         (all URL fields identical — plain public URL)
  ← Component stores { id: storagePath, url, localPreview: blobURL }

On form submit → api.listing.create.mutate({ imageIds: images.map(i => i.id) })
  → server/api/routers/listing.ts create procedure:
    1. INSERT listing row (service role)
    2. For each imageId (storage path):
       base = NEXT_PUBLIC_SUPABASE_URL + /storage/v1/object/public/listing-images/ + imageId
       INSERT listing_images { listing_id, original_url: base, medium_url: base, thumb_url: base, order: index }
    3. Return { id, slug, status }

On display → api.listing.list / api.listing.get
  → toListingCard(row) in server/api/helpers.ts:
    images sorted by `order` column ASC
    heroImage = images[0] → { thumbUrl, mediumUrl } = listing_images.medium_url
  → <Image src={heroImage.mediumUrl} /> — Next.js Image (hostname in remotePatterns ✅)
```

### Auth Flow
```
Phone OTP:                              Google OAuth:
  /login                                  /login
  → sendOtp({ phone: '+381...' })         → supabase.auth.signInWithOAuth('google')
  → Supabase sends SMS                    → Google consent screen
  → User enters 6-digit code              → Redirects to /auth/callback?code=...
  → verifyOtp({ phone, token })           → app/auth/callback/route.ts:
  → Server returns { accessToken,           supabase.auth.exchangeCodeForSession(code)
    refreshToken }                          → session cookie set
  → Client: supabase.setSession(tokens)   → redirect to next (default '/')
  → Session persisted in browser

Route protection (NO server middleware — was deleted; caused Vercel deploy failures):
  Each protected page: useEffect → supabase.auth.getUser() → redirect /login if null
  Header: supabase.auth.onAuthStateChange → shows "Profil" or "Prijavi se"
```

### Real-time Messaging Flow
```
User opens /messages/[id]
  → useRealtimeMessages(conversationId) hook mounts
  → supabase.channel('messages:' + conversationId)
      .on('postgres_changes', { event: 'INSERT', table: 'messages',
           filter: 'conversation_id=eq.' + conversationId }, handler)
      .subscribe()
  → Initial load: api.message.getConversation.useQuery({ conversationId })
  → Auto-mark-read: api.message.markRead.mutate({ conversationId }) on mount

User sends message:
  → api.message.send.mutate({ content, conversationId, listingId, receiverId })
  → Server: INSERT into messages (service role client)
  → Supabase fires postgres_changes INSERT event on `messages` table
  → All subscribers on that channel receive new message
  → UI appends message without page refresh
  → api.message.listConversations invalidated to update inbox
```

### Push Notification Flow
```
User opts in (/search-profiles):
  → navigator.requestPermission() → "granted"
  → serviceWorker.pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC_KEY })
  → POST /api/push/subscribe { subscription: { endpoint, keys } }
  → INSERT push_subscriptions (user_id, endpoint, p256dh, auth)

Listing posted by another user:
  → api.listing.create procedure (server)
  → Queries search_profiles WHERE notify_on_new = true AND (city match or null)
  → Filters by keyword match + category match in JS
  → For each matching user_id: fetch push_subscriptions
  → sendPushNotification(sub, { title, body, url }) via lib/push.ts + web-push library
  → If sub expired (410 status): DELETE push_subscriptions WHERE endpoint = ...

Notification received:
  → public/sw.js push event handler fires
  → showNotification(title, { body, icon: '/icon-192.png', data: { url } })
  → On click: open url in client window
```

---

## 7. Database Schema

> Tables in Supabase PostgreSQL. RLS enabled on all tables.

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | `id UUID PK`, `email`, `name`, `phone`, `city`, `is_verified`, `is_admin`, `is_banned`, `avg_rating`, `total_ratings`, `listing_count_today`, `created_at` | Synced from `auth.users` via `handle_new_user` trigger on first login |
| `listings` | `id TEXT PK`, `slug TEXT UNIQUE`, `title`, `description`, `price DECIMAL`, `currency`, `condition item_condition`, `status listing_status`, `category_id TEXT→categories`, `city`, `user_id UUID→users`, `attributes JSONB`, `is_premium BOOL`, `view_count INT`, `moderation_score`, `created_at` | `status` default: `DRAFT`. Moderation sets `PENDING_REVIEW`. |
| `listing_images` | `id TEXT PK`, `listing_id TEXT→listings`, `original_url TEXT NOT NULL`, `medium_url TEXT`, `thumb_url TEXT`, `order INT DEFAULT 0`, `created_at` | RLS: public SELECT (`USING true`), owner INSERT/UPDATE/DELETE |
| `categories` | `id TEXT PK`, `name`, `icon`, `order INT`, `is_active BOOL` | Seeded: 10 categories |
| `category_attributes` | `id`, `category_id→categories`, `name`, `label`, `type`, `options JSONB`, `is_required BOOL`, `order INT` | Seeded: ~47 rows across all categories |
| `favorites` | `id TEXT PK`, `user_id UUID→users`, `listing_id TEXT→listings`, `created_at` | UNIQUE(user_id, listing_id) |
| `swipe_events` | `id TEXT PK`, `user_id UUID→users`, `listing_id TEXT→listings`, `direction swipe_direction`, `time_spent_ms INT`, `created_at` | UNIQUE(user_id, listing_id) |
| `conversations` | `id TEXT PK`, `listing_id TEXT→listings`, `created_at` | |
| `conversation_participants` | `id`, `conversation_id TEXT→conversations`, `user_id UUID→users` | UNIQUE(conversation_id, user_id) |
| `messages` | `id TEXT PK`, `conversation_id TEXT→conversations`, `sender_id UUID→users`, `content TEXT`, `read_at TIMESTAMPTZ`, `created_at` | `read_at NULL` = unread |
| `reports` | `id TEXT PK`, `reporter_id UUID→users`, `listing_id TEXT→listings`, `reported_user_id UUID→users`, `reason report_reason`, `details TEXT`, `status report_status DEFAULT 'PENDING'`, `resolved_at`, `created_at` | |
| `ratings` | `id TEXT PK`, `from_user_id UUID→users`, `to_user_id UUID→users`, `listing_id TEXT→listings`, `score INT (1-5)`, `comment TEXT`, `created_at` | One per (from_user, listing) |
| `search_profiles` | `id TEXT PK`, `user_id UUID→users`, `name`, `category_ids TEXT[]`, `price_min`, `price_max`, `city`, `radius_km`, `keywords TEXT[]`, `conditions TEXT[]`, `notify_on_new BOOL`, `created_at` | Max 5 per user |
| `push_subscriptions` | `id`, `user_id UUID→users`, `endpoint TEXT UNIQUE`, `p256dh TEXT`, `auth TEXT`, `created_at` | UNIQUE(user_id, endpoint) |

### DB Enums
| Enum | Values |
|------|--------|
| `listing_status` | `DRAFT`, `PENDING_REVIEW`, `ACTIVE`, `SOLD`, `EXPIRED`, `REJECTED`, `REMOVED` |
| `item_condition` | `NEW`, `LIKE_NEW`, `GOOD`, `FAIR` |
| `swipe_direction` | `LEFT`, `RIGHT`, `UP` |
| `report_reason` | `SPAM`, `SCAM`, `PROHIBITED_ITEM`, `WRONG_CATEGORY`, `DUPLICATE`, `OFFENSIVE`, `OTHER` |
| `report_status` | `PENDING`, `ACTION_TAKEN`, `DISMISSED` ← only valid values in code |

---

## 8. Feature Status

### ✅ Complete & Working
| Feature | Entry Point |
|---------|-------------|
| Google OAuth login | `/login` → "Nastavi sa Google" |
| Phone OTP login (Serbian +381) | `/login` → phone input |
| Test credentials: `0641112222` / `123456` | Supabase test number |
| Home grid with search + category filter | `/` |
| Swipe deck (LEFT skip, RIGHT save) | `/quick-browse` |
| Full-text search + multi-filter | `/search` |
| Create listing (images + rate limit + moderation) | `/new` |
| Edit own listing | `/listing/[slug]/edit` |
| Mark listing sold / reactivate | `/profile` |
| Soft-delete listing | `/profile` |
| Listing detail page (hero, description, seller) | `/listing/[slug]` |
| Favorite / unfavorite (toggle) | Cards + detail page |
| Saved favorites list | `/favorites` |
| Send first message from listing | `/listing/[slug]` |
| Conversation inbox | `/messages` |
| Real-time messaging (Supabase Realtime) | `/messages/[id]` |
| Own profile (edit name/city/bio) | `/profile` |
| Phone verification on profile | `/profile` → PhoneVerification widget |
| Public profile view | `/profile/[userId]` |
| Seller ratings (1–5 stars + comment) | `/listing/[slug]` |
| Report listing | `/listing/[slug]` |
| Admin: approve/reject listings | `/admin` |
| Admin: resolve/dismiss reports | `/admin` |
| Saved searches (create/delete, max 5) | `/search-profiles` |
| Push notification opt-in | `/search-profiles` |
| Push notify on matching new listing | Triggered by `listing.create` server procedure |
| Dynamic category-specific fields | `/new` form |
| EUR/RSD dual currency (live rate) | All listing cards (via `/api/exchange-rate`) |
| Premium listing badge (amber ring) | All listing cards |
| Content moderation (optional, graceful) | `lib/moderation.ts` — OpenAI + Sightengine |
| Rate limiting (5 listings/day, 50 msg/hr, 10 reports/day) | tRPC routers |

### ⚠️ Exists But Has Issues

| Feature | Problem | File + Line | Fix |
|---------|---------|-------------|-----|
| Demo listing images | 6 seeded listings have no `listing_images` rows → "Nema slike" | `supabase-schema.sql` (missing INSERT) | Run `add-demo-images.sql` in Supabase SQL Editor |
| Hero image on detail | Blank gray area — possible broken URLs from before transform-param fix, or slow load | `app/listing/[slug]/page.tsx` line 129 | Check browser DevTools → Network → `/_next/image` requests |
| `searchProfile.create` keywords | `data.keywords.split(',')` called on `TEXT[]` — returns wrong type | `server/api/routers/searchProfile.ts` ~line 71 | Change to `data.keywords ?? []` |
| `/quick-browse` title | "Quick Browse" shown in English | `app/quick-browse/page.tsx` | Change to Serbian e.g. "Prelistaj brzo" |
| Image button in chat | 📷 button exists in `/messages/[id]` input bar but has **no handler** | `app/messages/[id]/page.tsx` | Either wire image sharing or remove the button |
| More button in chat | ⋮ button exists in chat header but has **no handler** | `app/messages/[id]/page.tsx` | Either wire menu or remove the button |
| "Premium nalog" in profile | Row exists in settings but **no payment handler** | `app/profile/page.tsx` | Wire to future payment flow or remove |
| "Podešavanja naloga" in profile | Row exists but **not clickable** — display only | `app/profile/page.tsx` | Either link to a settings page or remove |

### ❌ Not Built / Intentionally Removed

| Feature | Reason |
|---------|--------|
| Stripe / payment for premium | Not supported in Serbia. "Promoviši" button removed. |
| Custom domain `swipemarket.rs` | Manual step — owner must connect in Vercel dashboard. |
| Server-side auth middleware | Deleted permanently — exceeded Vercel Edge bundle limit, caused deploy failures. Auth is client-side `useEffect` only. |
| Sentry / error monitoring | Never configured. Server errors: Vercel dashboard → Functions → Logs. Client errors: browser console. |
| `/register` page | File exists but likely a stub — not linked from login page. |
| `/category/[id]` page | Route in constants but no page file. |

---

## 9. Known Bugs (Detail + Exact Fix)

### 🔴 BUG-1 — Demo listings have no images
**Where it shows:** Home grid, `/quick-browse`, everywhere listing cards appear
**Root cause:** `supabase-schema.sql` seeds 6 `listings` rows but zero `listing_images` rows for them.
**Fix:** Run `add-demo-images.sql` once in Supabase SQL Editor. The script uses `NOT EXISTS` guard — safe to re-run.
```sql
-- Already created at: C:\Users\sam\Desktop\swipemarket\add-demo-images.sql
```

### 🔴 BUG-2 — Hero image blank on detail page
**Where it shows:** `/listing/[slug]` — top gray area where full-width image should be
**Symptoms:** Hero is gray, but gallery thumbnails at bottom may render (meaning `data.images` is non-empty)
**Likely cause:** Listing(s) uploaded before the `?width=` transform-param fix may have URLs like `https://....supabase.co/storage/v1/object/public/listing-images/...?width=800&quality=80` stored in `listing_images.medium_url`. Supabase returns 400/404 for transform params on the free tier. The Next.js `<Image>` component fails silently, leaving the gray background visible.
**To diagnose:**
1. Browser DevTools → Network tab → filter `/_next/image` → look for non-200 responses
2. Supabase SQL Editor: `SELECT medium_url FROM listing_images LIMIT 10;` — verify no `?width=` in URLs
3. If URLs have `?width=`: `UPDATE listing_images SET medium_url = split_part(medium_url, '?', 1), thumb_url = split_part(thumb_url, '?', 1) WHERE medium_url LIKE '%?%';`

### 🟡 BUG-3 — searchProfile.create returns wrong keywords
**File:** `server/api/routers/searchProfile.ts` line ~71
**Wrong code:** `keywords: data.keywords ? data.keywords.split(',') : []`
**Problem:** `data.keywords` is a `TEXT[]` from Postgres. Calling `.split(',')` on a JS array coerces it to a string first (via `.toString()`) then splits — result is a single-element array like `["keyword1,keyword2"]` instead of `["keyword1", "keyword2"]`.
**Fix:** `keywords: data.keywords ?? []`

### 🟡 BUG-4 — "Quick Browse" page title in English
**File:** `app/quick-browse/page.tsx`
**Fix:** Change heading text "Quick Browse" to Serbian equivalent e.g. "Prelistaj brzo"

### 🟡 BUG-5 — Dead UI elements in conversation view
**File:** `app/messages/[id]/page.tsx`
**Elements:**
- 📷 image upload button in message input — no `onClick` handler
- ⋮ more-options button in header — no `onClick` handler
**Fix:** Either wire them to functionality (image sharing, message options menu) or remove from UI

---

## 10. Component Inventory

> Every component file in `components/`. Do not modify `components/ui/*` — these are base primitives.

| File | Purpose | Used in |
|------|---------|---------|
| `components/layout/AppShell.tsx` | Main layout wrapper — wraps all pages | `app/layout.tsx` |
| `components/layout/BottomNav.tsx` | 5-tab mobile bottom navigation | `AppShell.tsx` |
| `components/layout/Header.tsx` | Top bar — logo, search, nav links, auth state | `AppShell.tsx` |
| `components/listings/ListingCard.tsx` | Single listing card — image, price, title, city, condition, heart | `ListingGrid`, `favorites/page`, `profile/page` |
| `components/listings/ListingGrid.tsx` | Responsive grid wrapper with infinite scroll | `app/page.tsx`, `app/search/page.tsx`, `app/favorites/page.tsx` |
| `components/listings/SwipeDeck.tsx` | Tinder-style card stack with Framer Motion gestures | `app/quick-browse/page.tsx` |
| `components/listings/ImageUploader.tsx` | Drag-drop image upload UI — calls `POST /api/upload` | `app/new/page.tsx` |
| `components/listings/DynamicAttributeFields.tsx` | Dynamic form fields per category from DB | `app/new/page.tsx` |
| `components/listings/ReportModal.tsx` | Report listing modal — reason selection + submit | `app/listing/[slug]/page.tsx` |
| `components/messages/ConversationList.tsx` | Inbox list of conversations | `app/messages/page.tsx` |
| `components/messages/ConversationView.tsx` | Chat thread view with real-time messages | `app/messages/page.tsx` |
| `components/messages/useRealtimeMessages.ts` | Hook — Supabase Realtime channel subscription | `ConversationView.tsx` |
| `components/profile/PhoneVerification.tsx` | OTP widget to add/change phone number | `app/profile/page.tsx` |
| `components/ratings/RatingStars.tsx` | Star display (score + count, size variants) | `app/listing/[slug]/page.tsx`, `app/profile/[userId]/page.tsx` |
| `components/ratings/RateSellerModal.tsx` | Interactive 1–5 star picker + comment textarea | `app/listing/[slug]/page.tsx` |
| `components/search/SearchBar.tsx` | Debounced search input with recent history | `components/layout/Header.tsx` |
| `components/ui/badge.tsx` | Badge primitive | Many |
| `components/ui/button.tsx` | Button primitive | Many |
| `components/ui/card.tsx` | Card primitive | Many |
| `components/ui/input.tsx` | Input primitive | Many |
| `components/ui/skeleton.tsx` | Loading skeleton | Many |
| `components/ui/textarea.tsx` | Textarea primitive | Many |

---

## 11. 29-Step Test Plan

> **Run in this exact order.** Report ✅ PASS or ❌ FAIL + exact error text.
> **Setup:** Session A = OTP user (0641112222/123456). Session B = Google user in incognito.

| # | Test | Steps | Pass Criteria |
|---|------|-------|---------------|
| 1 | Site loads | `https://swipe-ads.vercel.app` | Renders < 5s. Bottom nav (5 tabs). No error text on screen. |
| 2 | Home grid | Same page | "Najnoviji oglasi" section shows listing cards |
| 3 | Category filter | Click e.g. "Elektronika" pill on home | Grid re-renders filtered to that category |
| 4 | Search on home | Type "macbook" in search bar | Grid updates (matches or empty state) |
| 5 | Reset filters | "Resetuj filtere" button | Query cleared, all listings show again |
| 6 | Phone OTP login | Session A: `/login` → `0641112222` → "Pošalji kod" → `123456` → "Potvrdi" | Redirected to `/`. Header shows "Profil". |
| 7 | Google OAuth | Session B (incognito): `/login` → "Nastavi sa Google" → pick account | Redirected to `/` logged in as different user. |
| 8 | Swipe deck | Session A → bottom nav "Swipe" → `/quick-browse` | Card stack of listings appears. Serbian instruction text visible. |
| 9 | Swipe LEFT | Drag card past left threshold or press × button | Card animates off left. Next card appears. No console errors. |
| 10 | Swipe RIGHT | Drag card past right threshold or press ❤ button | Card animates off right. Added to favorites (verify in step 15). |
| 11 | Undo swipe | Press undo button after swipe | Last card returns to front of deck. |
| 12 | Create listing | Session A: `/new` → fill title (min 3 chars), desc (min 10), price, pick category, condition, city → upload 2+ images → "Postavi oglas" | Redirect to `/listing/[slug]`. No error toast. |
| 13 | Image on detail | On new listing detail page | Hero image visible (not gray). If >1 image, gallery row visible below description. |
| 14 | Image on grid | Navigate to `/` | New listing card shows thumbnail image (not "Nema slike") |
| 15 | Favorites | Check `/favorites` after step 10 right-swipe | Swiped listing appears in favorites grid. |
| 16 | Listing detail | Click any listing card | Detail page loads: hero, price (RSD + EUR), description, seller card, buttons. |
| 17 | Contact seller | Session B opens Session A's listing → "Kontaktiraj prodavca" | Redirect to `/messages/[id]`. Opening message shown in thread. |
| 18 | Reply (realtime) | Session A: `/messages` → find conversation from B → type reply → Enter | Session B's open conversation updates without page refresh. |
| 19 | Inbox unread | Before Session A opens conversation | Session B's inbox shows unread badge on conversation. |
| 20 | Rate seller | Session B on Session A's listing → "Oceni prodavca" | Star modal opens. Select 4 stars. Submit. Rating count updates on seller card. |
| 21 | Report listing | Any listing → "Prijavi oglas" → pick reason → submit | Modal closes. No error. (Verify in admin: report appears in queue.) |
| 22 | Edit listing | Session A: own listing → edit icon or `/listing/[slug]/edit` → change price → "Sačuvaj" | Detail page shows updated price after redirect. |
| 23 | Mark as sold | Session A: `/profile` → listing row → "Prodato" | Listing status changes to SOLD. "Reaktiviraj" button appears. |
| 24 | Reactivate | `/profile` → same listing → "Reaktiviraj" | Status changes back to ACTIVE. |
| 25 | Admin login | Log in as `samer.buraei@gmail.com` → `/profile` → "Admin Panel" | `/admin` loads. Shows moderation queue. Shows reports list. |
| 26 | Admin approve | `/admin` → click "Odobri" on a pending listing | Listing disappears from queue. Status changes to ACTIVE. |
| 27 | Search filters | `/search` → type query + set category + set condition → apply | Results respect all filters. Filter chips shown. |
| 28 | Saved search | `/search-profiles` → create search with keyword "laptop" → save | Profile appears in list with correct keywords. |
| 29 | Public profile | Click seller name/avatar on a listing | `/profile/[userId]` loads with seller info and their listings. No edit controls visible. |

---

## 12. Environment Variables

```bash
# Required — app will not start without these
NEXT_PUBLIC_SUPABASE_URL="https://awbtohtpjrqlxfoqtita.supabase.co"   ✅ Set in Vercel
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."                                     ✅ Set in Vercel
SUPABASE_SERVICE_ROLE_KEY="..."                                         ✅ Set in Vercel
DEMO_MODE="false"                                                        ✅ Set in Vercel
NEXT_PUBLIC_APP_URL="https://swipe-ads.vercel.app"                      ✅ Set in Vercel

# Optional — app degrades gracefully if missing
OPENAI_API_KEY="..."                   ⚠️ Text moderation — skipped if absent
SIGHTENGINE_USER="..."                 ⚠️ Image moderation — skipped if absent
SIGHTENGINE_SECRET="..."               ⚠️ Image moderation — skipped if absent
VAPID_SUBJECT="..."                    ⚠️ Push notifications — skipped if absent
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."     ⚠️ Push notifications — skipped if absent
VAPID_PRIVATE_KEY="..."                ⚠️ Push notifications — skipped if absent
```

---

## 13. Deployment & Ops

| Item | Status | Notes |
|------|--------|-------|
| Live URL | ✅ https://swipe-ads.vercel.app | Auto-deploys from `main` on GitHub push |
| Build errors ignored | ✅ | `typescript.ignoreBuildErrors: true`, `eslint.ignoreDuringBuilds: true` in `next.config.mjs` |
| Active config file | ✅ `next.config.mjs` | `next.config.ts` was deleted — only valid in Next.js 15+ |
| Middleware | ❌ Deleted | Was causing Vercel internal deploy failures (Edge bundle too large). Auth is client-side `useEffect` only. |
| Admin user SQL | ⚠️ Manual | `UPDATE users SET is_admin = true WHERE email = 'samer.buraei@gmail.com';` |
| Auth redirect URLs | ✅ Set | `https://swipe-ads.vercel.app/auth/callback` + `https://swipe-ads.vercel.app/**` in Supabase Auth → URL Configuration |
| Demo listing images | ⚠️ Missing | Run `add-demo-images.sql` in Supabase SQL Editor |
| Possible broken image URLs | ⚠️ Check | Run `SELECT medium_url FROM listing_images LIMIT 10;` to check for `?width=` in stored URLs |
| Custom domain | ⏳ Not done | `swipemarket.rs` not connected — manual step via Vercel dashboard |
| Error monitoring | ⏳ Not done | No Sentry configured |

---

## 14. Key File Reference

| If you're changing… | Read/edit these files |
|--------------------|----------------------|
| Any DB query / API shape | `contracts/validators.ts` + `contracts/api.ts` + relevant router |
| Listing create/display | `server/api/routers/listing.ts`, `server/api/helpers.ts`, `components/listings/ListingCard.tsx` |
| Image upload | `app/api/upload/route.ts`, `components/listings/ImageUploader.tsx` |
| Swipe behavior | `components/listings/SwipeDeck.tsx`, `server/api/routers/swipe.ts` |
| Messaging | `server/api/routers/message.ts`, `components/messages/ConversationView.tsx`, `components/messages/useRealtimeMessages.ts` |
| Auth | `lib/supabase/server.ts`, `server/api/trpc.ts`, `app/(auth)/login/page.tsx`, `app/auth/callback/route.ts` |
| Phone OTP | `server/api/routers/auth.ts`, `components/profile/PhoneVerification.tsx`, `lib/utils.ts` (toE164Serbian) |
| Ratings | `server/api/routers/rating.ts`, `components/ratings/RateSellerModal.tsx`, `components/ratings/RatingStars.tsx` |
| Admin | `server/api/routers/admin.ts`, `app/admin/page.tsx` |
| Saved searches + push | `server/api/routers/searchProfile.ts`, `app/search-profiles/page.tsx`, `lib/push.ts`, `app/api/push/subscribe/route.ts`, `public/sw.js` |
| Exchange rate | `app/api/exchange-rate/route.ts`, `lib/hooks/useExchangeRate.ts` |
| Styling | `app/globals.css`, `postcss.config.mjs` (Tailwind 4 config) |
| Navigation | `components/layout/BottomNav.tsx`, `components/layout/Header.tsx` |

---

## 15. Immediate Action Items

| Priority | Action | How |
|----------|--------|-----|
| 🔴 1 | Add images to demo listings | Run `add-demo-images.sql` in Supabase SQL Editor |
| 🔴 2 | Check for `?width=` in stored image URLs | `SELECT medium_url FROM listing_images LIMIT 10;` — if found, run the UPDATE in Bug-2 above |
| 🔴 3 | Verify admin user set | `SELECT email, is_admin FROM users WHERE email = 'samer.buraei@gmail.com';` |
| 🟡 4 | Fix `searchProfile.create` keywords bug | `server/api/routers/searchProfile.ts` ~line 71 |
| 🟡 5 | Fix "Quick Browse" English title | `app/quick-browse/page.tsx` heading |
| 🟡 6 | Decide on dead buttons in chat | Remove 📷 and ⋮ buttons, or implement image sharing / message options |
| 🟡 7 | Decide on "Premium nalog" | Wire to payment flow or remove from profile settings |
| 🟢 8 | Connect `swipemarket.rs` domain | Vercel dashboard → Settings → Domains |
| 🟢 9 | Add Sentry error tracking | Optional production monitoring |
