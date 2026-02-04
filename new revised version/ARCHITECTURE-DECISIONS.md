# SWIPEMARKET - ARCHITECTURE DECISIONS & WORKFLOW

## Purpose of This Document
Use this to validate our architecture choices with another LLM. Ask: "Given these requirements, is this the right architecture? What would you change?"

---

# PART 1: REQUIREMENTS SUMMARY

## What We're Building
A Serbian classifieds marketplace app (like KupujemProdajem/HaloOglasi) with:
- Tinder-style swipe discovery (**MVP: 2-direction + buttons**, V2: full 5-direction)
- Dynamic category-specific attributes (cars have make/model, apartments have rooms/m²)
- TikTok-style short video posts (60 seconds max, **compressed to 720p/30fps**)
- Bilingual UI (Serbian primary, English secondary)
- Dual currency display (RSD and EUR)
- Real-time messaging between buyers and sellers
- Location-based search (PostGIS)
- **Serbian text normalization** (č→c, ć→c for search)

## Scale Targets
- 10K - 1M listings
- 10K daily active users
- Solo developer building and maintaining

## Constraints
- Must be buildable by one person
- Must be cheap to run initially ($0-50/month)
- Must scale without rewrite
- Must work offline-first for browsing
- Must deploy to iOS and Android

---

# PART 2: ARCHITECTURE DECISIONS

## Decision 1: React Native + Expo (not Flutter, not Native)

### Chosen: Expo SDK 50+ with React Native

### Why:
| Factor | Expo/RN | Flutter | Native (Swift/Kotlin) |
|--------|---------|---------|----------------------|
| Single codebase | ✅ Yes | ✅ Yes | ❌ No (2 codebases) |
| Developer pool | Large | Medium | Split |
| Hot reload | ✅ Fast | ✅ Fast | Slower |
| OTA updates | ✅ EAS Update | ❌ No | ❌ No |
| Native modules | ✅ Easy with Expo | Requires plugins | Native |
| App size | ~25MB | ~15MB | ~10MB |
| Performance | Good (95% native) | Excellent | Best |
| Time to build | Fastest | Fast | Slowest |

### Trade-offs Accepted:
- Slightly larger app size than Flutter/Native
- 5% performance gap vs pure native (acceptable for this app)
- Dependency on Expo ecosystem

### Why NOT Flutter:
- Smaller talent pool for future hiring
- Dart is less common than TypeScript
- React Native ecosystem is more mature for this use case

### Why NOT Native:
- 2x development time (two codebases)
- 2x maintenance burden
- Solo developer constraint makes this impractical

---

## Decision 2: Supabase (not Firebase, not Custom Backend)

### Chosen: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)

### Why:
| Factor | Supabase | Firebase | Custom (Node.js) |
|--------|----------|----------|------------------|
| Database | PostgreSQL (relational) | Firestore (NoSQL) | Your choice |
| Complex queries | ✅ SQL, JOINs, JSONB | ❌ Limited | ✅ Full control |
| Full-text search | ✅ Built-in | ❌ Requires Algolia | ✅ Must build |
| Geo queries | ✅ PostGIS | ❌ Limited | ✅ Must configure |
| Auth | ✅ Built-in | ✅ Built-in | Must build |
| File storage | ✅ Built-in + transforms | ✅ Built-in | Must configure |
| Realtime | ✅ Built-in | ✅ Built-in | Must build (Socket.io) |
| Edge functions | ✅ Deno/TypeScript | ✅ Cloud Functions | Must deploy |
| Vendor lock-in | Low (it's PostgreSQL) | High | None |
| Self-host option | ✅ Yes | ❌ No | ✅ Yes |
| Free tier | 50K MAU, 500MB DB | Generous | N/A |
| Cost at scale | ~$25-50/mo | ~$50-100/mo | ~$50-100/mo |

### Critical Reasons for Supabase over Firebase:

1. **Dynamic Attributes Need JSONB**
   - We store category-specific attributes as JSONB: `{"make": "bmw", "year": 2019}`
   - PostgreSQL JSONB has GIN indexes for fast querying
   - Firestore would require denormalization nightmares

2. **Complex Filter Queries**
   ```sql
   -- This query is trivial in PostgreSQL:
   SELECT * FROM listings 
   WHERE category_id = 'cars'
     AND (attributes->>'year')::int BETWEEN 2018 AND 2024
     AND (attributes->>'mileage')::int < 100000
     AND attributes->>'fuel' = 'diesel'
   ORDER BY created_at DESC;
   
   -- In Firestore: Requires composite indexes for every filter combination
   -- Or denormalizing data into separate collections
   ```

3. **Full-Text Search Built-in**
   - PostgreSQL `tsvector` for Serbian text search
   - No need for separate Algolia/Meilisearch initially

4. **PostGIS for Location**
   - "Find listings within 50km of Belgrade" is one query
   - Firebase requires geohashing workarounds

5. **Row Level Security**
   - Security rules live in database, not app code
   - "Users can only see their own swipe actions" = 1 policy

### Trade-offs Accepted:
- Less mature mobile SDKs than Firebase
- Smaller community (but growing fast)
- Must manage connection pooling at scale

### Why NOT Firebase:
- Firestore's NoSQL model is wrong for relational classifieds data
- Complex queries require multiple roundtrips or denormalization
- Vendor lock-in (can't export to standard PostgreSQL)

### Why NOT Custom Node.js Backend:
- Massive time investment to build auth, realtime, file handling
- Must manage infrastructure (servers, databases, scaling)
- Solo developer would spend 60% of time on backend plumbing

---

## Decision 3: JSONB for Dynamic Attributes (not EAV, not Separate Tables)

### Chosen: Single `attributes JSONB` column on listings table

### Alternative Approaches Considered:

**Option A: Entity-Attribute-Value (EAV)**
```sql
-- Separate table for each attribute value
CREATE TABLE listing_attributes (
  listing_id UUID,
  attribute_key TEXT,
  attribute_value TEXT
);
-- Problem: JOINs for every filter, terrible performance
```

**Option B: Separate Tables per Category**
```sql
-- car_listings, apartment_listings, phone_listings...
-- Problem: Can't query across categories, schema changes require migrations
```

**Option C: JSONB (Chosen)**
```sql
CREATE TABLE listings (
  ...
  attributes JSONB DEFAULT '{}'
);
CREATE INDEX idx_listings_attributes ON listings USING GIN (attributes);
```

### Why JSONB Wins:

| Factor | EAV | Separate Tables | JSONB |
|--------|-----|-----------------|-------|
| Query speed | ❌ Slow (JOINs) | ✅ Fast | ✅ Fast (GIN index) |
| Schema flexibility | ✅ High | ❌ Low | ✅ High |
| Cross-category queries | ✅ Yes | ❌ No | ✅ Yes |
| Add new attribute | ✅ No migration | ❌ Migration | ✅ No migration |
| Type safety | ❌ All strings | ✅ Typed | ⚠️ Runtime validation |
| Complexity | High | High | Low |

### How We Validate JSONB Data:
- `category_attributes` table defines valid keys and types per category
- Zod schema generated at runtime for form validation
- Database trigger could validate on insert (optional)

---

## Decision 4: NativeWind/Tailwind (not StyleSheet, not Styled Components)

### Chosen: NativeWind (Tailwind CSS for React Native)

### Why:
| Factor | NativeWind | StyleSheet | Styled Components |
|--------|------------|------------|-------------------|
| Verbosity | Low | High | Medium |
| Dark mode | ✅ `dark:` prefix | Manual | Manual |
| Responsive | ✅ `md:`, `lg:` | Manual | Manual |
| Bundle size | Same | Same | Larger |
| Learning curve | Know Tailwind? Easy | RN native | New syntax |
| Design system | ✅ Built-in | Build yourself | Build yourself |

### Example Comparison:
```tsx
// NativeWind
<View className="flex-1 bg-white dark:bg-gray-900 p-4">
  <Text className="text-lg font-bold text-gray-900 dark:text-white">
    Hello
  </Text>
</View>

// StyleSheet (equivalent)
<View style={[styles.container, isDark && styles.containerDark]}>
  <Text style={[styles.text, isDark && styles.textDark]}>
    Hello
  </Text>
</View>
// Plus 20 lines of StyleSheet.create()
```

### Trade-offs Accepted:
- Additional build configuration
- Class string can get long (but extractable)
- Some RN-specific styling still needs StyleSheet

---

## Decision 5: Expo Router (not React Navigation standalone)

### Chosen: Expo Router (file-based routing)

### Why:
- File-based routing = less boilerplate
- Deep linking automatic
- Type-safe routes
- Matches Next.js mental model (good for web developers)
- Official Expo solution (best support)

```
app/
├── (tabs)/
│   ├── index.tsx      → /
│   ├── search.tsx     → /search
│   └── profile.tsx    → /profile
├── listing/
│   └── [id].tsx       → /listing/123
└── _layout.tsx
```

---

## Decision 6: React Query (not Redux, not Zustand alone)

### Chosen: TanStack React Query + Zustand

### Responsibilities:
- **React Query**: Server state (listings, categories, messages)
- **Zustand**: Client state (filters, drafts, UI state)

### Why React Query for Server State:
| Feature | React Query | Redux | Plain fetch |
|---------|-------------|-------|-------------|
| Caching | ✅ Automatic | Manual | None |
| Background refetch | ✅ Built-in | Manual | None |
| Pagination | ✅ `useInfiniteQuery` | Manual | Manual |
| Optimistic updates | ✅ Built-in | Manual | Manual |
| DevTools | ✅ Yes | Yes | No |
| Boilerplate | Low | High | Medium |

### Why Zustand for Client State:
- Simpler than Redux (no actions, reducers, middleware)
- 1KB bundle size
- Works great alongside React Query

---

## Decision 7: Supabase Storage (not Cloudflare R2, not S3)

### Chosen: Supabase Storage (built on S3-compatible storage)

### Why:
- Already using Supabase, no additional service
- Image transforms built-in (resize, crop, format)
- RLS for access control (same policies as database)
- CDN included

### For Video:
- Store original in Supabase Storage
- Generate thumbnail on upload (Edge Function)
- Future: Could add Cloudflare Stream for HLS

### Cost Consideration:
- Supabase: $0.021/GB storage, $0.09/GB bandwidth
- If bandwidth becomes expensive, can add Cloudflare R2 ($0.015/GB, free egress)

---

## Decision 8: PostgreSQL Full-Text Search (not Algolia, not Meilisearch initially)

### Chosen: PostgreSQL FTS with `tsvector`

### Why Start Here:
- Zero additional cost
- Zero additional service to manage
- Good enough for 1M listings
- Supports Serbian text

```sql
-- Search configuration
CREATE INDEX idx_listings_search ON listings USING GIN (search_vector);

-- Query
SELECT * FROM listings 
WHERE search_vector @@ plainto_tsquery('simple', 'bmw beograd');
```

### When to Add Meilisearch:
- When search becomes a bottleneck (>100ms queries)
- When we need typo tolerance
- When we need faceted search UI
- Estimated: After 500K listings or 5K DAU

---

# PART 3: ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER'S DEVICE                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    EXPO / REACT NATIVE APP                       │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │   │
│  │  │   Screens    │ │  Components  │ │      State Management    │ │   │
│  │  │ (Expo Router)│ │ (NativeWind) │ │ React Query + Zustand    │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │   │
│  │  │    Hooks     │ │    Utils     │ │         i18n             │ │   │
│  │  │ (Supabase)   │ │ (Format/Geo) │ │    (SR/EN translations)  │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐   │
│  │   Auth          │ │   Realtime      │ │     Edge Functions      │   │
│  │ (Email, Google) │ │ (WebSocket)     │ │ (Recommendations, etc.) │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐   │
│  │   PostgreSQL    │ │    Storage      │ │      PostgREST          │   │
│  │ + PostGIS       │ │ (Images/Videos) │ │   (Auto-generated API)  │   │
│  │ + JSONB         │ │ + Transforms    │ │                         │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# PART 4: DATA FLOW EXAMPLES

## Flow 1: User Swipes Right (Like)

```
1. User swipes right on listing card
2. SwipeCardStack calls onSwipe(listing, 'like')
3. useRecordSwipe hook fires mutation
4. Supabase insert: swipe_actions (user_id, listing_id, 'like')
5. React Query cache updates (optimistic)
6. Next card animates in
7. Listing won't appear in future feed queries (excluded by JOIN)
```

## Flow 2: User Posts a Car Listing

```
1. User selects category: Vozila > Automobili > Prodaja
2. useCategoryAttributes fetches attributes for 'cars'
3. DynamicForm renders: Make (select), Model (dependent), Year (range)...
4. User selects BMW → Model dropdown loads BMW models
5. User fills all required fields
6. User adds photos → compressImage → uploadToSupabase
7. User adds video → validateVideo (60s max) → upload
8. Preview screen shows listing
9. useCreateListing mutation:
   - Insert listing with attributes JSONB
   - Link media records
   - Set status = 'active'
10. Navigate to success screen
```

## Flow 3: User Searches with Filters

```
1. User on search screen, selects category: Automobili
2. useCategoryAttributes fetches filterable attributes
3. FilterBottomSheet renders: Make, Year range, Mileage range, Fuel...
4. User sets: BMW, 2018-2024, <100,000km, Diesel
5. useSearchListings query:
   SELECT * FROM listings 
   WHERE category_id = 'cars'
     AND (attributes->>'make') = 'bmw'
     AND (attributes->>'year')::int >= 2018
     AND (attributes->>'mileage')::int < 100000
     AND (attributes->>'fuel') = 'diesel'
   ORDER BY created_at DESC
   LIMIT 20
6. Results render in ListingGrid
7. User scrolls → fetchNextPage → OFFSET pagination
```

---

# PART 5: FILE STRUCTURE & RESPONSIBILITIES

```
swipemarket/
├── app/                      # SCREENS (Expo Router)
│   ├── (auth)/               # Auth flow (login, register)
│   ├── (tabs)/               # Main tabs (home, search, post, messages, profile)
│   ├── listing/[id].tsx      # Listing detail
│   ├── post/                 # Multi-step post flow
│   └── _layout.tsx           # Root layout (providers)
│
├── src/
│   ├── components/           # UI COMPONENTS
│   │   ├── ui/               # Design system (Button, Input, Select...)
│   │   ├── swipe/            # Swipe card system
│   │   ├── forms/            # Dynamic form system
│   │   ├── filters/          # Dynamic filter system
│   │   ├── categories/       # Category browser
│   │   └── search/           # Search results UI
│   │
│   ├── hooks/                # REACT QUERY HOOKS
│   │   ├── useAuth.ts        # Auth operations
│   │   ├── useListings.ts    # CRUD + search
│   │   ├── useSwipeActions.ts # Swipe recording
│   │   └── useMessages.ts    # Conversations
│   │
│   ├── utils/                # UTILITY FUNCTIONS
│   │   ├── format/           # Price, date, number formatters
│   │   ├── serbian/          # Serbian text utilities
│   │   ├── media/            # Image/video handling
│   │   └── geo/              # Location utilities
│   │
│   ├── stores/               # ZUSTAND STORES
│   │   ├── filterStore.ts    # Filter state
│   │   └── draftStore.ts     # Post draft state
│   │
│   ├── i18n/                 # TRANSLATIONS
│   │   ├── translations/     # sr.ts, en.ts
│   │   └── LanguageContext.tsx
│   │
│   ├── lib/                  # CONFIGURATION
│   │   ├── supabase.ts       # Supabase client
│   │   └── queryClient.ts    # React Query config
│   │
│   └── types/                # TYPESCRIPT TYPES
│       └── index.ts          # All types from schema
│
├── supabase/                 # DATABASE
│   ├── migrations/           # Schema SQL
│   ├── seed.sql              # Test data
│   └── config.toml           # Supabase config
│
└── assets/                   # Static assets
```

---

# PART 6: COST PROJECTIONS

## MVP Phase (0-1K users)
| Service | Cost |
|---------|------|
| Supabase Free | $0 |
| Expo Free | $0 |
| Apple Developer | $99/year |
| Google Play | $25 one-time |
| **Total** | ~$10/month |

## Growth Phase (1K-10K users)
| Service | Cost |
|---------|------|
| Supabase Pro | $25/month |
| Expo EAS | $0-29/month |
| Bandwidth overage | ~$10/month |
| **Total** | ~$50-65/month |

## Scale Phase (10K-100K users)
| Service | Cost |
|---------|------|
| Supabase Pro + usage | $50-100/month |
| Cloudflare R2 (if needed) | $10-20/month |
| Meilisearch Cloud (if needed) | $30/month |
| **Total** | ~$100-150/month |

---

# PART 7: WHAT COULD GO WRONG

## Risk 1: JSONB Query Performance
**Risk**: Complex attribute filters slow down at scale
**Mitigation**: 
- GIN indexes on JSONB
- Add materialized views for common queries
- Migrate to separate indexed columns for hot attributes

## Risk 2: Supabase Realtime Limits
**Risk**: Too many concurrent WebSocket connections
**Mitigation**: 
- Supabase scales well, but monitor
- Can switch to polling for less critical features

## Risk 3: Video Storage Costs
**Risk**: Videos are large, bandwidth expensive
**Mitigation**: 
- Strict 60s limit
- **CRITICAL: Client-side compression to 720p/30fps before upload**
- Target: ~15MB per minute (vs 200MB uncompressed)
- Move to Cloudflare Stream if needed

## Risk 4: PostgreSQL Full-Text Search Limitations
**Risk**: Search quality not good enough
**Mitigation**: 
- Plan to add Meilisearch
- Architecture supports swapping search backend

## Risk 5: Gesture Conflicts (5-Direction Swipe)
**Risk**: 5-direction gestures have high crash risk, especially on Android
**Mitigation**: 
- **MVP uses 2-direction (Left/Right) + buttons for Contact/Maybe**
- Architecture supports 5-direction upgrade in V2 after stability proven
- Haptic feedback provides clear action confirmation

---

# PART 7.5: MVP SIMPLIFICATIONS

The following simplifications reduce initial complexity and risk:

| Area | Full Vision | MVP (V1) | Rationale |
|------|-------------|----------|-----------|
| Swipe | 5 directions | 2 directions + buttons | Gesture stability |
| Categories | 15+ | 5 (Cars, Apartments, Phones, Fashion, Other) | Focus on quality |
| Screens | 40+ | ~25 | Faster time to market |
| Video | 4K native | 720p/30fps compressed | Bandwidth costs |
| Search | Meilisearch | PostgreSQL FTS | Cost, complexity |

**Phase 6 Split**: To prevent placeholder code, integration is split into:
- 6A: Project skeleton (providers, config)
- 6B: Core screen implementations

**APP-CONTRACT.md**: Ensures consistency across all LLM outputs by establishing non-negotiable patterns for error handling, pagination, component structure, etc.

---

# PART 8: VALIDATION QUESTIONS FOR OTHER LLM

Ask another LLM:

1. **"Given these requirements (Serbian classifieds, swipe UI, dynamic attributes, solo developer, $0-50/month budget), is Supabase + React Native + Expo the right choice? What would you change?"**

2. **"For storing dynamic category attributes (cars have make/model, apartments have rooms/m²), is JSONB the right approach? What about EAV or separate tables?"**

3. **"What's the biggest technical risk in this architecture that I should plan for?"**

4. **"If this app grows to 1M listings and 100K users, what breaks first?"**

5. **"Is there a simpler architecture that achieves the same goals?"**

6. **"How should we handle Serbian text normalization in search? Users mix Latin (Čačak), Cyrillic (Београд), and 'bald' Latin (cacak). What's the best approach in PostgreSQL?"**

7. **"For video uploads from mobile phones (potentially 4K), what compression strategy balances quality vs bandwidth costs?"**
