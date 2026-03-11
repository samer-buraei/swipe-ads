# SwipeList - Tinder-Style Marketplace for Serbia

> Historical/high-level product overview. For the current deployed state, known issues, and active backlog, use `AGENTS.md`, `STATUS.md`, and `REVAMP_TODO.md`.

> **Brza kupovina u ritmu grada** (Fast buying in the rhythm of the city)

A modern classified ads platform with Tinder-like swipe interface, built for the Serbian market.

![Status](https://img.shields.io/badge/Status-MVP%20Development-yellow)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/License-Private-red)

## Overview

SwipeList reimagines classified ads with a mobile-first, swipe-based interface. Users can browse listings the traditional way (grid) or use the "Quick Browse" mode to swipe through items like Tinder - right to save, left to skip.

### Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| Swipe Browse | ✅ Working | Tinder-style card swiping with gestures |
| Grid Browse | ✅ Working | Traditional grid with filters |
| Dynamic Forms | ✅ Working | Category-specific fields (vehicles, real estate, etc.) |
| Favorites | ✅ Working | Save listings, view saved items |
| Messaging | ✅ Working | Buyer-seller conversations |
| User Profiles | ✅ Working | Profile pages with listings |
| Category Filters | ✅ Working | 8 categories with icons |
| Search | ✅ Working | Full-text search |
| Geolocation | ✅ Working | Distance-based filtering |
| Real Database | ⏳ Pending | Currently using in-memory demo store |
| Authentication | ⏳ Pending | Currently using demo user |
| Image Upload | ⏳ Pending | Using placeholder images |
| Content Moderation | ⏳ Pending | Infrastructure ready |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

## Tech Stack

### Frontend
- **Next.js 15.5** - App Router, React 19
- **TypeScript 5** - Full type safety
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Swipe animations
- **shadcn/ui** - UI components
- **Lucide Icons** - Icon library

### Backend
- **tRPC 11** - Type-safe API
- **Zod 4** - Runtime validation
- **Prisma 5** - ORM (schema ready)
- **PostgreSQL** - Database (not connected yet)

### Architecture
- End-to-end type safety (Zod → tRPC → React Query)
- Contract-first API design (`/contracts`)
- Mobile-first responsive design
- Serbian language UI

## Project Structure

```
swipe-ads/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── api/               # API routes (auth, tRPC, upload)
│   ├── favorites/         # Saved listings
│   ├── listing/[slug]/    # Listing detail
│   ├── messages/          # Conversations (list + [id])
│   ├── new/               # Create listing
│   ├── profile/           # User profile
│   ├── quick-browse/      # Swipe mode
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home (grid browse)
│   └── providers.tsx      # React context providers
│
├── components/
│   ├── layout/            # AppShell, Header, BottomNav
│   ├── listings/          # ListingCard, ListingGrid, SwipeDeck, DynamicAttributeFields
│   └── ui/                # shadcn components (don't edit)
│
├── contracts/             # API types & validators
│   ├── api.ts            # Response types
│   └── validators.ts     # Zod schemas
│
├── server/
│   ├── api/
│   │   ├── helpers.ts    # Shared helpers
│   │   ├── root.ts       # tRPC root router
│   │   ├── trpc.ts       # tRPC setup
│   │   └── routers/      # Individual routers (listing, swipe, favorite, message, user, category)
│   ├── demo/store.ts     # In-memory demo data
│   └── db.ts             # Prisma client
│
├── lib/
│   ├── auth.ts           # Auth utilities
│   ├── auth-config.ts    # NextAuth configuration
│   ├── category-attributes.ts  # Dynamic form schemas
│   ├── constants.ts      # Categories, cities, limits
│   ├── mock-data.ts      # Mock data for demo mode
│   ├── moderation.ts     # Content moderation
│   ├── trpc.ts           # tRPC client
│   └── utils.ts          # Utility functions
│
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
│
├── scripts/              # Setup scripts
│
└── types/                # TypeScript type augmentations
```

## Categories

| ID | Serbian Name | Icon | Dynamic Fields |
|----|--------------|------|----------------|
| vehicles | Vozila | Car | Brand, model, year, mileage, fuel, transmission |
| home | Kuća i bašta | Home | Property type, sqm, rooms, floor, heating |
| electronics | Elektronika | Smartphone | Device type, brand, storage, RAM |
| fashion | Moda | Shirt | Type, size, gender, brand |
| sports | Sport | Dumbbell | Sport type, brand, size |
| kids | Deca | Baby | Type, age group, gender |
| pets | Ljubimci | PawPrint | Pet type, breed, vaccinated |
| services | Usluge | Wrench | Service type, price type, experience |

## NPM Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database
```

## Environment Variables

Create `.env.local`:

```bash
# Database (required for production)
DATABASE_URL="postgresql://user:pass@host:5432/swipelist"
DIRECT_URL="postgresql://user:pass@host:5432/swipelist"

# Supabase Auth (optional, for real auth)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"
SUPABASE_SERVICE_ROLE_KEY="xxx"

# Search (optional)
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="xxx"

# Moderation (optional)
OPENAI_API_KEY="xxx"
SIGHTENGINE_USER="xxx"
SIGHTENGINE_SECRET="xxx"
```

## API Endpoints (tRPC)

### Listings
- `listing.list` - List with filters, pagination
- `listing.get` - Get by id or slug
- `listing.create` - Create new (protected)
- `listing.update` - Update (protected)
- `listing.delete` - Delete (protected)
- `listing.changeStatus` - Mark sold/active (protected)
- `listing.myListings` - User's listings (protected)

### Favorites
- `favorite.toggle` - Add/remove favorite (protected)
- `favorite.list` - Get user's favorites (protected)

### Swipe
- `swipe.getDeck` - Get cards for swiping (protected)
- `swipe.record` - Record swipe event (protected)

### Messages
- `message.listConversations` - Get conversations (protected)
- `message.getConversation` - Get single conversation (protected)
- `message.send` - Send message (protected)
- `message.markRead` - Mark as read (protected)

### User
- `user.me` - Current user (protected)
- `user.get` - Public profile
- `user.update` - Update profile (protected)

### Categories
- `category.list` - Get all categories

## Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Mobile (<768px) | Bottom navigation, 1-2 column grid |
| Desktop (≥768px) | Top header, 3-4 column grid |

## Demo Mode

Currently runs with in-memory data:
- Demo user: Ana Marković (demo@swipelist.rs)
- ~15 sample listings across categories
- Data resets on server restart

## Next Steps

See [HANDOFF.md](./HANDOFF.md) for detailed implementation roadmap.

## Contributing

This is a private project. See [CLAUDE.md](./CLAUDE.md) for AI coding guidelines.

---

Built with ❤️ for the Serbian market
