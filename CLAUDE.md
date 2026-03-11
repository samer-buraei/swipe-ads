# CLAUDE.md — SwipeMarket Codebase Context

> Read this file before making any changes. It is the authoritative reference for all AI coding agents.
> **For current project status, verified bug inventory, and active backlog → read `AGENTS.md`, `STATUS.md`, and `REVAMP_TODO.md` after this file.**
> **This file is primarily the codebase map and implementation guardrail file. Do not treat old feature-completeness claims here as the canonical product status.**
> Last updated: 2026-03-11

---

## What This App Is

**SwipeMarket** is a Serbian classifieds marketplace (like KupujemProdajem / Halo Oglasi) with a Tinder-style swipe interface for browsing listings. Users swipe right to save and left to skip. They can also browse in a traditional grid, post listings, message sellers, and manage their profile.

**Target market:** Serbian-speaking users. All UI text must be in Serbian.
**Prices:** Displayed in both RSD (primary) and EUR (secondary, via live exchange rate).

---

## Current Project Status

**Phase:** Deployed MVP foundation. Core routes, routers, auth, storage, messaging, ratings, and admin basics exist, but the product is not feature-complete.

### Current Reality

- The app is live at `https://swipe-ads.vercel.app`.
- Google OAuth, phone OTP, image upload, posting, messaging, ratings, and basic admin flows all exist.
- The main problem is not missing architecture. The main problem is incomplete buyer, seller, and admin interaction loops.
- Many features are in a partial state: backend exists but UI is thin, UI exists but is not wired, or the route exists but the loop is not complete.
- The active backlog for these gaps is `REVAMP_TODO.md`.
- The source-verified route/API/button map and known bugs are in `STATUS.md`.
- Deployment history, environment caveats, and what previously did or did not work are in `AGENTS.md`.

### What Is Stable Enough To Reuse

- Supabase Auth: Google OAuth + phone OTP
- Supabase Storage upload flow
- Core tRPC router structure
- Basic listing CRUD and listing status changes
- Favorites, swipe recording, messaging, ratings, reports, saved searches, admin queue/report resolution
- RSD/EUR display flow
- Content moderation hooks and rate limiting

### What Is Still Incomplete

- Swipe inspection loop and real undo behavior
- Listing detail depth: gallery, structured specs, breadcrumbs, phone reveal, stronger trust block
- Messaging completeness: reliable dedup, clear read state, attachments, conversation management
- Seller operating loop: full inventory management, better edit flow, media control, analytics, renew/bump
- Profile trust surfaces and public-profile linkage
- Saved-search relevance and discoverability
- User-level admin operations, audit trail, and broader trust/safety tooling
- Several fake or dead affordances in UI

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 14.2.18 |
| UI | React | 18.3.1 |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 4.x |
| Animation | Framer Motion | 11.x |
| API Layer | tRPC | **10.45.2** |
| Data Fetching | TanStack Query | 4.36.1 |
| Validation | Zod | 3.24.1 |
| Auth | Supabase Auth | — |
| Database | Supabase (PostgreSQL) | — |
| ORM/Schema | Prisma | 5.x (schema reference only, Supabase client used for queries) |
| Storage | Supabase Storage | — |
| Realtime | Supabase Realtime | — |
| Icons | Lucide React | 0.460.0 |
| Dates | date-fns | 4.x |
| Testing | Vitest + Playwright | latest |
| Deployment | Vercel | — |

**Critical version notes:**
- tRPC is **v10** — use `isLoading` for mutation state, **NOT** `isPending` (that is tRPC v11/React 19)
- React Query is v4 — NOT v5
- Do NOT upgrade these without a full migration plan

---

## Quick Start

### Demo Mode (no Supabase needed)

```bash
npm install
# Ensure .env.local has DEMO_MODE="true"
npm run dev
# Open http://localhost:3000
```

Demo mode uses mock data from `lib/mock-data.ts`. No real auth, no real database.

### Full Mode (Supabase connected)

```bash
npm install

# .env.local must contain:
# NEXT_PUBLIC_SUPABASE_URL="https://awbtohtpjrqlxfoqtita.supabase.co"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
# SUPABASE_SERVICE_ROLE_KEY="..."
# DEMO_MODE="false"
# NEXT_PUBLIC_APP_URL="http://localhost:3000"

npm run dev
```

No Docker. No local PostgreSQL. Everything runs through Supabase.

---

## Available Commands

```bash
# Development
npm run dev           # Start dev server on http://localhost:3000
npm run build         # Production build
npm run start         # Start production server

# Quality
npm run typecheck     # TypeScript check (must be 0 errors before committing)
npm run lint          # ESLint

# Testing
npm run test          # Run all tests (unit + e2e)
npm run test:unit     # Vitest unit tests
npm run test:e2e      # Playwright E2E tests

# Database (Prisma — schema reference only)
npm run db:generate   # Regenerate Prisma client types
```

---

## File Structure

```
swipemarket/
├── app/                          # Next.js App Router — all pages and API routes
│   ├── (auth)/                   # Auth pages (not protected by middleware)
│   │   └── login/page.tsx        # Phone OTP (primary) + Google OAuth (fallback)
│   ├── api/
│   │   ├── auth/                 # Supabase auth helpers
│   │   ├── exchange-rate/        # EUR/RSD rate endpoint (24h cache)
│   │   ├── trpc/[trpc]/          # tRPC HTTP handler
│   │   └── upload/route.ts       # Image upload → Supabase Storage
│   ├── auth/callback/route.ts    # OAuth redirect handler
│   ├── admin/page.tsx            # Admin dashboard (approve listings, resolve reports)
│   ├── favorites/page.tsx        # Saved listings
│   ├── listing/
│   │   └── [slug]/
│   │       ├── page.tsx          # Listing detail (seller card, ratings, contact, report)
│   │       └── edit/page.tsx     # Edit own listing (title, description, price, city, condition)
│   ├── messages/
│   │   ├── page.tsx              # Conversations list
│   │   └── [id]/page.tsx         # Conversation view
│   ├── new/page.tsx              # Create listing form
│   ├── profile/
│   │   ├── page.tsx              # Own profile (edit, phone verify, listing actions)
│   │   └── [userId]/page.tsx     # Public profile (read-only)
│   ├── quick-browse/page.tsx     # Swipe deck
│   ├── search/page.tsx           # Search with filters
│   ├── search-profiles/page.tsx  # Manage saved searches
│   ├── layout.tsx                # Root layout (Providers, AppShell)
│   ├── page.tsx                  # Home — hero + newest listing grid
│   ├── providers.tsx             # tRPC + React Query providers
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          # Main layout wrapper with BottomNav
│   │   ├── BottomNav.tsx         # Mobile 5-tab bottom navigation
│   │   └── Header.tsx            # Top bar with search + logo
│   ├── listings/
│   │   ├── DynamicAttributeFields.tsx  # Category fields from DB
│   │   ├── ImageUploader.tsx     # Upload UI → /api/upload
│   │   ├── ListingCard.tsx       # Grid card with price + premium badge
│   │   ├── ListingGrid.tsx       # Grid wrapper
│   │   ├── ReportModal.tsx       # Report a listing
│   │   └── SwipeDeck.tsx         # Tinder-style swipe cards (Framer Motion)
│   ├── messages/
│   │   ├── ConversationList.tsx  # Inbox list
│   │   ├── ConversationView.tsx  # Chat view with real-time messages
│   │   └── useRealtimeMessages.ts # Supabase Realtime hook
│   ├── profile/
│   │   └── PhoneVerification.tsx # Phone add/change widget (OTP flow, wired on profile page)
│   ├── ratings/
│   │   ├── RatingStars.tsx       # Star display component (score + count)
│   │   └── RateSellerModal.tsx   # Interactive 1–5 star picker + comment modal
│   ├── search/
│   │   └── SearchBar.tsx         # Debounced search with recent history
│   └── ui/                       # shadcn/ui style primitives — DO NOT MODIFY
│       ├── badge.tsx, button.tsx, card.tsx
│       ├── input.tsx, skeleton.tsx, textarea.tsx
│
├── contracts/                    # SOURCE OF TRUTH for API shape
│   ├── validators.ts             # All Zod input schemas (createRatingSchema etc.)
│   └── api.ts                    # All TypeScript response types (RatingItem etc.)
│
├── lib/
│   ├── hooks/
│   │   └── useExchangeRate.ts    # Fetches + caches EUR/RSD rate
│   ├── supabase/
│   │   ├── client.ts             # createClient() for browser components
│   │   ├── server.ts             # createServerSupabaseClient() + createServiceRoleClient()
│   │   ├── index.ts              # Re-exports
│   │   └── types.ts              # Generated Supabase DB types
│   ├── constants.ts              # CATEGORIES, LIMITS, ERRORS, SUCCESS, ROUTES, formatPrice()
│   ├── mock-data.ts              # Demo mode mock listings
│   ├── moderation.ts             # OpenAI text + Sightengine image moderation
│   ├── trpc.ts                   # tRPC client setup
│   └── utils.ts                  # cn(), formatDate(), toE164Serbian(), isValidSerbianMobile()
│
├── server/api/
│   ├── routers/
│   │   ├── admin.ts              # Admin-only (service role): approve/reject listings, resolve reports
│   │   ├── auth.ts               # Phone OTP: sendOtp, verifyOtp, addPhone
│   │   ├── category.ts           # getAll, getAttributes
│   │   ├── favorite.ts           # toggle, list
│   │   ├── listing.ts            # create, update, list, get, changeStatus, delete, myListings
│   │   ├── message.ts            # send, getConversations, getMessages, markRead
│   │   ├── rating.ts             # create, list, summary
│   │   ├── report.ts             # create, list (admin)
│   │   ├── searchProfile.ts      # create, update, delete, list
│   │   ├── swipe.ts              # record, getDeck
│   │   └── user.ts               # me, getProfile, update
│   ├── helpers.ts                # toListingCard(), toListingDetail(), generateSlug()
│   ├── root.ts                   # Combines all routers into appRouter
│   └── trpc.ts                   # publicProcedure, protectedProcedure, adminProcedure
│
├── prisma/
│   └── schema.prisma             # DB model reference — never run prisma migrate against Supabase directly
│
├── supabase/
│   └── migrations/               # SQL run manually in Supabase dashboard
│       └── 20231025000000_search_profiles_arrays.sql
│       (ratings table migration — see AGENTS.md — still needs to be run)
│
├── tests/
│   └── e2e.spec.ts               # Playwright E2E tests
├── test/
│   └── api.test.ts               # Vitest unit tests
│
├── .github/workflows/ci.yml      # CI: typecheck → unit → e2e
├── .eslintrc.json                 # ESLint config (extends next/core-web-vitals)
├── .env.local                    # Never commit. See env vars below.
├── next.config.mjs               # Active Next.js config
├── CLAUDE.md                     # This file — codebase reference
└── AGENTS.md                     # Project state, phase tracking, what to build next
```

---

## Environment Variables

```bash
# Required — all modes
NEXT_PUBLIC_SUPABASE_URL="https://awbtohtpjrqlxfoqtita.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."         # Safe to expose (RLS enforced)
SUPABASE_SERVICE_ROLE_KEY="..."             # Server only — never expose to client

# Mode control
DEMO_MODE="false"                           # "true" = mock data, no Supabase needed
NEXT_PUBLIC_APP_URL="http://localhost:3000" # Change to https://swipemarket.rs in prod

# Optional — content moderation (app degrades gracefully without these)
OPENAI_API_KEY="..."                        # Text moderation
SIGHTENGINE_USER="..."                      # Image moderation
SIGHTENGINE_SECRET="..."                    # Image moderation
```

---

## Architecture: How the Pieces Connect

```
Browser Component
  └── api.router.procedure.useQuery()   ← tRPC React Query hook
        └── POST /api/trpc/router.procedure
              └── server/api/routers/router.ts
                    ├── ctx.supabase   ← createServerSupabaseClient() [user-scoped, RLS enforced]
                    └── ctx.user       ← authenticated Supabase user (null if not logged in)
```

**Auth flows:**
- Google OAuth: "Nastavi sa Google" → Supabase → Google → `/auth/callback` → session cookie
- Phone OTP: enter +381 number → `auth.sendOtp` → Supabase sends SMS → enter 6-digit code → `auth.verifyOtp` → session cookie

**Image upload flow:**
1. Component calls `POST /api/upload` with `FormData`
2. Route handler validates file type/size, checks auth
3. Uploads to Supabase Storage `listing-images` bucket via service role client
4. Returns `{ originalUrl, mediumUrl, thumbUrl }` using Supabase Transform params
5. Component stores URLs, submits with listing form

**Realtime messages flow:**
1. `ConversationView` subscribes to Supabase Realtime channel on mount
2. `useRealtimeMessages` hook merges initial data with live events
3. `message.send` tRPC mutation writes to DB → triggers Realtime event
4. All subscribers receive message without polling

---

## Coding Patterns

### tRPC Procedure (Backend)

```typescript
// server/api/routers/myrouter.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { myInputSchema } from '@/contracts/validators'
import type { MyResponseType } from '@/contracts/api'
import { ERRORS } from '@/lib/constants'

export const myRouter = createTRPCRouter({
  doThing: protectedProcedure
    .input(myInputSchema)
    .mutation(async ({ ctx, input }): Promise<MyResponseType> => {
      // ctx.supabase = createServerSupabaseClient() — RLS enforced, user-scoped
      // ctx.user = authenticated Supabase user (guaranteed non-null in protectedProcedure)
      const { data, error } = await ctx.supabase
        .from('my_table')
        .insert({ user_id: ctx.user.id, ...input })
        .select()
        .single()

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERRORS.GENERIC_ERROR })
      return { success: true }
    }),
})
```

After creating a new router, register it in `server/api/root.ts`:
```typescript
import { myRouter } from './routers/my'
export const appRouter = createTRPCRouter({
  // ...existing routers...
  my: myRouter,
})
```

### tRPC Hook (Frontend)

```typescript
'use client'
import { api } from '@/lib/trpc'

export function MyComponent() {
  const utils = api.useUtils()

  // Query
  const { data, isLoading, error } = api.listing.list.useQuery({ limit: 20 })

  // Mutation — tRPC v10: use isLoading NOT isPending
  const create = api.listing.create.useMutation({
    onSuccess: () => utils.listing.list.invalidate(),
    onError: (err) => setError(err.message),
  })

  if (isLoading) return <Skeleton />
  if (error) return <p className="text-red-500 text-center py-8">Greška pri učitavanju</p>
  if (!data?.items.length) return <p className="text-center text-gray-400 py-16">Nema rezultata</p>

  return (
    <div>
      <button
        onClick={() => create.mutate({ title: '...' })}
        disabled={create.isLoading}
      >
        {create.isLoading ? 'Čuvanje...' : 'Sačuvaj'}
      </button>
    </div>
  )
}
```

### Supabase Client Usage

```typescript
// In browser components (client components only)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
// Use ONLY for auth state: supabase.auth.getUser(), supabase.auth.signOut()
// Do NOT query data from components — use tRPC hooks

// In tRPC procedures (server-side)
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
const supabase = createServerSupabaseClient()   // Default — user-scoped, RLS enforced
const adminSupabase = createServiceRoleClient() // ONLY in admin.ts — bypasses RLS
```

### Adding a New Feature (checklist)

1. Add Zod schema to `contracts/validators.ts`
2. Add response type to `contracts/api.ts`
3. If new DB table needed: write migration SQL, run in Supabase dashboard, add model to `prisma/schema.prisma`
4. Implement in `server/api/routers/[name].ts`
5. Register in `server/api/root.ts` if new router file
6. Build UI in `components/` or `app/`
7. Run `npm run typecheck` — must be 0 errors

---

## Key Rules

### Never Do This
- **NEVER** use `createServiceRoleClient()` for user-facing queries — it bypasses RLS
- **NEVER** use `isPending` on tRPC mutations — this is tRPC v11 syntax, will not work
- **NEVER** modify `components/ui/*` — these are base UI primitives
- **NEVER** commit `.env.local` or any file containing secrets
- **NEVER** upgrade Next.js, React, tRPC, or React Query without a full migration plan
- **NEVER** assume `next.config.ts` exists — the active config is `next.config.mjs`
- **NEVER** skip Zod validation on any API input
- **NEVER** use `'RESOLVED'` as a report status — the valid values are `'ACTION_TAKEN'` and `'DISMISSED'`

### Always Do This
- **Always** write user-facing strings in Serbian
- **Always** handle loading, error, and empty states in every component
- **Always** run `npm run typecheck` after changes — must be 0 errors
- **Always** use `createServerSupabaseClient()` (not service role) in user procedures
- **Always** import types from `contracts/api.ts`, never duplicate them
- **Always** add `'use client'` directive to any component using hooks or browser APIs

---

## Files to Check Before Changing Anything

| If you are changing… | Read these first |
|---------------------|-----------------|
| A DB model | `prisma/schema.prisma`, `lib/supabase/types.ts` |
| An API endpoint | `contracts/validators.ts`, `contracts/api.ts`, the router file |
| A listing feature | `server/api/routers/listing.ts`, `components/listings/ListingCard.tsx` |
| Auth behavior | `lib/supabase/server.ts`, `app/auth/callback/route.ts`, `server/api/trpc.ts` |
| Phone OTP | `server/api/routers/auth.ts`, `app/(auth)/login/page.tsx`, `lib/utils.ts` |
| Image upload | `app/api/upload/route.ts`, `components/listings/ImageUploader.tsx` |
| Messaging | `server/api/routers/message.ts`, `components/messages/useRealtimeMessages.ts` |
| Ratings | `server/api/routers/rating.ts`, `components/ratings/`, `contracts/api.ts` |
| Moderation | `lib/moderation.ts`, `server/api/routers/listing.ts` (called on create) |
| Styling | `app/globals.css`, `postcss.config.mjs` (Tailwind 4 config) |
| Admin features | `server/api/routers/admin.ts`, `app/admin/page.tsx` |

---

## What to Read Next

This file covers **how the codebase works**.

For **where the project stands, what's done, what to build next, and step-by-step task instructions** → read `AGENTS.md`.
