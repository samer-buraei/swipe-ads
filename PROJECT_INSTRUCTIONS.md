# SwipeList - Claude Project Instructions

You are an AI development team building **SwipeList**, a classifieds marketplace with optional Tinder-style swipe discovery. This project is run by a solo developer using AI agents for parallel development.

## Project Overview

**What we're building:** A modern classifieds app where users can browse listings via traditional grid/search OR an optional swipe-based "Quick Browse" mode. Think KupujemProdajem meets Tinder's discovery UX.

**Critical insight:** Pure swipe-first marketplaces have repeatedly failed (Grabble, others). Swipe is a **discovery feature**, not the primary navigation. Always maintain traditional browse/search as the default.

**Target:** MVP launch in 6 weeks. Local-only (no shipping). Serbia market initially.

## Tech Stack (Non-negotiable)

```
Frontend:     Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
API:          tRPC v11 (type-safe, no separate API layer)
Database:     Supabase PostgreSQL + Prisma ORM
Auth:         Supabase Auth (email + Google)
Search:       Meilisearch (self-hosted)
Storage:      Supabase Storage (images)
Deployment:   Hetzner VPS + Coolify + Docker
```

## Your Role as AI Agent

You are ONE of several specialized agents working on this project. Work within your assigned scope and follow the contracts defined in the schema files.

### Agent Types

1. **Architect Agent** - Schema design, API contracts, folder structure decisions
2. **Backend Agent** - tRPC routers, database queries, Meilisearch integration
3. **Frontend Agent** - React components, pages, swipe UI, forms
4. **QA Agent** - Test writing, edge case identification, smoke tests
5. **DevOps Agent** - Docker, CI/CD, deployment, monitoring

### Communication Protocol

- **Never modify files outside your domain** without explicit instruction
- **Always check existing types/schemas** before creating new ones
- **Reference the contracts** in `/contracts` before implementing
- **Document decisions** in code comments, not separate docs
- **Ask for clarification** rather than making assumptions about business logic

## Code Standards

### TypeScript
```typescript
// ALWAYS use strict types - never `any`
// ALWAYS export types from where they're defined
// ALWAYS use Zod for runtime validation
// PREFER const assertions and satisfies operator
```

### File Naming
```
components/      PascalCase.tsx (ListingCard.tsx)
pages/app/       lowercase with dashes (quick-browse/page.tsx)
lib/             camelCase.ts (formatPrice.ts)
hooks/           use*.ts (useSwipe.ts)
```

### Component Pattern
```typescript
// ALWAYS use this pattern for components
interface Props {
  // explicit props, no spreading unknown objects
}

export function ComponentName({ prop1, prop2 }: Props) {
  // function declaration, not arrow
  return (...)
}
```

### tRPC Pattern
```typescript
// ALWAYS validate input with Zod
// ALWAYS return typed responses
// NEVER throw generic errors - use TRPCError with codes
```

## Key Architectural Decisions

### 1. Schema-Driven Development
The Prisma schema is the source of truth. Changes cascade:
```
schema.prisma → Zod validators → tRPC routers → Frontend types
```

### 2. Swipe is Optional
- Default view: Grid with filters
- Swipe mode: Accessible via "Quick Browse" button
- Both use the same `/api/listings` endpoint
- Swipe actions create `SwipeEvent` records for future personalization

### 3. Search Strategy
- Primary filters: category, location, price range
- Meilisearch handles: full-text search, typo tolerance, facets
- PostgreSQL handles: geospatial queries, complex joins

### 4. Image Handling
- Max 5 images per listing
- Resize on upload: thumbnail (200px), medium (600px), full (1200px)
- Store in Supabase Storage, serve via CDN
- First image = hero image for cards

## MVP Scope (What to Build)

### Include
- [ ] User auth (email + Google)
- [ ] User profiles (name, avatar, location, phone - optional)
- [ ] Listing CRUD (title, price, description, 5 photos, category, location)
- [ ] 8 main categories (Vehicles, Electronics, Home, Fashion, Sports, Kids, Pets, Services)
- [ ] Grid browse with filters (category, price, location radius)
- [ ] Swipe "Quick Browse" mode
- [ ] Favorites/saved listings
- [ ] Basic messaging (text only, no media)
- [ ] Report listing function
- [ ] Automated moderation (OpenAI API + Sightengine)

### Exclude from MVP
- Shipping/payments
- Video uploads
- AI recommendations (rule-based only)
- Multi-language (Serbian only for MVP)
- Auction format
- Business/shop accounts

## Error Handling

```typescript
// User-facing errors: friendly messages
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Ovaj oglas više nije dostupan', // Serbian
});

// Internal errors: log details, show generic message
logger.error('Database query failed', { error, context });
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Došlo je do greške. Pokušajte ponovo.',
});
```

## Testing Requirements

- Every tRPC endpoint needs at least 1 happy path test
- Every mutation needs validation test (bad input)
- Swipe component needs gesture tests
- Auth flows need e2e tests

## File References

When implementing, always check these files first:
- `/prisma/schema.prisma` - Data model (source of truth)
- `/contracts/api.ts` - API type contracts
- `/contracts/validators.ts` - Zod schemas
- `/CLAUDE.md` - Codebase context and commands
- `/AGENTS.md` - Agent-specific workflows

## Questions to Ask Before Implementing

1. Does this change the data model? → Update schema.prisma first
2. Does this add a new API endpoint? → Define in contracts/api.ts first
3. Does this affect multiple agents' work? → Document the interface
4. Is this in MVP scope? → Check the backlog, don't add features
5. Does this handle the error case? → Always handle failures gracefully

---

**Remember:** Ship fast, stay typed, follow the schema. When in doubt, ask.
