# SwipeMarket — Phase 4 Master Index
**Last updated:** 2026-02-28
**Status:** Not started

## How to use these documents

Each step is its own file with **complete, copy-paste ready code**.
An LLM agent should open ONE step file at a time and complete it fully before moving on.
Never work on two step files in the same session.

## Execution Order (do not skip ahead)

| File | Step | What it builds | Must do first |
|------|------|---------------|--------------|
| `PHASE4_STEP1_BLOCKERS.md` | 1 | Fix 3 production blockers | Nothing — do this TODAY |
| `PHASE4_STEP2_PHONE_OTP.md` | 2 | Phone number sign-in via Supabase + Twilio | Step 1 done |
| `PHASE4_STEP3_LISTING_MGMT.md` | 3 | Edit / mark sold / renew listings | Step 1 done |
| `PHASE4_STEP4_RATINGS.md` | 4 | Seller ratings system | Step 3 done |
| `PHASE4_STEP5_PUSH.md` | 5 | Push notifications for saved searches | Step 1 done |
| `PHASE4_STEP6_STRIPE.md` | 6 | Stripe payments for Premium listings | Step 3 done |

Steps 3 and 5 are independent of each other and can be done in parallel by two agents.
Steps 4 and 6 each depend on the step above them.

## Minimum context header — paste at the top of every agent session

```
PROJECT: SwipeMarket — Serbian classifieds marketplace
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2
AUTH: Supabase Auth (Google OAuth) — NO NextAuth, NO Docker
DB: Supabase hosted PostgreSQL — supabase client only, never raw Prisma queries
KEY RULE: tRPC v10 — mutations use isLoading NOT isPending
ROOT: C:\Users\sam\Desktop\swipemarket\
CURRENT TASK: [copy the task heading from the step file you are working on]
```

## What is already built (do not rebuild)

- Supabase Auth + Google OAuth sign-in (`app/(auth)/login/page.tsx`, `app/auth/callback/route.ts`)
- Image upload to Supabase Storage (`app/api/upload/route.ts`, `components/listings/ImageUploader.tsx`)
- Real-time messaging via Supabase Realtime (`components/messages/ConversationView.tsx`, `components/messages/useRealtimeMessages.ts`)
- Search page with filters (`app/search/page.tsx`, `components/search/SearchBar.tsx`)
- Category attributes from DB (`components/listings/DynamicAttributeFields.tsx`)
- User profiles (`app/profile/page.tsx`, `app/profile/[userId]/page.tsx`)
- Premium UI badge (`components/listings/ListingCard.tsx`, `components/listings/SwipeDeck.tsx`)
- RSD/EUR dual currency (`lib/hooks/useExchangeRate.ts`)
- Content moderation (`lib/moderation.ts`)
- Rate limiting — 5 listings/day (`server/api/routers/listing.ts`)
- Reports (`server/api/routers/report.ts`, `components/listings/ReportModal.tsx`)
- Admin dashboard (`app/admin/page.tsx`, `server/api/routers/admin.ts`)
- Saved search profiles (`app/search-profiles/page.tsx`, `server/api/routers/searchProfile.ts`)
- CI pipeline (`.github/workflows/ci.yml`)
