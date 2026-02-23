# SwipeList — Complete Project Context for LLM

> **Purpose**: This document describes every file in the project so an LLM (or developer) can understand the full codebase and suggest edits/improvements without seeing the files directly.
>
> **App Name**: SwipeList  
> **Language**: Serbian (UI labels, error messages, city names)  
> **What it does**: A classifieds marketplace (like KupujemProdajem / Halo Oglasi) with a Tinder-like swipe interface for browsing ads. Users can swipe right to save, left to skip, or browse in a traditional grid. They can post ads, message sellers, and manage favorites.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) + React | 15.5 / 19.2 |
| Styling | Tailwind CSS | 4.x |
| Animations | Framer Motion | 12.x |
| Icons | Lucide React | 0.563 |
| API Layer | tRPC (v11) + React Query | 11.8 / 5.90 |
| Database ORM | Prisma | 5.22 |
| Database | PostgreSQL | (via Docker or hosted) |
| Auth | NextAuth.js (v4) | Google OAuth + demo credentials |
| Validation | Zod | 4.x |
| Package Manager | pnpm | - |

---

## Project Root: `c:\Users\sam\Desktop\old swipe ads\`

---

## 1. DATABASE SCHEMA

### File: `prisma/schema.prisma` (358 lines)

This is the **source of truth** for all data models. PostgreSQL database with 10 models and 5 enums.

**Models:**

1. **User** — User accounts. Fields: `id`, `email` (unique), `name`, `phone`, `avatarUrl`, `city`, `latitude/longitude` (for location search), `isVerified`, `isBanned`, `banReason`, `listingsToday` (rate limiting), `lastListingAt`. Has relations to Listing, Favorite, SwipeEvent, SearchProfile, Message, Conversation, Report.

2. **Listing** — An ad/product post. Fields: `id`, `slug` (unique, URL-friendly), `title` (max 100 chars), `description` (max 2000 chars), `price` (Decimal 12,2), `currency` (default "RSD"), `isNegotiable`, `categoryId` (FK to Category), `condition` (enum), `city`, `address`, `latitude/longitude`, `status` (enum: DRAFT, PENDING_REVIEW, ACTIVE, SOLD, EXPIRED, REJECTED, REMOVED), `moderationScore` (0-1 float), `moderationFlags` (string array), `isFeatured`, `viewCount`, `expiresAt`, `attributes` (JSON — stores category-specific data like car brand/model or apartment sqm/rooms). Indexes on: userId, categoryId, status, city, createdAt, price, and a composite index on (status, categoryId, city).

3. **ListingImage** — Multiple images per listing. Fields: `originalUrl`, `mediumUrl` (600px), `thumbUrl` (200px), `order` (0 = hero), `isApproved`, `moderationScore`. Cascading delete from Listing.

4. **Category** — Predefined categories. Fields: `id` (slug like "vehicles"), `name` (Serbian display name), `icon` (Lucide icon name), `order`, `isActive`. The app has 8 categories: vehicles, electronics, home, fashion, sports, kids, pets, services.

5. **Favorite** — User's saved/liked listings. Unique constraint on (userId, listingId).

6. **SwipeEvent** — Records every swipe. Fields: `direction` (LEFT/RIGHT/UP enum), `timeSpentMs` (analytics). Unique constraint on (userId, listingId) — one swipe per listing per user.

7. **SearchProfile** — Saved search filters with alert capability. Fields: `name`, `categoryIds` (array), `minPrice`, `maxPrice`, `city`, `radiusKm`, `keywords` (array), `conditions` (array), `notifyNew` (boolean for push alerts).

8. **Conversation** — Buyer-seller chat thread. Linked to a specific Listing. Has two participants (User many-to-many).

9. **Message** — Individual chat message. Fields: `content` (max 2000), `isRead`, `readAt`. Relations to sender User and receiver User.

10. **Report** — Content moderation reports. Fields: `reason` (enum: SPAM, SCAM, PROHIBITED_ITEM, WRONG_CATEGORY, DUPLICATE, OFFENSIVE, OTHER), `status` (PENDING, REVIEWED, ACTION_TAKEN, DISMISSED), `details`, `resolution`.

**Enums:** `ListingStatus`, `ItemCondition` (NEW, LIKE_NEW, GOOD, FAIR), `SwipeDirection` (LEFT, RIGHT, UP), `ReportReason`, `ReportStatus`.

### File: `prisma/seed.ts`
Database seeder script. Populates the database with initial categories and demo listings for development.

---

## 2. CONTRACTS LAYER (Shared Types Between Frontend & Backend)

### File: `contracts/validators.ts` (316 lines)
Zod validation schemas for ALL API inputs. Must stay in sync with the Prisma schema. Contains:
- `createListingSchema` — validates title (3-100 chars), description (10-2000 chars), price, currency, category, condition, city, coordinates, attributes (JSON)
- `updateListingSchema` — partial version of create, with required `id`
- `listListingsSchema` — filters: categoryId, city, radiusKm, minPrice, maxPrice, conditions array, query string, excludeSwiped, cursor-based pagination, sortBy (createdAt/price), sortOrder
- `getListingSchema` — by id OR slug
- `changeListingStatusSchema` — only allows SOLD or ACTIVE
- `updateProfileSchema` — name, phone, city, avatar
- `toggleFavoriteSchema` — listingId
- `recordSwipeSchema` — listingId, direction, timeSpentMs
- `getSwipeDeckSchema` — same filters as listListings, optimized for swipe
- `sendMessageSchema` — conversationId or listingId, content
- `createReportSchema` — listingId or reportedUserId, reason, details
- `createSearchProfileSchema` — filters to save
- `requestUploadSchema` / `confirmUploadSchema` — image upload flow
- Exported TypeScript types inferred from each schema (e.g., `CreateListingInput`, `ListListingsInput`, etc.)

### File: `contracts/api.ts` (337 lines)
TypeScript interfaces for ALL API responses. Defines what tRPC endpoints return:
- `PaginatedResponse<T>` — items array, nextCursor, hasMore, totalCount
- `MutationResponse` — success boolean, message
- `ListingCard` — condensed listing for grids/swipe cards (id, slug, title, price, currency, city, condition, categoryId, heroImage thumbnail, seller preview, isFavorited, hasSwiped, attributes)
- `ListingDetail` — full listing extending ListingCard (description, all images, full seller info with phone/city/memberSince/listingCount, viewCount, status, expiresAt)
- `SwipeDeckResponse` — cards array + remaining count
- `SwipeResult` — success + isFavorited
- `CurrentUser` — full user profile with stats (activeListings, totalListings, favoritesCount)
- `PublicProfile` — other user's public info + their active listings
- `ConversationPreview` — for conversation list (listing info, other user, last message, unreadCount)
- `ConversationDetail` — full conversation with all messages
- `MessageItem` — id, content, isFromMe, isRead, createdAt
- `CategoryItem` — id, name, icon, listingCount
- `SearchProfileItem` — saved filter with matchCount
- `UploadUrlResponse` / `ConfirmUploadResponse` — image upload flow
- `ModerationResult` — isApproved, score, flags
- `ListingAnalytics` — views, favorites, swipes, messages, dailyViews

---

## 3. SERVER / BACKEND

### File: `server/db.ts`
Prisma client singleton. Creates one database connection and reuses it (avoids connection exhaustion in development with hot reloading).

### File: `server/api/trpc.ts`
tRPC initialization. Defines:
- `createTRPCContext` — creates context with database client and current user session
- `publicProcedure` — no auth required
- `protectedProcedure` — requires authenticated user, throws UNAUTHORIZED if not logged in

### File: `server/api/root.ts`
Root tRPC router. Merges all sub-routers:
- `listing` — CRUD operations
- `favorite` — toggle and list
- `swipe` — deck and recording
- `user` — profile management
- `message` — conversations and messages
- `category` — category listing

### File: `server/api/helpers.ts`
Helper functions used by routers:
- `toListingCard()` — transforms Prisma Listing into ListingCard response type
- `toListingDetail()` — transforms into full ListingDetail
- `generateSlug()` — creates URL-friendly slugs from titles

### File: `server/api/routers/listing.ts` (389 lines)
Listing CRUD router with 5 endpoints:
- `get` (public) — get single listing by id or slug, increments viewCount
- `list` (public) — paginated listing search with category/city/price/condition/keyword filters, cursor pagination, sorting by price or date
- `create` (protected) — creates new listing with rate limiting (max 5/day), auto-generates slug, sets 30-day expiry
- `update` (protected) — updates own listing only
- `delete` (protected) — deletes own listing only (cascading deletes images, favorites, etc.)
All endpoints have demo mode fallback that returns mock data if database is unavailable.

### File: `server/api/routers/favorite.ts`
- `toggle` (protected) — adds or removes a favorite
- `list` (protected) — paginated list of user's favorites

### File: `server/api/routers/swipe.ts`
- `deck` (public) — gets next batch of listings user hasn't swiped on, with filters
- `record` (protected) — records a swipe event, auto-favorites on RIGHT swipe

### File: `server/api/routers/user.ts`
- `me` (protected) — get current user profile with stats
- `profile` (public) — get another user's public profile
- `update` (protected) — update own profile

### File: `server/api/routers/message.ts`
- `conversations` (protected) — list user's conversations with previews
- `conversation` (protected) — get full conversation with messages
- `send` (protected) — send message, auto-creates conversation if first message about a listing

### File: `server/api/routers/category.ts`
- `list` (public) — returns all active categories with listing counts

### File: `server/demo/store.ts` (1223 lines)
In-memory mock data store for running without a database. Contains:
- 6+ fully detailed demo listings with category-specific attributes
- 2 demo users (Ana Marković, Milica Jovanović)
- Demo favorites, swipes, conversations, and messages
- Full CRUD implementations that mimic what the real database routers do
- This is what the app uses when `DEMO_MODE=true` in `.env`

---

## 4. AUTH & LIB (Shared Utilities)

### File: `lib/auth-config.ts` (131 lines)
NextAuth configuration:
- **Google Provider** — real OAuth (requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env)
- **Demo Credentials Provider** — one-click login with any email when DEMO_MODE=true
- JWT session strategy
- `signIn` callback — upserts user in database on login
- `jwt` callback — attaches userId to token
- `session` callback — passes userId to client session

### File: `lib/auth.ts`
Helper that wraps `getServerSession(authOptions)` for easy import.

### File: `lib/trpc.ts`
tRPC React client setup. Creates typed hooks: `api.listing.list.useQuery()`, `api.swipe.record.useMutation()`, etc.

### File: `lib/constants.ts` (217 lines)
Single source of truth for all magic values:
- `CATEGORIES` — 8 categories with ids, Serbian names, Lucide icon names, display order
- `CONDITIONS` — 4 item conditions with Serbian descriptions
- `CITIES` — 15 Serbian cities with latitude/longitude
- `LIMITS` — rate limits (5 listings/day, 50 messages/hour, 10 reports/day, 3 reports to auto-hide, etc.), image sizes, pagination defaults
- `CURRENCY` — RSD with Serbian locale formatting
- `MODERATION` — thresholds for OpenAI text moderation and image moderation
- `ROUTES` — all app routes (/, /login, /quick-browse, /favorites, /messages, /profile, /new, /listing/[slug], etc.)
- `UI` — swipe threshold (100px), animation durations, grid column breakpoints
- `ERRORS` — all error messages in Serbian
- `SUCCESS` — all success messages in Serbian
- `formatPrice()` — formats numbers with Serbian locale + currency

### File: `lib/category-attributes.ts` (492 lines)
Category-specific attribute definitions. For each category, defines:
- Zod validation schema
- Form field definitions (name, label, type, required, options, min/max, suffix)
- TypeScript types

Categories with attributes:
- **Vehicles** — brand (20+ Serbian market brands), model, year, mileage, fuel type (benzin/dizel/gas/struja/hibrid), transmission (manuelni/automatik), body type (limuzina/hecbek/karavan/SUV/kupe/kabriolet/kombi/pickup), engineCC, horsePower
- **Real Estate** — propertyType (stan/kuća/vikendica/plac/garaža/poslovni prostor), transactionType (prodaja/izdavanje/zamena), sqm, rooms, floor, totalFloors, heating type, parking, furnished, yearBuilt
- **Electronics** — deviceType (telefon/laptop/desktop/tablet/TV/konzola/kamera/audio), brand, model, storageGB, ramGB, screenSize
- **Fashion** — fashionType, size (XS-3XL), shoeSize, gender (muško/žensko/unisex), brand, material
- **Sports** — sportType (fitnes/biciklizam/fudbal/tenis/skijanje/plivanje/kampovanje/lov i ribolov)
- **Pets** — petType (pas/mačka/ptica/riba/gmizavac/glodari), breed, age, isVaccinated, hasDocuments

Also exports:
- `getCategoryFields(categoryId)` — returns form fields for a category
- `getCategorySchema(categoryId)` — returns Zod schema for a category
- `validateCategoryAttributes(categoryId, data)` — validates attributes against category schema

### File: `lib/mock-data.ts`
Frontend-side mock listings data used when tRPC queries fail in demo mode. Returns ListingCard objects.

### File: `lib/moderation.ts`
Content moderation utilities:
- `moderateText()` — basic profanity/scam detection
- `moderateListing()` — checks title + description
- Placeholder for future OpenAI/Sightengine integration

### File: `lib/utils.ts`
General utilities:
- `cn()` — className merger (clsx + tailwind-merge)
- `formatDate()` — date formatting for Serbian locale

---

## 5. FRONTEND PAGES (Next.js App Router)

### File: `app/layout.tsx`
Root layout. Wraps app in providers (tRPC, React Query, Session), sets Inter font, includes global CSS, renders AppShell layout component.

### File: `app/providers.tsx`
Provider stack: SessionProvider (NextAuth) → QueryClientProvider (React Query) → tRPC Provider.

### File: `app/globals.css`
Tailwind CSS imports + custom CSS variables for the design system (colors, radii, shadows).

### File: `app/page.tsx` (129 lines)
**Homepage**. Shows:
- Hero section with app tagline and "Quick Browse" / "Post Ad" CTAs
- Trend stats card (hardcoded for now)
- Search input with live filtering
- Category filter buttons
- ListingGrid component with filters passed as props

### File: `app/quick-browse/page.tsx`
**Swipe mode page**. Full-screen Tinder-like card swiping interface. Uses the SwipeDeck component.

### File: `app/listing/[slug]/page.tsx` (163 lines)
**Listing detail page**. Shows:
- Immersive hero image (50vh)
- Condition badge, city, title, price
- Description card
- Image gallery (horizontal scroll)
- Seller sidebar card with avatar, name, verified badge, phone, city
- "Send message" CTA button
- Loading skeleton and error states

### File: `app/new/page.tsx` (384 lines)
**Create new listing page**. Multi-section form with:
- Title, description, price, currency toggle (RSD/EUR)
- Category selection (8 categories as cards)
- Condition selection (4 options as cards)
- City selection dropdown (15 cities)
- DynamicAttributeFields component (renders category-specific fields)
- Framer Motion step animations
- Submit via `api.listing.create.useMutation()`
- Redirects to listing detail page on success

### File: `app/favorites/page.tsx`
**Favorites page**. Shows user's saved listings in a grid. Uses `api.favorite.list.useQuery()`.

### File: `app/messages/page.tsx`
**Conversations list page**. Shows conversation previews with last message, unread count, and other user info.

### File: `app/messages/[id]/page.tsx`
**Single conversation page**. Shows message thread with real-time-like UI. Send message form at bottom.

### File: `app/profile/page.tsx`
**User profile page**. Shows avatar, name, email, stats (active listings, favorites count), and user's own listings.

### File: `app/(auth)/login/page.tsx`
**Login page**. Google OAuth button + demo login option. Uses NextAuth `signIn()`.

### File: `app/(auth)/register/page.tsx`
**Register page**. Currently redirects to login (registration happens via Google OAuth auto-creation).

### API Routes:
- `app/api/auth/[...nextauth]/route.ts` — NextAuth catch-all route handler
- `app/api/auth/login/route.ts` — custom login endpoint
- `app/api/auth/logout/route.ts` — custom logout endpoint
- `app/api/auth/register/route.ts` — registration endpoint
- `app/api/trpc/[trpc]/route.ts` — tRPC catch-all route handler (connects frontend tRPC client to server routers)
- `app/api/upload/route.ts` — image upload endpoint (placeholder)

---

## 6. FRONTEND COMPONENTS

### Layout Components:

- **`components/layout/AppShell.tsx`** — Main app wrapper. Mobile-first design with header at top, content in middle, bottom nav fixed at bottom. Manages responsive breakpoints.
- **`components/layout/Header.tsx`** — Top header bar with logo, search trigger, and user avatar/login button.
- **`components/layout/BottomNav.tsx`** — Fixed bottom navigation with 5 tabs: Home, Quick Browse (swipe), Post Ad (center CTA), Favorites, Profile. Shows active state, unread message badge.

### Listing Components:

- **`components/listings/ListingCard.tsx`** — Individual ad card for grid view. Shows hero image, price, title, city, condition badge, favorite button. Click navigates to detail page.
- **`components/listings/ListingGrid.tsx`** — Responsive grid of ListingCards. Accepts filter props, fetches listings via `api.listing.list.useQuery()`, cursor-based "Load More" pagination.
- **`components/listings/SwipeDeck.tsx`** — The core Tinder-like swipe component. Uses Framer Motion for drag gestures. Shows card stack with current card on top. Drag right = like (saves to favorites), drag left = pass. Shows "SAČUVANO" / "PRESKOČENO" labels during swipe. Pass/Like/Info buttons below the deck.
- **`components/listings/DynamicAttributeFields.tsx`** — Renders category-specific form fields dynamically. When user selects "Vehicles" category, it shows brand/model/year/mileage/fuel fields. When user selects "Electronics", it shows deviceType/brand/storage fields. Uses field definitions from `lib/category-attributes.ts`.

### UI Primitives (Reusable):

- **`components/ui/button.tsx`** — Button with variants: default (primary), secondary, outline, ghost, destructive. Sizes: sm, default, lg, icon.
- **`components/ui/card.tsx`** — Container card with rounded corners and subtle border/shadow.
- **`components/ui/input.tsx`** — Styled text input with focus ring.
- **`components/ui/textarea.tsx`** — Multi-line text input.
- **`components/ui/badge.tsx`** — Small label/tag component for condition badges, categories, etc.
- **`components/ui/skeleton.tsx`** — Loading placeholder animation component.

---

## 7. CONFIGURATION FILES

- **`package.json`** — Dependencies and scripts (`dev`, `build`, `start`, `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed`, `db:reset`)
- **`tsconfig.json`** — TypeScript config with `@/` path alias mapping to project root
- **`next.config.ts`** — Next.js configuration (image domains allowed for Unsplash)
- **`postcss.config.mjs`** — PostCSS config for Tailwind
- **`eslint.config.mjs`** — ESLint config (Next.js defaults)
- **`.env.local`** — Environment variables: `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DEMO_MODE`
- **`pnpm-workspace.yaml`** — pnpm workspace config
- **`pnpm-lock.yaml`** — Lock file
- **`types/next-auth.d.ts`** — TypeScript augmentation to add `id` field to NextAuth Session user type
- **`next-env.d.ts`** — Next.js auto-generated type declarations

---

## 8. SETUP & UTILITY SCRIPTS

- **`setup.ps1`** — PowerShell script for initial project setup (installs deps, generates Prisma client)
- **`scripts/setup-local.ps1`** — Local development setup script
- **`enable-sqlite.ps1`** — Script to switch database to SQLite for simpler local dev
- **`enable-php-ext.ps1`** — PHP extension enabler (for when a Laravel version was being explored)
- **`install-laravel.ps1`** — Laravel installation script (alternative backend was explored)

---

## 9. DOCUMENTATION

- **`README.md`** — Project overview, features list, tech stack
- **`SETUP.md`** — Step-by-step local development setup (Docker PostgreSQL, pnpm install, env vars, prisma migrate)
- **`LOCAL_DEPLOY.md`** — Deployment instructions for local/staging
- **`HANDOFF.md`** — Previous developer handoff notes
- **`MVP_BACKLOG.md`** — Feature backlog organized by priority
- **`PROJECT_INSTRUCTIONS.md`** — Coding guidelines and conventions
- **`GEMINI_DESIGN_PROMPT.md`** — Design system specifications and UI/UX guidelines
- **`RESOURCE_USAGE.md`** — Infrastructure resource usage notes
- **`AGENTS.md`** — AI agent instructions (for Codex)
- **`CLAUDE.md`** — AI assistant context (for Claude)

---

## 10. STANDALONE VERSION (Simplified Vanilla JS)

Location: `standalone/` subdirectory. A no-dependency version for quick demos:

- **`standalone/index.html`** (197 lines) — Single HTML file with all views: swipe deck, listings grid, create ad form, profile/login, favorites. 5-tab bottom navigation.
- **`standalone/css/style.css`** (670 lines) — Complete dark theme design: CSS variables, card layouts, swipe animations, form styles, bottom nav with raised center button, responsive breakpoints.
- **`standalone/js/app.js`** (400 lines) — All frontend logic: view switching, swipe gesture handling (touch + mouse), card rendering, create/delete ad CRUD, mock Google login with localStorage, favorites management.
- **`standalone/js/data.js`** (413 lines) — 25 hardcoded demo listings across all categories with seller info, prices in RSD/EUR, Unsplash images. Condition labels in Serbian. `formatPrice()` helper.
- **`standalone/server/server.js`** (113 lines) — Node.js HTTP static file server on port 4000. MIME type handling, 404 page, no external dependencies.
- **`standalone/start.bat`** / **`standalone/start.ps1`** — Launch scripts that start the server and open browser.
- **`standalone/README.md`** — Setup instructions for the standalone version.

---

## 11. OTHER DIRECTORIES (Can be ignored)

- **`old version of the proj/`** — Previous version of lib files, kept as backup. Identical structure to current `lib/`.
- **`swipelist-laravel/`** — Abandoned Laravel backend experiment. Not connected to the main app.
- **`.next/`** — Next.js build output (auto-generated, gitignored)
- **`node_modules/`** — Dependencies (auto-installed via pnpm)

---

## KEY DESIGN DECISIONS TO KNOW

1. **Demo Mode**: When `DEMO_MODE=true` in `.env`, the app works without a database. All routers fall back to in-memory mock data (`server/demo/store.ts`). Auth uses credentials provider instead of Google OAuth.

2. **Category Attributes**: Instead of separate tables per category, the schema uses a single `attributes` JSON column on Listing. The shape of this JSON is validated per-category using Zod schemas defined in `lib/category-attributes.ts`.

3. **Swipe = Favorite**: Swiping RIGHT on a card automatically adds it to favorites. The SwipeEvent table logs all swipes for analytics, while the Favorite table stores the actual saved items.

4. **Moderation Pipeline**: Listings start as `PENDING_REVIEW` and go through moderation (planned: OpenAI text + Sightengine image checks). After 3 reports, a listing is auto-hidden.

5. **Serbian Locale**: All UI text, error messages, success messages, city names, and category names are in Serbian. Currency is Serbian Dinar (RSD) by default with EUR option.

6. **Image Variants**: The schema supports 3 image sizes (thumb 200px, medium 600px, original). The upload service (not yet built) would generate these on upload.
