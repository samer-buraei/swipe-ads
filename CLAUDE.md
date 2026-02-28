# CLAUDE.md — SwipeMarket Codebase Context

> Read this file before making any changes. It is the authoritative reference for all AI coding agents.
> Last updated: 2026-02-28

---

## What This App Is

**SwipeMarket** is a Serbian classifieds marketplace (like KupujemProdajem / Halo Oglasi) with a Tinder-style swipe interface for browsing listings. Users swipe right to save, left to skip, up to contact the seller immediately. They can also browse in a traditional grid, post listings, message sellers, and manage their profile.

**Target market:** Serbian-speaking users. All UI text must be in Serbian.
**Prices:** Displayed in both RSD (primary) and EUR (secondary, via live exchange rate).

---

## Current Project Status

**Phase:** Post-Phase 3 / Phase 7 complete — ready for production with 3 blockers remaining.

### Production Blockers (fix these before any deployment)

| # | Blocker | Fix |
|---|---------|-----|
| 1 | `DEMO_MODE="true"` in `.env.local` | Set to `"false"` |
| 2 | Prisma missing from `package.json` devDependencies | `npm install --save-dev prisma @prisma/client` |
| 3 | ESLint config broken (`core-web-vitals.js` path) | Update `eslint.config.mjs`: `import nextConfig from "eslint-config-next/core-web-vitals.js"` |

### What Is Complete
- Supabase Auth (Google OAuth) — login/logout flow
- Image upload to Supabase Storage (`listing-images` bucket)
- Supabase Realtime messaging (ConversationList + ConversationView)
- Full-text search page with filters
- Category-specific attribute fields (from DB via `category.getAttributes`)
- User profiles (own + public)
- Premium listing UI (amber badge + ring)
- RSD/EUR dual currency display (`PriceDisplay`, `useExchangeRate`)
- Content moderation (OpenAI text + Sightengine image, both optional/graceful)
- Rate limiting (5 listings/day, message rate limits)
- RLS enforcement via `createServerSupabaseClient` (not service role for user queries)
- CI pipeline (GitHub Actions — typecheck + Vitest + Playwright)

### What Is NOT Built Yet (Phase 4)
- Phone OTP auth (Twilio via Supabase phone provider)
- Push notifications for saved search alerts
- Listing management (edit own listing, mark as sold, renew expired)
- Seller ratings system
- Admin moderation dashboard (UI exists at `/admin` but is basic)
- Payment integration for Premium upgrades

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 14.2.18 |
| UI | React | 18.3.1 |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 4.x |
| Animation | Framer Motion | 11.x |
| API Layer | tRPC | 10.45.2 |
| Data Fetching | TanStack Query | 4.36.1 |
| Validation | Zod | 3.24.1 |
| Auth | Supabase Auth | — |
| Database | Supabase (PostgreSQL) | — |
| ORM/Schema | Prisma | 5.x (schema only, client generated) |
| Storage | Supabase Storage | — |
| Realtime | Supabase Realtime | — |
| Icons | Lucide React | 0.460.0 |
| Dates | date-fns | 4.x |
| Testing | Vitest + Playwright | latest |
| Deployment | Vercel | — |

**Critical version notes:**
- tRPC is v10 — use `isLoading` for mutation state, NOT `isPending` (that is tRPC v11/React 19)
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
npm run typecheck     # TypeScript check (must be 0 errors)
npm run lint          # ESLint (currently broken — see production blockers)

# Testing
npm run test          # Run all tests (unit + e2e)
npm run test:unit     # Vitest unit tests
npm run test:e2e      # Playwright E2E tests

# Database (Prisma — requires Supabase connection)
# npm run db:push      # Push schema changes (add to package.json if missing)
# npm run db:generate  # Regenerate Prisma client
```

---

## File Structure

```
swipemarket/
├── app/                          # Next.js App Router — all pages and API routes
│   ├── (auth)/                   # Auth pages (not protected by middleware)
│   │   ├── login/page.tsx        # Login with Google OAuth
│   │   └── register/page.tsx     # Registration
│   ├── api/
│   │   ├── auth/                 # Supabase auth helpers
│   │   ├── exchange-rate/        # EUR/RSD rate endpoint (24h cache)
│   │   ├── trpc/[trpc]/          # tRPC HTTP handler
│   │   └── upload/route.ts       # Image upload → Supabase Storage
│   ├── auth/callback/route.ts    # OAuth redirect handler
│   ├── admin/page.tsx            # Admin dashboard
│   ├── favorites/page.tsx        # Saved listings
│   ├── listing/[slug]/page.tsx   # Listing detail view
│   ├── messages/
│   │   ├── page.tsx              # Conversations list
│   │   └── [id]/page.tsx         # Conversation view
│   ├── new/page.tsx              # Create listing form
│   ├── profile/
│   │   ├── page.tsx              # Own profile (editable)
│   │   └── [userId]/page.tsx     # Public profile (read-only)
│   ├── quick-browse/page.tsx     # Traditional grid browse
│   ├── search/page.tsx           # Search with filters
│   ├── search-profiles/page.tsx  # Manage saved searches
│   ├── layout.tsx                # Root layout (Providers, AppShell)
│   ├── page.tsx                  # Home — swipe deck
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
│   │   └── PhoneVerification.tsx # Phone OTP UI (Phase 4 — not wired)
│   ├── search/
│   │   └── SearchBar.tsx         # Debounced search with recent history
│   └── ui/                       # shadcn/ui style components — do not modify
│       ├── badge.tsx, button.tsx, card.tsx
│       ├── input.tsx, skeleton.tsx, textarea.tsx
│
├── contracts/                    # SOURCE OF TRUTH for API shape
│   ├── validators.ts             # All Zod input schemas
│   └── api.ts                    # All TypeScript response types
│
├── lib/
│   ├── hooks/
│   │   └── useExchangeRate.ts    # Fetches + caches EUR/RSD rate
│   ├── supabase/
│   │   ├── client.ts             # createClient() for browser components
│   │   ├── server.ts             # createServerSupabaseClient() + createServiceRoleClient()
│   │   ├── index.ts              # Re-exports
│   │   └── types.ts              # Generated Supabase DB types
│   ├── category-attributes.ts    # Hardcoded fallback (DB is source of truth now)
│   ├── constants.ts              # CATEGORIES array, LIMITS, etc.
│   ├── mock-data.ts              # Demo mode mock listings
│   ├── moderation.ts             # OpenAI text + Sightengine image moderation
│   ├── trpc.ts                   # tRPC client setup
│   └── utils.ts                  # cn(), formatDate(), etc.
│
├── server/api/
│   ├── routers/
│   │   ├── admin.ts              # Admin-only procedures (service role)
│   │   ├── category.ts           # getAll, getAttributes
│   │   ├── favorite.ts           # toggle, list
│   │   ├── listing.ts            # create, update, list, get, changeStatus
│   │   ├── message.ts            # send, getConversations, getMessages, markRead
│   │   ├── report.ts             # create, list (admin)
│   │   ├── searchProfile.ts      # create, update, delete, list
│   │   ├── swipe.ts              # record, getDeck
│   │   └── user.ts               # getCurrent, getProfile, update
│   ├── helpers.ts                # Shared server utilities
│   ├── root.ts                   # Combines all routers
│   └── trpc.ts                   # publicProcedure, protectedProcedure, adminProcedure
│
├── prisma/
│   └── schema.prisma             # DB schema — source of truth for models
│
├── supabase/
│   └── migrations/               # SQL migrations for Supabase
│       └── 20231025000000_search_profiles_arrays.sql
│
├── tests/
│   └── e2e.spec.ts               # Playwright E2E tests
├── test/
│   └── api.test.ts               # Vitest unit tests
│
├── .github/workflows/ci.yml      # CI: typecheck → unit → e2e
├── .env.local                    # Never commit. See env vars below.
├── next.config.ts                # Use this one (not next.config.mjs)
├── CLAUDE.md                     # This file — agent context
└── AGENTS.md                     # Multi-agent workflow guide
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

**Auth flow:**
1. User clicks "Nastavi sa Google" → Supabase Auth redirects to Google
2. Google redirects to `/auth/callback/route.ts`
3. Supabase sets session cookie
4. `createServerSupabaseClient()` in tRPC middleware reads session from cookie
5. `ctx.user` is populated for protected procedures

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
// server/api/routers/listing.ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { createListingSchema } from '../../../contracts/validators'
import type { CreateListingResponse } from '../../../contracts/api'

export const listingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createListingSchema)
    .mutation(async ({ ctx, input }): Promise<CreateListingResponse> => {
      // ctx.supabase = createServerSupabaseClient() — RLS enforced, user-scoped
      // ctx.user = authenticated Supabase user
      const { data, error } = await ctx.supabase
        .from('listings')
        .insert({ ...input, user_id: ctx.user.id })
        .select()
        .single()

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      return { id: data.id, slug: data.slug, status: data.status }
    }),
})
```

### tRPC Hook (Frontend)

```typescript
'use client'
import { api } from '@/lib/trpc'

export function MyComponent() {
  // Query
  const { data, isLoading, error } = api.listing.list.useQuery({ limit: 20 })

  // Mutation — tRPC v10: use isLoading NOT isPending
  const create = api.listing.create.useMutation({
    onSuccess: (data) => { /* redirect or invalidate */ }
  })

  if (isLoading) return <Skeleton />
  if (error) return <ErrorState />
  if (!data?.items.length) return <EmptyState />

  return <div>{/* render data */}</div>
}
```

### Supabase Client Usage

```typescript
// In browser components (client components)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// In server components, API routes, tRPC procedures
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
const supabase = createServerSupabaseClient()   // User-scoped, RLS enforced — use this by default
const adminSupabase = createServiceRoleClient() // Bypasses RLS — only for admin procedures
```

### Adding a New tRPC Endpoint

1. Add Zod schema to `contracts/validators.ts`
2. Add response type to `contracts/api.ts`
3. Implement in `server/api/routers/[router].ts`
4. Register router in `server/api/root.ts` (if new router)
5. Call from component with `api.[router].[procedure].useQuery()`

---

## Key Rules

### Never Do This
- **NEVER** use `createServiceRoleClient()` for user-facing queries — it bypasses RLS
- **NEVER** use `isPending` on tRPC mutations — this is tRPC v11 syntax, will not work
- **NEVER** modify `components/ui/*` — these are base UI primitives
- **NEVER** use `any` type — define proper types in `contracts/api.ts`
- **NEVER** commit `.env.local` or any file containing secrets
- **NEVER** upgrade Next.js, React, tRPC, or React Query without a full migration plan
- **NEVER** use `next.config.mjs` — the active config is `next.config.ts`
- **NEVER** skip Zod validation on any API input

### Always Do This
- **Always** write user-facing strings in Serbian
- **Always** handle loading, error, and empty states in every component
- **Always** run `npm run typecheck` after changes — must be 0 errors
- **Always** use `createServerSupabaseClient()` (not service role) for user procedures
- **Always** import types from `contracts/api.ts`, never duplicate them
- **Always** add `'use client'` directive to any component using hooks or browser APIs
- **Always** check `lib/supabase/types.ts` for the exact DB column names (snake_case)

---

## Categories (Fixed for MVP)

```typescript
// lib/constants.ts
export const CATEGORIES = [
  { id: 'vehicles',     name: 'Vozila',           icon: 'Car' },
  { id: 'electronics',  name: 'Elektronika',       icon: 'Smartphone' },
  { id: 'home',         name: 'Kuća i bašta',      icon: 'Home' },
  { id: 'fashion',      name: 'Moda',              icon: 'Shirt' },
  { id: 'sports',       name: 'Sport i rekreacija', icon: 'Dumbbell' },
  { id: 'kids',         name: 'Deca i bebe',        icon: 'Baby' },
  { id: 'pets',         name: 'Ljubimci',           icon: 'PawPrint' },
  { id: 'services',     name: 'Usluge',             icon: 'Wrench' },
]
```

---

## Files to Check Before Changing Anything

| If you are changing… | Read these first |
|---------------------|-----------------|
| A DB model | `prisma/schema.prisma`, `lib/supabase/types.ts` |
| An API endpoint | `contracts/validators.ts`, `contracts/api.ts`, the router file |
| A listing feature | `server/api/routers/listing.ts`, `components/listings/ListingCard.tsx` |
| Auth behavior | `lib/supabase/server.ts`, `app/auth/callback/route.ts`, `server/api/trpc.ts` |
| Image upload | `app/api/upload/route.ts`, `components/listings/ImageUploader.tsx` |
| Messaging | `server/api/routers/message.ts`, `components/messages/useRealtimeMessages.ts` |
| Moderation | `lib/moderation.ts`, `server/api/routers/listing.ts` (called on create/update) |
| Styling | `app/globals.css`, `postcss.config.mjs` (Tailwind 4 config) |
