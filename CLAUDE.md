# CLAUDE.md - SwipeList Codebase Context

> This file provides context for AI coding agents. Read this before making any changes.

## Quick Start (Demo Mode - No Database Required)

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (demo mode is enabled by default)
npm run dev

# Open http://localhost:3000
# Use "Demo Login" to sign in without setting up auth
```

## Quick Start (Full Mode - With Database)

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (via Docker)
docker run -d --name swipelist-db \
  -e POSTGRES_USER=swipelist \
  -e POSTGRES_PASSWORD=swipelist123 \
  -e POSTGRES_DB=swipelist \
  -p 5432:5432 postgres:15

# 3. Update .env.local
DEMO_MODE="false"
DATABASE_URL="postgresql://swipelist:swipelist123@localhost:5432/swipelist"

# 4. Push schema and seed
npm run db:push
npm run db:seed

# 5. (Optional) Set up Google OAuth
# - Create project at https://console.cloud.google.com
# - Add credentials to .env.local

# 6. Start the dev server
npm run dev
```

## Available Commands

```bash
# Development
npm run dev                 # Start dev server (Next.js + tRPC)
npm run build               # Production build
npm run start               # Start production server
npm run lint                # ESLint check

# Database (requires PostgreSQL)
npm run db:push             # Push schema changes to database
npm run db:generate         # Generate Prisma client
npm run db:studio           # Open Prisma Studio
npm run db:seed             # Seed development data
npm run db:reset            # Reset database (destructive!)
```

## Project Structure

```
/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, register)
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth + custom auth endpoints
│   │   ├── trpc/           # tRPC handler
│   │   └── upload/         # File upload endpoint
│   ├── favorites/           # Saved listings
│   ├── listing/[slug]/      # Listing detail
│   ├── messages/            # Messaging (list + [id])
│   ├── new/                 # Create listing
│   ├── profile/             # User profile
│   ├── quick-browse/        # Swipe mode
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home - grid browse
│   └── providers.tsx        # React context providers
│
├── components/
│   ├── layout/              # Layout components
│   │   ├── AppShell.tsx    # Main app wrapper
│   │   ├── BottomNav.tsx   # Mobile bottom navigation
│   │   └── Header.tsx      # App header
│   ├── listings/            # Listing-related components
│   │   ├── DynamicAttributeFields.tsx  # Category-specific form fields
│   │   ├── ListingCard.tsx  # Card for grid display
│   │   ├── ListingGrid.tsx  # Grid container
│   │   └── SwipeDeck.tsx    # Swipe card stack
│   └── ui/                  # shadcn/ui components (don't modify)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── skeleton.tsx
│       └── textarea.tsx
│
├── contracts/               # Type contracts (source of truth for APIs)
│   ├── api.ts              # API response types
│   └── validators.ts       # Zod input schemas
│
├── server/
│   ├── api/
│   │   ├── helpers.ts      # Shared helper functions
│   │   ├── root.ts         # tRPC root router
│   │   ├── trpc.ts         # tRPC setup & middleware
│   │   └── routers/        # Individual routers
│   │       ├── category.ts # Category endpoints
│   │       ├── favorite.ts # Favorite/like endpoints
│   │       ├── listing.ts  # Listing CRUD
│   │       ├── message.ts  # Messaging endpoints
│   │       ├── swipe.ts    # Swipe interactions
│   │       └── user.ts     # User profile endpoints
│   ├── demo/
│   │   └── store.ts        # In-memory demo data store
│   └── db.ts               # Prisma client
│
├── lib/
│   ├── auth.ts             # Authentication utilities
│   ├── auth-config.ts      # NextAuth configuration
│   ├── category-attributes.ts  # Category-specific schemas
│   ├── constants.ts        # App constants (categories, limits)
│   ├── mock-data.ts        # Mock data for demo mode
│   ├── moderation.ts       # Content moderation utilities
│   ├── trpc.ts             # tRPC client setup
│   └── utils.ts            # Utility functions (cn, formatDate)
│
├── prisma/
│   ├── schema.prisma       # DATABASE SCHEMA (source of truth)
│   └── seed.ts             # Seed script
│
├── scripts/
│   └── setup-local.ps1     # Local setup script
│
├── types/
│   └── next-auth.d.ts      # NextAuth type augmentation
│
└── .env.local              # Environment variables (never commit)
```

## Environment Variables

Required for demo mode:
```bash
DEMO_MODE="true"                    # Enable demo mode without database
NEXTAUTH_SECRET="any-random-string" # Required by NextAuth
NEXTAUTH_URL="http://localhost:3000"
```

Required for full mode:
```bash
DEMO_MODE="false"
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."       # For migrations
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://your-domain.com"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## Key Files to Check Before Changes

| If you're changing... | Check these files first |
|----------------------|------------------------|
| Database model | `prisma/schema.prisma`, `contracts/validators.ts` |
| API endpoint | `contracts/api.ts`, `server/api/routers/*.ts` |
| Listing features | `components/listings/*`, `server/api/routers/listing.ts` |
| Auth | `lib/auth-config.ts`, `app/(auth)/*` |
| Mock data | `lib/mock-data.ts` |

## Demo Mode vs Full Mode

**Demo Mode** (`DEMO_MODE="true"`):
- No database required
- Uses mock data from `lib/mock-data.ts`
- Credentials login (any email works)
- Perfect for UI development and demos

**Full Mode** (`DEMO_MODE="false"`):
- Requires PostgreSQL database
- Real data persistence
- Google OAuth authentication
- Required for production

## Coding Patterns

### Creating a New tRPC Endpoint

```typescript
// 1. Define Zod schema in contracts/validators.ts
export const mySchema = z.object({
  title: z.string().min(3).max(100),
});

// 2. Define types in contracts/api.ts
export type MyInput = z.infer<typeof mySchema>;

// 3. Implement in server/api/routers/myrouter.ts
export const myRouter = createTRPCRouter({
  myEndpoint: publicProcedure
    .input(mySchema)
    .query(async ({ ctx, input }) => {
      try {
        // Database logic
        return await ctx.db.model.findMany();
      } catch (error) {
        // Fallback for demo mode
        if (isDemoMode) {
          return MOCK_DATA;
        }
        throw error;
      }
    }),
});
```

### Using tRPC in Components

```typescript
'use client';

import { api } from '@/lib/trpc';

export function MyComponent() {
  const { data, isLoading } = api.listing.list.useQuery({
    limit: 20,
  });

  const mutation = api.listing.create.useMutation({
    onSuccess: () => {
      // Handle success
    },
  });

  if (isLoading) return <Skeleton />;
  return <div>{/* ... */}</div>;
}
```

## Categories (Fixed for MVP)

```typescript
// lib/constants.ts
export const CATEGORIES = [
  { id: 'vehicles', name: 'Vozila', icon: 'Car', order: 0 },
  { id: 'electronics', name: 'Elektronika', icon: 'Smartphone', order: 1 },
  { id: 'home', name: 'Kuća i bašta', icon: 'Home', order: 2 },
  { id: 'fashion', name: 'Moda', icon: 'Shirt', order: 3 },
  { id: 'sports', name: 'Sport i rekreacija', icon: 'Dumbbell', order: 4 },
  { id: 'kids', name: 'Deca i bebe', icon: 'Baby', order: 5 },
  { id: 'pets', name: 'Ljubimci', icon: 'PawPrint', order: 6 },
  { id: 'services', name: 'Usluge', icon: 'Wrench', order: 7 },
] as const;
```

## Don'ts

- **DON'T** modify `components/ui/*` without good reason
- **DON'T** use `any` type - always define proper types
- **DON'T** skip validation - all inputs go through Zod
- **DON'T** hardcode strings - use constants
- **DON'T** store secrets in code - use environment variables

## Do's

- **DO** handle loading and error states
- **DO** use Serbian language for user-facing text
- **DO** add fallback to mock data when implementing new routers
- **DO** keep components under 200 lines
- **DO** test in both demo mode and with real database
