# SwipeList - Session Handoff Document

> **Last Updated:** January 2025
> **Purpose:** Enable any AI or developer to continue work seamlessly

---

## Current State Summary

SwipeList is an **MVP-stage** Serbian marketplace with Tinder-style swiping. The UI and core features work, but it runs on **in-memory demo data** (no real database, no auth, no image upload).

### What Works
- ✅ Swipe interface (Framer Motion, gestures, animations)
- ✅ Grid browse with category/search filters
- ✅ Dynamic forms per category (vehicles, real estate, etc.)
- ✅ Favorites (toggle, list)
- ✅ Messaging (conversations, messages)
- ✅ User profiles
- ✅ Responsive design (mobile bottom nav, desktop header)
- ✅ Serbian language throughout

### What Doesn't Work Yet
- ❌ Real database (Prisma schema ready, not connected)
- ❌ Authentication (hardcoded demo user)
- ❌ Image upload (using Unsplash placeholders)
- ❌ Content moderation (infrastructure exists)
- ❌ Real-time features (notifications, live updates)

---

## File Reference Guide

### Critical Files (Read These First)

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI coding guidelines, patterns, do's/don'ts |
| `prisma/schema.prisma` | Database schema (source of truth) |
| `contracts/validators.ts` | All Zod validation schemas |
| `contracts/api.ts` | API response types |
| `lib/constants.ts` | Categories, cities, limits |
| `lib/category-attributes.ts` | Dynamic form field definitions |
| `server/demo/store.ts` | In-memory data store (to be replaced) |

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| SwipeDeck | `components/listings/SwipeDeck.tsx` | Tinder-style card stack |
| ListingCard | `components/listings/ListingCard.tsx` | Grid item card |
| ListingForm | `app/new/page.tsx` | Create/edit listing form |
| AppShell | `components/layout/AppShell.tsx` | Layout wrapper |
| Header | `components/layout/Header.tsx` | Desktop navigation |
| BottomNav | `components/layout/BottomNav.tsx` | Mobile navigation |

### tRPC Routers

| Router | Location | Endpoints |
|--------|----------|-----------|
| listing | `server/api/routers/listing.ts` | CRUD, list, search |
| favorite | `server/api/routers/favorite.ts` | toggle, list |
| swipe | `server/api/routers/swipe.ts` | record, getDeck |
| message | `server/api/routers/message.ts` | conversations, send |
| user | `server/api/routers/user.ts` | me, get, update |
| category | `server/api/routers/category.ts` | list |

---

## Implementation Roadmap

### Phase 1: Database Connection (Priority: HIGH)

**Goal:** Replace in-memory store with real PostgreSQL

**Steps:**
1. Set up PostgreSQL (Supabase, Neon, or local)
2. Configure `.env.local` with `DATABASE_URL`
3. Run `pnpm db:push` to create tables
4. Run `pnpm db:seed` to populate test data
5. Update all routers to use Prisma instead of demo store

**Files to modify:**
- `server/api/routers/*.ts` - Replace demo store imports with Prisma
- `server/db.ts` - Already configured, just needs env vars

**Example conversion:**
```typescript
// Before (demo store)
import { listListings } from '@/server/demo/store';
const result = listListings(input, ctx.user?.id);

// After (Prisma)
import { db } from '@/server/db';
const result = await db.listing.findMany({
  where: { status: 'ACTIVE', categoryId: input.categoryId },
  include: { images: true, user: true },
  orderBy: { createdAt: 'desc' },
  take: input.limit,
});
```

---

### Phase 2: Authentication (Priority: HIGH)

**Goal:** Real user login/registration

**Recommended:** Supabase Auth (already in schema)

**Steps:**
1. Install `@supabase/supabase-js`
2. Create auth context provider
3. Add login/register pages in `app/(auth)/`
4. Update tRPC context to get real user from session
5. Protect routes that need auth

**Files to create:**
- `lib/supabase.ts` - Supabase client
- `components/providers/AuthProvider.tsx` - Auth context
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/register/page.tsx` - Register page

**tRPC context update:**
```typescript
// server/api/trpc.ts
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  return {
    db,
    user: user ? { id: user.id, email: user.email } : null,
    ...opts,
  };
};
```

---

### Phase 3: Image Upload (Priority: MEDIUM)

**Goal:** Let users upload real photos

**Options:**
1. **Supabase Storage** - Simple, integrated with auth
2. **Vercel Blob** - Good for Vercel deployments
3. **Cloudinary** - Advanced image processing

**Steps:**
1. Create upload API route `app/api/upload/route.ts`
2. Add image picker component
3. Generate thumbnails (use Sharp or cloud service)
4. Store URLs in database

**Schema already supports this:**
```prisma
model ListingImage {
  originalUrl String   // Full size
  mediumUrl   String   // 600px wide
  thumbUrl    String   // 200px wide
}
```

---

### Phase 4: UI Polish (Priority: MEDIUM)

**Goal:** Award-worthy design refinements

See `GEMINI_DESIGN_PROMPT.md` for detailed design brief.

**Key areas:**
- Micro-interactions and animations
- Loading states and skeletons
- Error handling UI
- Empty states
- Onboarding flow
- Accessibility improvements

---

### Phase 5: Local Deployment (Priority: LOW)

See `LOCAL_DEPLOY.md` for step-by-step guide.

---

## Code Patterns

### Creating a New tRPC Endpoint

```typescript
// 1. Add Zod schema in contracts/validators.ts
export const myNewInputSchema = z.object({
  field: z.string().min(1),
});

// 2. Add types in contracts/api.ts
export type MyNewOutput = { success: boolean };

// 3. Implement in server/api/routers/[router].ts
myEndpoint: protectedProcedure
  .input(myNewInputSchema)
  .mutation(async ({ ctx, input }) => {
    // Implementation
    return { success: true };
  }),
```

### Creating a New Page

```typescript
// app/my-page/page.tsx
'use client';

import { api } from '@/lib/trpc';
import { AppShell } from '@/components/layout/AppShell';

export default function MyPage() {
  const { data, isLoading } = api.myRouter.myEndpoint.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <AppShell>
      <h1>My Page</h1>
      {/* Content */}
    </AppShell>
  );
}
```

### Using Dynamic Category Fields

```typescript
import { getCategoryFields } from '@/lib/category-attributes';

const fields = getCategoryFields('vehicles');
// Returns: [{ name: 'brand', type: 'select', ... }, ...]
```

---

## Known Issues & Gotchas

1. **Demo data resets** - Server restart clears all data
2. **No real auth** - `ctx.user` is hardcoded to demo user
3. **Images are placeholders** - All from Unsplash
4. **Messages lack input** - Conversation detail page needs reply form
5. **Profile edit doesn't save** - UI exists but no mutation
6. **No rate limiting** - Constants defined but not enforced

---

## Testing Checklist

Before deploying, verify:

- [ ] All pages load without errors
- [ ] Swipe gestures work on mobile
- [ ] Category filters work
- [ ] Search returns results
- [ ] Favorites toggle works
- [ ] Create listing form validates
- [ ] Dynamic fields appear per category
- [ ] Messages display correctly
- [ ] Responsive layout works (mobile/desktop)

---

## Environment Setup

```bash
# Required for production
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Required for auth
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Optional
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="..."
OPENAI_API_KEY="..."
```

---

## Quick Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm db:push          # Push schema to DB
pnpm db:seed          # Seed test data
pnpm db:studio        # Open Prisma Studio
pnpm lint             # Run linter
```

---

## Contact & Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **tRPC Docs:** https://trpc.io/docs
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Framer Motion:** https://www.framer.com/motion/

---

*This document should be updated whenever significant changes are made to the codebase.*
