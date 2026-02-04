# SWIPEMARKET - HANDOVER DOCUMENT
## For Continuation After Token Reset

**Last Updated**: Session End  
**Project Status**: Planning Complete, Ready for Execution  
**Location**: /home/claude/swipemarket-v2/

---

## QUICK RESUME

When you return, say:

> "Continue SwipeMarket build. I'm ready to execute Phase [X]. Here's the context: [paste relevant previous outputs]"

---

## PROJECT SUMMARY

**SwipeMarket** = Serbian classifieds app combining:
- KupujemProdajem/HaloOglasi category structure
- Tinder-style 2-direction swipe (Left=Nope, Right=Like) + buttons for Contact/Maybe
- TikTok-style 60-second videos (compressed to 720p)
- Bilingual (Serbian primary, English secondary)
- Dual currency (RSD + EUR)

**Tech Stack**:
- Frontend: Expo + React Native + NativeWind + TypeScript
- Backend: Supabase (PostgreSQL + Auth + Storage + Realtime)
- State: React Query + Zustand
- Validation: Zod

---

## FILES CREATED

### Core Execution Files (Updated with Critiques)

| File | Purpose | Status |
|------|---------|--------|
| `APP-CONTRACT.md` | **Paste into every prompt** - ensures consistency | Ready |
| `EXECUTE-02-PHASE1-CLAUDE.md` | Database schema with Serbian normalization | Ready |
| `EXECUTE-03-PHASE2-CLAUDE.md` | Types + Zod schemas | Ready |
| `EXECUTE-05-PHASE4-GEMINI.md` | UI with 2-dir swipe + haptics | Ready |
| `EXECUTE-06-PHASE5-GPT.md` | Utils with video compression + optimistic updates | Ready |
| `EXECUTE-07-PHASE6A-INTEGRATION.md` | Project skeleton | Ready |
| `EXECUTE-08-PHASE6B-INTEGRATION.md` | Core screens | Ready |

### Original Files (Still Valid for Unchanged Phases)

| File | Purpose |
|------|---------|
| `EXECUTE-01-PHASE0-CLAUDE.md` | Research prompts (with MVP limits) |
| `EXECUTE-04-PHASE3-CLAUDE.md` | Screen specs (with MVP swipe) |
| `QUICK-REFERENCE.md` | One-page checklist |
| `ARCHITECTURE-DECISIONS.md` | Tech rationale for validation |

---

## EXECUTION ORDER (Updated)

```
PHASE 0: Research (Claude) - WITH MVP LIMITS
├── Prompt 0A → categories.json (5 categories for MVP)
└── Prompt 0B → attributes.json

PHASE 1: Schema (Claude) - UPDATED
└── Prompt 1A → schema.sql + seed.sql
    NEW: Serbian text normalization trigger
    NEW: PostGIS geometry column emphasis
    NEW: Cursor-based pagination support

PHASE 2: Types (Claude) - UPDATED
├── Prompt 2A → types.ts + schemas.ts (NEW: Zod schemas)
└── Prompt 2B → rls-policies.sql

PHASE 3: Screens (Claude) - WITH MVP SWIPE
└── Prompt 3A → screens.md (~25 screens)

PHASE 4: UI (Gemini) - UPDATED
├── 4A → components/ui/ (add skeletons)
├── 4B → components/swipe/ (2-dir + haptics + buttons)  ← KEY CHANGE
├── 4C → components/forms/ (Zod integration)
├── 4D → components/filters/
└── 4E → components/categories/ + search/

PHASE 5: Utils (ChatGPT) - UPDATED
├── 5A → utils/format/ (unchanged)
├── 5B → utils/media/ (720p video compression)  ← KEY CHANGE
├── 5C → utils/geo/ (unchanged)
├── 5D → hooks/ (optimistic updates)  ← KEY CHANGE
└── 5E → i18n/ (unchanged)

PHASE 6: Integration (Claude) - SPLIT
├── 6A → Project skeleton, providers, config
└── 6B → Core screen implementations
```

---

## KEY CHANGES FROM CRITIQUES

### 1. MVP Swipe: 2-Direction + Buttons
```
OLD: 5-direction swipe (high crash risk)
NEW: 2-direction (Left/Right) + buttons for Contact/Maybe

         ┌─────────────────────────┐
         │                         │
← LEFT   │      SWIPE CARD         │   RIGHT →
 NOPE    │                         │    LIKE
         │  [? Maybe]  [Contact]   │  ← BUTTONS
         └─────────────────────────┘
```

### 2. Video Compression (Budget Critical)
```typescript
// ALL videos MUST be compressed before upload
// 720p / 30fps / 2Mbps = ~15MB per minute
// Without this: 4K uploads = $500+/month bandwidth

const compressed = await VideoCompressor.compress(uri, {
  maxSize: 720,
  bitrate: 2000000,
});
```

### 3. Optimistic Updates (UX Critical)
```typescript
// Swipes feel INSTANT - don't wait for server
onMutate: async (params) => {
  // Immediately remove card from feed
  queryClient.setQueryData(['swipeFeed'], (old) => 
    old.filter(l => l.id !== params.listingId)
  );
},
onError: (err, params, context) => {
  // Rollback + toast on failure
  queryClient.setQueryData(['swipeFeed'], context.previousFeed);
  Toast.show({ type: 'error', text1: 'Greška' });
}
```

### 4. Serbian Search Normalization
```sql
-- "cacak" must find "Čačak"
-- "beograd" must find "Београд"
CREATE FUNCTION normalize_serbian(input TEXT) RETURNS TEXT AS $$
  SELECT lower(unaccent(translate(input, 'čćžšđ...', 'cczsd...')));
$$ LANGUAGE SQL IMMUTABLE;
```

### 5. Zod Validation Per Category
```typescript
// In schemas.ts - validates BEFORE database write
export const carAttributesSchema = z.object({
  make: z.string().min(1),
  year: z.number().int().min(1980).max(2026),
  mileage: z.number().int().min(0),
  // ... all required fields
});
```

### 6. Haptic Feedback
```typescript
// On every swipe completion
Haptics.impactAsync(
  action === 'like' 
    ? Haptics.ImpactFeedbackStyle.Medium  // Satisfying
    : Haptics.ImpactFeedbackStyle.Light   // Subtle
);
```

### 7. Cursor-Based Pagination
```typescript
// NO MORE OFFSET (gets slow at scale)
// Use cursor (last item's created_at + id)
WHERE (created_at, id) < ($cursor_created_at, $cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 20
```

---

## MVP SCOPE (V1)

### In Scope
- [x] Swipe: 2-direction + Contact/Maybe buttons
- [x] Categories: 5 (Cars, Apartments, Phones, Fashion, Other)
- [x] Media: Images (10 max) + Video (60s compressed)
- [x] Search: Text + category filters + location
- [x] Messages: Real-time chat
- [x] Auth: Email + Google
- [x] ~25 screens

### Out of Scope (V2)
- [ ] Full 5-direction swipe gestures
- [ ] 15+ categories
- [ ] AI recommendations
- [ ] Push notifications
- [ ] Seller verification
- [ ] Payments

---

## BUDGET CONSIDERATIONS

### Video Compression Saves Money
| Scenario | Size per 60s | 1000 videos/month | Cost |
|----------|--------------|-------------------|------|
| 4K uncompressed | 200MB | 200GB | $18/mo |
| 720p compressed | 15MB | 15GB | $1.35/mo |

### Supabase Costs
- Free tier: 50K MAU, 500MB DB, 1GB storage
- Pro tier: $25/month (when needed)

---

## HOW TO CONTINUE

### Step 1: Download Files
All files are in the project root folder.

### Step 2: Execute Phase 0 (If not done)
```
1. Open Claude
2. Paste APP-CONTRACT.md
3. Run prompts from EXECUTE-01-PHASE0-CLAUDE.md
4. Save: categories.json, attributes.json
5. Validate with Validation_Checklist.md
```

### Step 3: Execute Phase 1 (Updated)
```
1. Open Claude
2. Paste APP-CONTRACT.md
3. Paste categories.json + attributes.json
4. Run prompt from EXECUTE-02-PHASE1-CLAUDE.md
5. Save: schema.sql, seed.sql
```

### Step 4: Continue Through Phases
Follow the EXECUTE-* files in order, always pasting:
- APP-CONTRACT.md (every prompt)
- Previous phase outputs as context

### Step 5: After All Phases
```bash
npm install
supabase start
supabase db reset
npx expo start
```

---

## CONTEXT FOR NEW SESSION

When starting a new session, provide this context:

```
I'm building SwipeMarket, a Serbian classifieds app. 

Key decisions:
- 2-direction swipe (Left/Right) + buttons for MVP (not 5-direction)
- 720p video compression mandatory
- Optimistic updates for all swipes
- Cursor-based pagination everywhere
- Zod validation per category
- Serbian text normalization in PostgreSQL

I've completed Phase [X] and have these outputs: [list files]
Ready to execute Phase [Y].
```

---

## PROGRESS TRACKER

| Phase | Status | Output Files |
|-------|--------|--------------|
| 0 Research | Not Started | categories.json, attributes.json |
| 1 Schema | Not Started | schema.sql, seed.sql |
| 2 Types | Not Started | types.ts, schemas.ts, rls-policies.sql |
| 3 Screens | Not Started | screens.md |
| 4A UI Design | Not Started | components/ui/ |
| 4B UI Swipe | Not Started | components/swipe/ |
| 4C UI Forms | Not Started | components/forms/ |
| 4D UI Filters | Not Started | components/filters/ |
| 4E UI Categories | Not Started | components/categories/, search/ |
| 5A Utils Format | Not Started | utils/format/ |
| 5B Utils Media | Not Started | utils/media/ |
| 5C Utils Geo | Not Started | utils/geo/ |
| 5D Hooks | Not Started | hooks/ |
| 5E i18n | Not Started | i18n/ |
| 6A Integration | Not Started | app/, config files |
| 6B Screens | Not Started | app/(tabs)/, etc. |

Update this as you complete each phase!

---

## GOOD LUCK!

The planning is complete. The prompts are ready. 
Just execute them in order and you'll have a working app.

Total estimated time: 12-18 hours across all phases.

Questions when you return? Just ask:
> "I'm at Phase X, here's what I have, what's next?"
