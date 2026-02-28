# AGENTS.md — SwipeMarket Multi-Agent Workflow Guide

> This file tells every AI agent (Claude, Gemini, Cursor, etc.) exactly where the project stands, what to do next, and how to work without breaking other agents' work.
> Last updated: 2026-02-28

---

## READ THIS FIRST — CURRENT STATE

**Project:** SwipeMarket (Serbian classifieds marketplace)
**Stack:** Next.js 14.2 + React 18.3 + tRPC 10 + Supabase + Tailwind 4 + TypeScript
**Root:** `C:\Users\sam\Desktop\swipemarket\`
**Deployment target:** Vercel + Supabase hosted PostgreSQL

### Phases Completed
- Phase 1: Core app — DB schema, tRPC routers, Supabase Auth (Google OAuth), swipe deck, listing cards
- Phase 2: Image upload (Supabase Storage), real-time messaging (Supabase Realtime), search page, category attributes from DB
- Phase 3: Dual currency display, user profiles, premium listing UI, branding, empty states/skeletons
- Phase 7: RLS enforcement, message rate limits, badge sync, search profiles fix, AI moderation activated, CI scaffolded

### Immediate Blockers (fix before anything else)

| Priority | Blocker | File | Fix |
|----------|---------|------|-----|
| P0 | `DEMO_MODE` still `"true"` | `.env.local` | Change to `"false"` |
| P0 | Prisma not in devDependencies | `package.json` | `npm install --save-dev prisma @prisma/client` |
| P0 | ESLint config broken | `eslint.config.mjs` | Change to `"eslint-config-next/core-web-vitals.js"` |

### Phase 4 — Not Started (what comes next)

| Task | Effort | Notes |
|------|--------|-------|
| Phone OTP auth | 1 day | Twilio via Supabase Auth phone provider |
| Push notifications | 1 day | Supabase Edge Function + web-push for saved search alerts |
| Listing management | 0.5 day | Edit own listing, mark as sold, renew expired |
| Seller ratings | 1 day | Buyer rates seller post-transaction |
| Admin moderation dashboard | 1 day | Reports queue UI (route exists, logic basic) |
| Premium payments | 2 days | Stripe or local gateway for `is_premium` upgrade |

---

## Core Principle: Contract-First

```
prisma/schema.prisma
      ↓
contracts/validators.ts   (Zod input schemas)
      ↓
contracts/api.ts          (TypeScript response types)
      ↓
server/api/routers/*.ts   (Implementation)
      ↓
components/**/*.tsx        (UI consuming tRPC hooks)
```

**Rule:** Contracts are defined first. No agent touches `contracts/` without updating both files together and notifying other agents. The Prisma schema is the DB source of truth — never write raw SQL that contradicts it.

---

## Agent Definitions

### ARCHITECT AGENT

**When to use:** Adding new data models, designing new API contracts, making tech decisions, resolving cross-agent conflicts.

**Files owned:**
- `prisma/schema.prisma`
- `contracts/validators.ts`
- `contracts/api.ts`
- `CLAUDE.md`, `AGENTS.md`

**Files never modified by others without approval:**
- Any file in `contracts/`
- `prisma/schema.prisma`

**Prompt template:**
```
You are the Architect Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace (Tinder swipe + classifieds)
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2, Supabase (Auth/Storage/Realtime/DB), Prisma 5
ROOT: C:\Users\sam\Desktop\swipemarket\
AUTH: Supabase Auth (Google OAuth) — no NextAuth, no Docker
DB: Supabase hosted PostgreSQL — use supabase client, not raw Prisma queries
TASK: [describe task]

Before making changes:
1. Read prisma/schema.prisma and contracts/validators.ts and contracts/api.ts
2. Check if change is backward compatible
3. If schema changes: write a migration SQL for supabase/migrations/
4. Update both validators.ts AND api.ts together — never one without the other
5. Document which routers and components need to be updated
```

---

### BACKEND AGENT

**When to use:** Implementing or modifying tRPC procedures, fixing API logic, integrating external services (moderation APIs, Supabase features).

**Files owned:**
- `server/api/routers/*.ts`
- `server/api/helpers.ts`
- `server/api/root.ts`
- `server/api/trpc.ts`
- `lib/moderation.ts`
- `lib/utils.ts` (server utilities)
- `app/api/**/*.ts` (Route Handlers)

**Prompt template:**
```
You are the Backend Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace (Tinder swipe + classifieds)
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2, Supabase (Auth/Storage/Realtime/DB), Prisma 5
ROOT: C:\Users\sam\Desktop\swipemarket\
AUTH: Supabase Auth (Google OAuth) — no NextAuth, no Docker
DB: Supabase hosted PostgreSQL — use supabase client, never raw Prisma queries
TASK: [describe task]

Rules:
1. Always validate input using Zod schemas from contracts/validators.ts
2. Always return types matching contracts/api.ts — never return undocumented shapes
3. Never modify contracts/ files — request that from Architect Agent
4. Use ctx.supabase (createServerSupabaseClient) for all user-scoped queries — RLS is enforced
5. Use createServiceRoleClient() ONLY inside admin.ts procedures
6. tRPC v10: throw TRPCError for errors, use protectedProcedure for auth-required endpoints
7. Mutation state in components uses isLoading (NOT isPending — that is tRPC v11)

Before implementing:
- Read prisma/schema.prisma for exact field names
- Read lib/supabase/types.ts for exact DB column names (snake_case)
- Check existing patterns in other routers for consistency
```

**Standard protected procedure pattern:**
```typescript
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { createListingSchema } from '../../../contracts/validators'
import type { CreateListingResponse } from '../../../contracts/api'

export const listingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createListingSchema)
    .mutation(async ({ ctx, input }): Promise<CreateListingResponse> => {
      const { data, error } = await ctx.supabase
        .from('listings')
        .insert({ ...input, user_id: ctx.user.id })
        .select()
        .single()

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })

      return { id: data.id, slug: data.slug, status: data.status }
    }),
})
```

---

### FRONTEND AGENT

**When to use:** Building UI components, implementing pages, wiring tRPC hooks to UI, handling form state and navigation.

**Files owned:**
- `app/**/*.tsx` (all pages)
- `components/**/*.tsx`
- `lib/hooks/*.ts`
- `app/globals.css`

**Files never modified:**
- `components/ui/*` — base UI primitives, do not touch
- `contracts/*` — read only

**Prompt template:**
```
You are the Frontend Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace (Tinder swipe + classifieds)
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2, Supabase (Auth/Storage/Realtime/DB)
ROOT: C:\Users\sam\Desktop\swipemarket\
AUTH: Supabase Auth (Google OAuth)
UI LANGUAGE: Serbian — all user-facing text must be in Serbian
TASK: [describe task]

Rules:
1. Always use types from contracts/api.ts for API response shapes
2. Always handle loading, error, and empty states — never leave a blank white screen
3. Never call Supabase directly from components for data — use tRPC hooks
4. Use createClient() from lib/supabase/client.ts only for auth state (getUser, signOut)
5. Add 'use client' directive to any component using hooks, event handlers, or browser APIs
6. Mobile-first: every component must work on 375px screen
7. tRPC v10 mutations use isLoading, not isPending

Component checklist before marking done:
[ ] Props interface defined with TypeScript
[ ] Loading state: skeleton or spinner
[ ] Error state: error message or retry button
[ ] Empty state: Serbian message explaining what to do
[ ] Mobile responsive (tested at 375px)
[ ] No hardcoded English strings
```

**Standard component pattern:**
```typescript
'use client'
import { api } from '@/lib/trpc'

interface Props {
  categoryId: string
}

export function ListingGrid({ categoryId }: Props) {
  const { data, isLoading, error } = api.listing.list.useQuery({
    categoryId,
    limit: 20,
  })

  if (isLoading) return <ListingGridSkeleton />
  if (error) return <p className="text-center text-red-500 py-8">Greška pri učitavanju</p>
  if (!data?.items.length) return (
    <div className="text-center py-16 text-gray-400">
      <p>Nema oglasa u ovoj kategoriji</p>
    </div>
  )

  return (
    <div className="grid grid-cols-2 gap-3">
      {data.items.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
```

---

### QA AGENT

**When to use:** Writing tests, verifying completed features against the smoke test checklist, identifying edge cases, running the CI pipeline.

**Files owned:**
- `tests/*.spec.ts` (Playwright E2E)
- `test/*.test.ts` (Vitest unit)
- `playwright.config.ts`
- `vitest.config.ts`

**Prompt template:**
```
You are the QA Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace
STACK: Next.js 14.2, tRPC 10, Supabase, Vitest, Playwright
ROOT: C:\Users\sam\Desktop\swipemarket\
TASK: [describe what to test]

Test requirements:
1. Every tRPC procedure needs a happy path unit test
2. Every mutation needs an invalid input test
3. Critical user flows need E2E tests (see critical flows below)
4. Run npm run typecheck first — must be 0 errors before any test is written

Critical flows to cover:
1. Sign in with Google → lands on home screen with swipe deck
2. Swipe right → listing appears in /favorites
3. Create listing with 3 photos → listing visible in grid with images
4. Open listing → tap Kontaktiraj → message sent → appears in /messages
5. Search for term → results appear → apply filter → results narrow
6. Profile edit → save → refresh → changes persist

Phase 3 smoke test checklist (verify these are actually working):
[ ] Google OAuth sign-in completes end-to-end (not just code-complete)
[ ] Upload photo → appears in Supabase Storage → URL loads in browser
[ ] Send message → second browser tab receives it in real time
[ ] Price shows dual RSD + EUR on listing card and swipe card
[ ] Premium listing shows amber badge in grid and swipe deck
[ ] Header shows "SwipeMarket" everywhere — no "SwipeList" remaining
[ ] Saved search creates a SearchProfile record in DB
```

---

### DEVOPS AGENT

**When to use:** Fixing CI pipeline, configuring Vercel deployment, running Supabase migrations, managing environment variables.

**Files owned:**
- `.github/workflows/ci.yml`
- `vercel_deployment_guide.md`
- `supabase/migrations/*.sql`
- `next.config.ts`

**Prompt template:**
```
You are the DevOps Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace
STACK: Next.js 14.2, Supabase hosted PostgreSQL, Vercel deployment, GitHub Actions CI
ROOT: C:\Users\sam\Desktop\swipemarket\
TASK: [describe task]

Infrastructure:
- Deployment: Vercel (not Hetzner, not Coolify, not Docker)
- Database: Supabase hosted (awbtohtpjrqlxfoqtita.supabase.co)
- Storage: Supabase Storage bucket 'listing-images'
- Auth: Supabase Auth (Google OAuth configured in Supabase dashboard)
- CI: GitHub Actions (.github/workflows/ci.yml)

Current CI pipeline:
1. Checkout code
2. Setup Node.js 20 with npm cache
3. npm ci
4. npm run typecheck
5. npm run test:unit (Vitest)
6. Install Playwright browsers
7. npm run test:e2e (Playwright)

Known CI issues to fix:
- ESLint step will fail (eslint.config.mjs path issue)
- Prisma not in package.json devDependencies (migrations won't run)

Security checklist:
[ ] SUPABASE_SERVICE_ROLE_KEY only used in server/api/routers/admin.ts
[ ] No secrets in code or committed files
[ ] Vercel env vars set for production (DEMO_MODE=false, NEXT_PUBLIC_APP_URL=https://swipemarket.rs)
[ ] Supabase RLS policies active on all tables
[ ] listing-images bucket is public read, authenticated write only
```

---

## Parallel Work — What Can Run Simultaneously

```
Architect defines contracts
        │
        ├── Backend Agent implements routers
        └── Frontend Agent builds UI with mock types

                    (merge when both done)

QA Agent writes tests against merged implementation
DevOps Agent fixes CI pipeline (independent of above)
```

**Safe to run in parallel:**
- Frontend + Backend (after contracts are defined)
- DevOps + any other agent (infra is independent)
- QA writing tests + any feature agent

**Must be sequential:**
- Architect defines contracts → THEN Backend + Frontend start
- Feature complete → THEN QA verifies
- CI green → THEN deployment

---

## Handoff Protocol

When one agent blocks on another, leave this at the top of `SESSION_NOTES.md`:

```markdown
## HANDOFF: [From] → [To]

**Task:** Brief description
**Why blocked:** Specific reason
**Files to read:** List of relevant files
**Expected output:** What the receiving agent should produce
**Return to:** What the sending agent will do once unblocked
```

---

## Session Notes Format

Create or update `SESSION_NOTES.md` at the end of every session:

```markdown
# Session Notes — [YYYY-MM-DD] — [Agent Type]

## Completed This Session
- [x] Task description (file changed: path/to/file.ts)
- [x] Task description

## In Progress (not finished)
- Task name: what's done, what remains, why stopped

## Blocked
- Task name: waiting on [agent] for [specific thing]

## Verified Working (manually tested)
- Feature: what was tested and confirmed

## Known Issues Found
- Issue: description + workaround if any

## Next Session Should Start With
1. First priority
2. Second priority
```

---

## Context Loading Guide

Load only what you need. Don't paste the entire codebase into context.

| Agent | Always load | Load when relevant |
|-------|------------|-------------------|
| Architect | `prisma/schema.prisma`, `contracts/*.ts` | The router you're designing for |
| Backend | `prisma/schema.prisma`, `contracts/*.ts`, target router | `server/api/trpc.ts`, related routers |
| Frontend | `contracts/api.ts`, target component/page | Related components, `lib/trpc.ts` |
| QA | Test target files, `contracts/*.ts` | Implementation files |
| DevOps | `.github/workflows/ci.yml`, `package.json` | App code rarely |

**Minimum context header for any session (paste at the top):**
```
PROJECT: SwipeMarket — Serbian classifieds marketplace (Tinder swipe meets Halo Oglasi)
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2, Supabase (Auth/Storage/Realtime/DB)
ROOT: C:\Users\sam\Desktop\swipemarket\
AUTH: Supabase Auth, Google OAuth — NO NextAuth, NO Docker, NO Prisma queries (Supabase client only)
PHASE: Phase 4 in progress (see AGENTS.md for task list)
CRITICAL: tRPC v10 — use isLoading not isPending on mutations
CURRENT SESSION GOAL: [your specific task here]
```

---

## What Must Never Change Without Architect Approval

1. `prisma/schema.prisma` — any model or enum change requires a Supabase migration SQL
2. `contracts/validators.ts` — changing a schema breaks all callers
3. `contracts/api.ts` — changing a response type breaks all components consuming it
4. `lib/supabase/types.ts` — regenerate via Supabase CLI, don't hand-edit
5. Stack versions — Next.js 14.2, React 18.3, tRPC 10.45.2 are pinned intentionally

---

## Common Mistakes to Avoid

| Mistake | Why it breaks | Correct approach |
|---------|--------------|-----------------|
| Using `isPending` on mutation | tRPC v10 doesn't have this | Use `isLoading` |
| `createServiceRoleClient()` in a user router | Bypasses RLS — security hole | Use `createServerSupabaseClient()` |
| Importing from `next.config.mjs` | Deprecated, replaced by `next.config.ts` | Use `next.config.ts` |
| Writing UI text in English | App is Serbian-language | All strings in Serbian |
| Querying Supabase directly from a React component | Bypasses tRPC type safety | Use tRPC hooks via `api.*` |
| Skipping loading/error/empty states | White screen on slow connections | All three states required |
| Adding features to `components/ui/*` | These are base primitives | Create in `components/listings/`, `components/messages/`, etc. |
| Running `npx prisma migrate dev` | Won't work — Prisma not in deps yet | Fix: `npm install --save-dev prisma @prisma/client` first |
