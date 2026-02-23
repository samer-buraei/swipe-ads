# SwipeMarket — Full Project Handoff & Implementation Plan
**Version:** 2.0  
**Prepared for:** Gemini / Continuing Developer  
**Project root:** `c:\Users\sam\Desktop\old swipe ads\`

---

## PART 1 — WHAT THIS PROJECT IS

SwipeMarket is a Serbian classifieds marketplace mobile-first web app that combines:
- **Tinder-style swipe browsing** (swipe right = save, swipe left = hide forever, swipe up = contact seller immediately)
- **Traditional classifieds** (category browsing, search, posting listings) modeled after Halo Oglasi and KupujemProdajem
- **TikTok-style short video** support on listings (planned)

Target market: Serbian-speaking users in Serbia, primarily mobile. Prices shown in both RSD and EUR. Authentication via phone number OTP (primary) and Google OAuth (secondary).

The swipe mechanic is the core differentiator. Every other feature (saved items, messaging, profile, posting) exists to support the discovery-via-swiping loop.

---

## PART 2 — CURRENT TECH STACK

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 15 | App Router |
| UI Library | React | 19 | Bleeding edge — watch for bugs |
| Language | TypeScript | 5.x | Strict mode |
| ORM | Prisma | 5.22 | PostgreSQL adapter |
| Database | PostgreSQL | 15+ | |
| API Layer | tRPC | 11 | 6 routers |
| Auth | NextAuth | 4 | Google OAuth + demo credentials |
| Validation | Zod | 4 | Shared validators |
| Animation | Framer Motion | latest | Swipe deck only |
| Styling | Tailwind | 4 | |
| State | TanStack Query | 5 | Via tRPC client |

**Standalone version:** `/standalone/` — Vanilla JS, no dependencies, uses Node static server on port 4000. Consider this DEPRECATED — do not add features here.

---

## PART 3 — CURRENT FILE STRUCTURE

```
/
├── schema.prisma                    # 358 lines, 10 models — DO NOT modify without migration plan
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.local                       # DB URL, OAuth secrets
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Homepage
│   │   ├── providers.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── Header.tsx
│   │   ├── listings/
│   │   │   ├── ListingCard.tsx
│   │   │   ├── ListingGrid.tsx
│   │   │   ├── SwipeDeck.tsx        # Core feature component
│   │   │   └── DynamicAttributeFields.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── badge.tsx
│   │       ├── skeleton.tsx
│   │       └── textarea.tsx
│   │
│   ├── server/
│   │   ├── db.ts                    # Prisma singleton
│   │   ├── api/
│   │   │   ├── trpc.ts
│   │   │   ├── root.ts
│   │   │   ├── helpers.ts
│   │   │   └── routers/
│   │   │       ├── listing.ts
│   │   │       ├── favorite.ts
│   │   │       ├── swipe.ts
│   │   │       ├── user.ts
│   │   │       ├── message.ts
│   │   │       └── category.ts
│   │   └── demo/
│   │       └── store.ts             # 1223 lines — in-memory mock
│   │
│   └── lib/
│       ├── auth-config.ts
│       ├── auth.ts
│       ├── trpc.ts
│       ├── constants.ts
│       ├── category-attributes.ts   # 492 lines — move to DB (see Change #5)
│       ├── mock-data.ts
│       ├── moderation.ts
│       └── utils.ts
│
├── contracts/
│   ├── validators.ts                # 316 lines — Zod schemas
│   └── api.ts                      # 337 lines — TypeScript interfaces
│
└── standalone/                      # DEPRECATED — do not extend
    ├── index.html
    ├── css/style.css
    ├── js/app.js
    ├── js/data.js
    └── server/server.js
```

---

## PART 4 — CURRENT DATABASE SCHEMA SUMMARY

The schema is production-grade. Do not restructure it without a Prisma migration. Key models:

**User** — accounts, profiles, rate limiting, ban flags, verification status  
**Listing** — ads with title, description, price, currency enum, condition enum, status enum, JSON attributes field, moderation fields  
**ListingImage** — originalUrl, mediumUrl, thumbUrl, display order  
**Category** — predefined slugs, Serbian names, icons, sort order  
**Favorite** — user+listing unique pair (right swipe saves here)  
**SwipeEvent** — direction (LEFT/RIGHT/UP), timeSpentMs, listingId, userId  
**SearchProfile** — saved search filters with notification flag  
**Conversation** — listingId, two participant users  
**Message** — content, read receipts, conversationId  
**Report** — reason enum, resolution status  

**Enums already defined:**
- `ListingStatus`: DRAFT, PENDING_REVIEW, ACTIVE, SOLD, EXPIRED, REJECTED, REMOVED
- `ItemCondition`: NEW, LIKE_NEW, GOOD, FAIR
- `SwipeDirection`: LEFT, RIGHT, UP
- `ReportReason`: SPAM, SCAM, PROHIBITED_ITEM, WRONG_CATEGORY, DUPLICATE, OFFENSIVE, OTHER
- `ReportStatus`: PENDING, REVIEWED, ACTION_TAKEN, DISMISSED

---

## PART 5 — WHAT STILL NEEDS TO BE BUILT (CRITICAL GAPS)

Before any beta launch, these three things are blocking:

1. **Image upload pipeline** — schema has image URLs but no upload mechanism exists
2. **Real-time messaging** — Conversation and Message models exist but no WebSocket layer
3. **Full-text search** — listListings uses basic filters, no text search at scale

These are not backlog items. They are table-stakes for a classifieds app. Implement in this order.

---

## PART 6 — ALL CHANGES TO IMPLEMENT

Changes are ordered by priority. Complete each one fully before starting the next.

---

### CHANGE 1 — Replace Demo Auth with Phone Number OTP (Priority: CRITICAL)

**Why:** Serbian marketplace users trust phone number auth. Google OAuth is too foreign for the target demographic. Phone number is also the standard fraud-reduction mechanism for classifieds (one phone = one account).

**What to build:**

**1.1 — Install dependencies:**
```bash
npm install twilio
```

**1.2 — Add to `.env.local`:**
```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_VERIFY_SERVICE_SID=your_verify_sid
```

**1.3 — Create `src/server/api/routers/auth.ts`:**

This router needs two procedures:

`sendOtp` — public procedure, takes `{ phone: string }` (E.164 format, e.g. +381641234567), validates the phone with Zod regex `^\\+[1-9]\\d{1,14}$`, calls Twilio Verify API `client.verify.v2.services(SID).verifications.create({ to: phone, channel: 'sms' })`, returns `{ success: boolean }`.

`verifyOtp` — public procedure, takes `{ phone: string, code: string }` where code is 6 digits, calls Twilio `verificationChecks.create({ to: phone, code })`, if approved: upsert User record with phone as identifier, create NextAuth session via JWT, return `{ token: string, user: UserDTO }`. If not approved: throw tRPC error UNAUTHORIZED.

**1.4 — Update `src/lib/auth-config.ts`:**

Add a `CredentialsProvider` for phone+OTP alongside existing Google provider. The credentials provider receives `{ phone, verifiedToken }` where verifiedToken is a short-lived JWT you issue after OTP success (so NextAuth credential submit proves OTP was already verified). Sign this token with `NEXTAUTH_SECRET`.

**1.5 — Update `schema.prisma` — User model:**
Add fields:
```prisma
phone         String?   @unique
phoneVerified DateTime?
```
Then run: `npx prisma migrate dev --name add_phone_auth`

**1.6 — Create `src/app/(auth)/login/page.tsx`:**

Two-step UI:
- Step 1: Phone input with Serbian flag prefix (+381), "Pošalji kod" button, calls `sendOtp` mutation
- Step 2: 6-digit OTP input (auto-advance between digit boxes), "Potvrdi" button, calls `verifyOtp` mutation, on success redirects to `/`
- Below OTP step: "Nisam primio kod — pošalji ponovo" link with 60-second cooldown timer
- Keep "Nastavi sa Google" as a secondary option below a divider

**1.7 — Update `contracts/validators.ts`:**
Add:
```typescript
export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Unesite validan broj telefona')
});
export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  code: z.string().length(6).regex(/^\d{6}$/)
});
```

---

### CHANGE 2 — Image Upload Pipeline (Priority: CRITICAL)

**Why:** Every listing requires photos. The schema has image URL fields but there is no mechanism to actually upload, resize, or store images. Without this no real listing can be created.

**What to build:**

**2.1 — Install dependencies:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp
```

**2.2 — Add to `.env.local`:**
```
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY=your_access_key
CLOUDFLARE_R2_SECRET_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET=swipemarket-images
CLOUDFLARE_R2_PUBLIC_URL=https://images.swipemarket.rs
```

Use Cloudflare R2 — it is S3-compatible, has no egress fees, and has a CDN built in. The AWS SDK works with R2 by setting the endpoint URL.

**2.3 — Create `src/server/upload.ts`:**

```typescript
// S3 client pointed at R2
const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: CLOUDFLARE_R2_SECRET_KEY
  }
});

// Generate presigned URL for direct browser upload
export async function getPresignedUploadUrl(key: string, contentType: string) {
  // Returns a URL the browser can PUT to directly — no server memory used
}

// After upload: fetch from R2, resize with sharp, upload variants
export async function processUploadedImage(key: string): Promise<{
  originalUrl: string;
  mediumUrl: string;  // 800px wide
  thumbUrl: string;   // 300px wide square crop
}>
```

**2.4 — Create `src/app/api/upload/route.ts` (Next.js Route Handler):**

POST endpoint that:
1. Verifies user session (reject if unauthenticated)
2. Validates file type (jpeg, png, webp only) and size (max 10MB)
3. Calls `getPresignedUploadUrl()` and returns the presigned URL + the final image key to the client
4. Client uploads directly to R2 using the presigned URL
5. Client then calls a second endpoint `POST /api/upload/process` with the key
6. Server fetches from R2, runs sharp resize, uploads variants, returns final URLs

**2.5 — Create `src/components/listings/ImageUploader.tsx`:**

Component that:
- Shows a grid of upload slots (1 large primary + up to 14 smaller)
- Drag-and-drop support on desktop
- Tap-to-upload on mobile
- Shows upload progress per image (0–100% bar)
- Shows thumbnail preview after upload
- Red X delete button on each uploaded image
- Reorderable via drag (primary image is always index 0)
- Calls the presigned URL flow described above
- Emits `onChange(images: {originalUrl, mediumUrl, thumbUrl}[])` to parent form

**2.6 — Update `src/server/api/routers/listing.ts`:**

The `create` and `update` procedures must now accept `images: ListingImageInput[]` and after creating the Listing record, create `ListingImage` records in the same transaction using `prisma.$transaction`.

---

### CHANGE 3 — Real-Time Messaging with Pusher (Priority: CRITICAL)

**Why:** Classifieds without real-time messaging is unusable. KP and Halo both have it. Building raw WebSockets in Next.js is painful and not scalable. Pusher Channels is the fastest production-ready path.

**What to build:**

**3.1 — Install dependencies:**
```bash
npm install pusher pusher-js
```

**3.2 — Add to `.env.local`:**
```
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

**3.3 — Create `src/server/pusher.ts`:**
```typescript
import Pusher from 'pusher';
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});
```

**3.4 — Create `src/lib/pusher-client.ts`:**
```typescript
import PusherJs from 'pusher-js';
export const pusherClient = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
});
```

**3.5 — Update `src/server/api/routers/message.ts`:**

The `sendMessage` procedure, after creating the Message record in Prisma, must call:
```typescript
await pusherServer.trigger(
  `private-conversation-${conversationId}`,
  'new-message',
  { message: newMessage }
);
```

Also trigger a separate event on a user-specific channel for the notification badge:
```typescript
await pusherServer.trigger(
  `private-user-${recipientId}`,
  'new-message-notification',
  { conversationId, preview: content.slice(0, 60) }
);
```

**3.6 — Create `src/app/api/pusher/auth/route.ts`:**
Pusher requires server-side auth for private channels. This endpoint receives `{ socket_id, channel_name }`, verifies the current user session, confirms the user is a participant in the requested conversation, then returns `pusherServer.authorizeChannel(socket_id, channel_name)`.

**3.7 — Create `src/components/messages/ConversationView.tsx`:**

Component that:
- Fetches initial message history via tRPC `message.getConversation`
- Subscribes to `private-conversation-${conversationId}` Pusher channel on mount
- Unsubscribes on unmount
- On `new-message` event: appends message to local state without refetch
- Renders messages as chat bubbles (sent right/blue, received left/gray)
- Shows sender avatar + timestamp on each message group
- Has sticky input bar at bottom with text input + send button + image attachment icon
- Optimistic updates: show sent message immediately with "sending" indicator, confirm/error after server response
- Auto-scrolls to bottom on new message

**3.8 — Create `src/components/messages/ConversationList.tsx`:**

- Lists all conversations for current user
- Each row: listing thumbnail + listing title + last message preview + timestamp + unread count badge
- Subscribes to `private-user-${userId}` for notification updates
- On `new-message-notification`: increments unread count on the relevant conversation row without full refetch
- Clicking a row opens ConversationView

---

### CHANGE 4 — Full-Text Search with PostgreSQL (Priority: HIGH)

**Why:** The existing `listListings` filter uses Prisma `contains` which translates to PostgreSQL `ILIKE '%term%'` — this cannot use indexes and will do full table scans. At 50,000+ listings this becomes unusable.

**What to build:**

PostgreSQL has built-in full-text search (`tsvector`/`tsquery`) that is good enough for launch and requires no external service.

**4.1 — Update `schema.prisma` — Listing model:**
Add a generated column for the search vector:
```prisma
searchVector  Unsupported("tsvector")?

@@index([searchVector], type: Gin, map: "listing_search_vector_idx")
```

**4.2 — Create migration `prisma/migrations/add_search_vector.sql`:**
```sql
-- Add the generated tsvector column
ALTER TABLE "Listing" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(city, '')), 'C')
  ) STORED;

-- GIN index for fast search
CREATE INDEX listing_search_vector_idx ON "Listing" USING GIN ("searchVector");
```

Use `'simple'` dictionary (not `'english'`) because Serbian words should not be English-stemmed.

**4.3 — Update `src/server/api/helpers.ts`:**
Add a `buildSearchQuery` helper:
```typescript
export function buildSearchQuery(query: string): Prisma.Sql {
  // Converts "macbook pro" to "macbook & pro" for tsquery
  const tsQuery = query.trim().split(/\s+/).join(' & ');
  return Prisma.sql`"searchVector" @@ to_tsquery('simple', ${tsQuery})`;
}
```

**4.4 — Update `src/server/api/routers/listing.ts` — `listListings` procedure:**

When `input.query` is present and non-empty:
```typescript
// Use raw query for full-text search with ranking
const results = await prisma.$queryRaw`
  SELECT id, ts_rank("searchVector", to_tsquery('simple', ${tsQuery})) as rank
  FROM "Listing"
  WHERE "searchVector" @@ to_tsquery('simple', ${tsQuery})
    AND status = 'ACTIVE'
  ORDER BY rank DESC
  LIMIT ${input.limit} OFFSET ${input.offset}
`;
// Then fetch full records by IDs in rank order
```

When no query, use the existing Prisma filter approach (no text search needed).

**4.5 — Create `src/components/search/SearchBar.tsx`:**
- Debounced input (300ms) that calls `listing.listListings` with query param
- Shows result count as user types: "Pronađeno 247 oglasa za 'macbook'"
- Recent searches stored in localStorage (last 5)
- Clear button (X) inside input
- On mobile: tapping opens a full-screen search overlay

**4.6 — Create `src/app/search/page.tsx`:**
Search results page that:
- Takes `?q=term&category=&city=&priceMin=&priceMax=` query params
- Renders ListingGrid with search results
- Shows active filter chips that can be individually removed
- "Sačuvaj pretragu" button that calls `searchProfile.create` tRPC mutation (saves to SearchProfile model)
- Toggle between grid view and list view

---

### CHANGE 5 — Move Category Attributes to Database (Priority: HIGH)

**Why:** `src/lib/category-attributes.ts` is 492 lines of hardcoded attribute schemas. Every time a category needs a new field, a developer edits this file and redeploys. This should be data, not code.

**What to build:**

**5.1 — Update `schema.prisma`:**
Add two new models:
```prisma
model CategoryAttribute {
  id           String   @id @default(cuid())
  categoryId   String
  key          String   // e.g. "brand", "mileage", "sqm"
  label        String   // Serbian display label e.g. "Marka"
  type         AttributeType
  required     Boolean  @default(false)
  options      Json?    // For SELECT type: ["BMW", "Audi", "Mercedes"]
  order        Int      @default(0)
  category     Category @relation(fields: [categoryId], references: [id])

  @@index([categoryId])
}

enum AttributeType {
  TEXT
  NUMBER
  SELECT
  MULTISELECT
  BOOLEAN
}
```

Run: `npx prisma migrate dev --name add_category_attributes`

**5.2 — Create `prisma/seeds/category-attributes.ts`:**
Migrate all the data from the existing `category-attributes.ts` file into seed data. Each attribute definition in the hardcoded file becomes a `CategoryAttribute` record. Run this once: `npx ts-node prisma/seeds/category-attributes.ts`

**5.3 — Add `category.getAttributes` tRPC procedure in `src/server/api/routers/category.ts`:**
```typescript
getAttributes: publicProcedure
  .input(z.object({ categoryId: z.string() }))
  .query(async ({ ctx, input }) => {
    return ctx.db.categoryAttribute.findMany({
      where: { categoryId: input.categoryId },
      orderBy: { order: 'asc' }
    });
  })
```

**5.4 — Update `src/components/listings/DynamicAttributeFields.tsx`:**
Instead of importing from `category-attributes.ts`, this component now calls `api.category.getAttributes.useQuery({ categoryId })` and renders fields dynamically based on the returned `AttributeType`. Delete `src/lib/category-attributes.ts` once confirmed working.

---

### CHANGE 6 — Stabilize Tech Stack Versions (Priority: HIGH)

**Why:** Next.js 15 + React 19 are bleeding edge. Specific combinations cause issues with server components, streaming, and hydration that have sparse documentation.

**What to do:**

**6.1 — In `package.json`, pin these versions:**
```json
{
  "dependencies": {
    "next": "14.2.18",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@trpc/client": "10.45.2",
    "@trpc/react-query": "10.45.2",
    "@trpc/server": "10.45.2",
    "@tanstack/react-query": "5.56.2"
  }
}
```

**Why these specific versions:** Next.js 14.2.x is the latest stable with App Router fully mature. React 18.3 is stable and well-supported by all libraries. tRPC 10.x is the stable version with the best Next.js 14 integration. tRPC 11 requires React 19 features that are not stable yet.

**6.2 — Run:**
```bash
npm install
npx prisma generate
```

**6.3 — Test these specific scenarios after downgrade:**
- Server component fetching data via tRPC
- Client component using `useQuery`
- NextAuth session in server component via `getServerSession`
- Framer Motion in a client component (SwipeDeck)

---

### CHANGE 7 — Retire Standalone Version (Priority: MEDIUM)

**Why:** Two separate implementations of the same app will always drift. The standalone version in `/standalone/` serves no production purpose.

**What to do:**

**7.1 — Keep the standalone for one purpose only:** use `standalone/js/data.js` (25 demo listings) to enrich the in-memory demo store at `server/demo/store.ts`. Copy the listing data across so the main app has better demo data.

**7.2 — Delete the standalone folder:**
```bash
rm -rf standalone/
```

**7.3 — Update `README.md`:** Remove all references to the standalone version. Update local dev instructions to only reference the Next.js app.

**7.4 — Update `package.json`:** Remove any npm scripts that reference the standalone server.

---

### CHANGE 8 — Activate SearchProfile Notifications (Priority: MEDIUM)

**Why:** The `SearchProfile` model has a `notifyOnNew` boolean but push notifications are not built. This creates a zombie feature — it's in the schema and likely in the UI but silently does nothing. Either build it or disable it.

**What to build:**

**8.1 — Install dependencies:**
```bash
npm install web-push
npm install -D @types/web-push
```

**8.2 — Add to `.env.local`:**
```
VAPID_PUBLIC_KEY=generate_with_web-push
VAPID_PRIVATE_KEY=generate_with_web-push
VAPID_EMAIL=mailto:admin@swipemarket.rs
```
Generate keys: `npx web-push generate-vapid-keys`

**8.3 — Update `schema.prisma` — User model:**
```prisma
pushSubscription Json?   // Stores browser push subscription object
```
Run: `npx prisma migrate dev --name add_push_subscription`

**8.4 — Create `src/app/api/push/subscribe/route.ts`:**
POST endpoint that receives the browser's `PushSubscription` object and saves it to `User.pushSubscription`.

**8.5 — Create `src/server/notifications.ts`:**
```typescript
export async function notifySearchProfileMatches(listingId: string) {
  // Called after a new Listing is created (status = ACTIVE)
  // 1. Get listing details
  // 2. Find all SearchProfiles where notifyOnNew=true and filters match listing
  // 3. For each matching profile's user, load their pushSubscription
  // 4. Send web push notification with webpush.sendNotification()
}
```

**8.6 — Update `src/server/api/routers/listing.ts`:**
After a listing is created with status ACTIVE, call `notifySearchProfileMatches(listing.id)` asynchronously (do not await — fire and forget so it doesn't block the response).

**8.7 — Create `src/app/sw.ts` (Service Worker):**
Minimal service worker that handles `push` events and displays notifications via `self.registration.showNotification()`. Register this in `app/layout.tsx`.

---

### CHANGE 9 — Serbian Phone Number Formatting Utils (Priority: MEDIUM)

**Why:** Phone numbers in Serbia follow specific patterns (+381 64/65/66 for mobile, various landline prefixes). User-facing display should format these correctly and the input should guide users.

**What to build:**

**9.1 — Update `src/lib/utils.ts`, add:**
```typescript
// Formats +381641234567 to 064 123 4567 for display
export function formatSerbianPhone(e164: string): string

// Converts 064 123 4567 or 0641234567 to +381641234567 for storage
export function toE164Serbian(local: string): string

// Validates Serbian mobile numbers (06x prefix)
export function isValidSerbianMobile(phone: string): boolean
```

**9.2 — Update the phone input in the login page** to use `toE164Serbian()` before sending to `sendOtp`. Display formatted version to user.

**9.3 — Update `contracts/validators.ts`:**
Add a Serbian-specific phone validator:
```typescript
export const serbianPhoneSchema = z.string()
  .transform(toE164Serbian)
  .refine(isValidSerbianMobile, 'Unesite validan srpski mobilni broj');
```

---

### CHANGE 10 — Add RSD/EUR Dual Currency Display Helper (Priority: LOW)

**Why:** The schema stores price + currency. All display throughout the app should consistently show both RSD and EUR side by side. Currently this logic is likely duplicated in multiple components.

**What to build:**

**10.1 — Update `src/lib/utils.ts`, add:**
```typescript
// Fetch rate daily and cache in memory or KV store
export async function getEurToRsdRate(): Promise<number>

// Format price for display
export function formatPrice(amount: number, currency: 'RSD' | 'EUR'): {
  primary: string;   // "185.000 RSD"
  secondary: string; // "≈ 1.575 €"
}
```

**10.2 — Create `src/app/api/exchange-rate/route.ts`:**
Fetches EUR/RSD rate from a free API (e.g. frankfurter.app), caches the result for 24 hours using Next.js `revalidate`, returns `{ rate: number, updatedAt: string }`.

**10.3 — Update `contracts/api.ts`:**
All `ListingCard` and `ListingDetail` interfaces should include a `formattedPrice` object with `primary` and `secondary` strings, populated server-side so the client never needs to do currency math.

---

## PART 7 — ENVIRONMENT SETUP FOR A NEW DEVELOPER

Steps to get running from scratch:

```bash
# 1. Clone/copy project
cd "c:\Users\sam\Desktop\old swipe ads"

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your values

# 4. Set up database
# Install PostgreSQL 15+ locally or use a cloud instance
# Create database: createdb swipemarket

# 5. Run migrations
npx prisma migrate dev

# 6. Generate Prisma client
npx prisma generate

# 7. Seed initial data
npx ts-node prisma/seeds/categories.ts
npx ts-node prisma/seeds/category-attributes.ts

# 8. Run development server
npm run dev
# App available at http://localhost:3000

# 9. (Optional) Prisma Studio for DB inspection
npx prisma studio
# Available at http://localhost:5555
```

**Required external services for full functionality:**
- Cloudflare R2 bucket (image storage)
- Twilio Verify service (OTP auth)
- Pusher Channels app (real-time messaging)
- PostgreSQL 15+ database

**For demo/dev without external services:**
The in-memory store at `server/demo/store.ts` works without a database. Set `USE_DEMO_STORE=true` in `.env.local`.

---

## PART 8 — PROMPTING GUIDE FOR GEMINI

When using Gemini to implement any of these changes, use this context header at the top of every session:

```
PROJECT: SwipeMarket — Serbian classifieds marketplace app (Tinder swipe meets Halo Oglasi)
STACK: Next.js 14.2, React 18.3, TypeScript, Prisma 5, PostgreSQL, tRPC 10, NextAuth 4, Tailwind 4
ROOT: c:\Users\sam\Desktop\old swipe ads\
ARCHITECTURE: App Router, server components for data fetching, client components for interactivity
STYLE: Mobile-first, Serbian language UI strings, prices in RSD + EUR dual display
CURRENT SESSION GOAL: [describe the specific change number and task]
COMPLETED SO FAR: [list which changes from the handoff doc are done]
DO NOT MODIFY: schema.prisma without explicit migration instructions
```

Then paste the relevant section from this document (e.g. "CHANGE 3 — Real-Time Messaging") and say:

*"Implement exactly what is described in this section. Create all files listed. Do not skip steps. After each file, confirm what was created and what still needs to be done in this change."*

---

## PART 9 — IMPLEMENTATION ORDER SUMMARY

| Order | Change | Estimated Effort | Blocking |
|-------|--------|-----------------|---------|
| 1 | Stack version stabilization (#6) | 2 hours | Everything else |
| 2 | Phone OTP auth (#1) | 1 day | User trust |
| 3 | Image upload pipeline (#2) | 1.5 days | Listing creation |
| 4 | Real-time messaging (#3) | 2 days | Core UX |
| 5 | Full-text search (#4) | 1 day | Scale |
| 6 | Category attributes to DB (#5) | 0.5 day | Content flexibility |
| 7 | Retire standalone (#7) | 1 hour | Maintenance hygiene |
| 8 | SearchProfile notifications (#8) | 1 day | Retention feature |
| 9 | Phone formatting utils (#9) | 2 hours | Polish |
| 10 | Currency display helper (#10) | 2 hours | Polish |

**Total estimated effort for a competent developer:** 8–10 working days

---

## PART 10 — WHAT IS EXPLICITLY OUT OF SCOPE (DO NOT BUILD YET)

These are valid future features but should not be started until all changes above are complete:

- Admin moderation dashboard
- Payment integration for promoted listings  
- TikTok-style video posts (schema supports it, defer implementation)
- Mobile native apps (iOS/Android via React Native or Expo)
- SMS verification for listing inquiries
- AI-powered listing description generation
- Recommendation algorithm using SwipeEvent.timeSpentMs data
- Map view for listings (schema has city field, full geo coordinates not yet stored)

---

*End of handoff document. Last updated: February 2026.*
