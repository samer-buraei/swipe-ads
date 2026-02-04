# SWIPEMARKET - HOW TO USE THE OUTPUT FILES

## Overview of the Build System

I created a **multi-LLM orchestration system** that produces a complete app through a series of prompts. Each prompt builds on the previous outputs, creating a chain of dependencies.

### MVP Updates (v2)
- **Paste APP-CONTRACT.md first** with every prompt for consistency
- MVP scope: 5 categories, 2-direction swipe + buttons, ~25 screens
- Phase 6 split into 6A (skeleton) + 6B (screens) for better outputs
- Added: Zod validation, video compression, haptics, optimistic updates

```
RESEARCH → SCHEMA → TYPES → SCREENS → COMPONENTS → UTILITIES → INTEGRATION
   ↓          ↓        ↓        ↓          ↓           ↓           ↓
Claude    Claude   Claude   Claude     Gemini      ChatGPT    Claude (6A+6B)
```

---

## The Files and Their Purpose

### Execution Files (EXECUTE-*.md)

These are **copy-paste ready prompts** organized by phase:

| File | LLM | What It Produces | Time |
|------|-----|------------------|------|
| `EXECUTE-01-PHASE0-CLAUDE.md` | Claude | `categories.json`, `attributes.json` (5 categories MVP) | 1-2h |
| `EXECUTE-02-PHASE1-CLAUDE.md` | Claude | `schema.sql`, `seed.sql` (+ Serbian normalization) | 1-2h |
| `EXECUTE-03-PHASE2-CLAUDE.md` | Claude | `types.ts`, `schemas.ts` (Zod), `rls-policies.sql` | 1-2h |
| `EXECUTE-04-PHASE3-CLAUDE.md` | Claude | `screens.md` (~25 screen specs MVP) | 1-2h |
| `EXECUTE-05-PHASE4-GEMINI.md` | Gemini | UI components (2-dir swipe + haptics) | 3-4h |
| `EXECUTE-06-PHASE5-GPT.md` | ChatGPT | Utils + hooks (+ video compression, optimistic updates) | 2-3h |
| `EXECUTE-07-PHASE6A-INTEGRATION.md` | Claude | Project skeleton, providers, config | 1-2h |
| `EXECUTE-08-PHASE6B-INTEGRATION.md` | Claude | Core screen implementations | 1-2h |

### Reference & Support Files

| File | Purpose |
|------|---------|
| `APP-CONTRACT.md` | **Paste with every prompt!** Ensures consistency |
| `HANDOVER.md` | Resume instructions for new sessions |
| `Validation_Checklist.md` | Validate Phase 0/2 outputs |
| `QUICK-REFERENCE.md` | One-page checklist for the whole process |
| `ARCHITECTURE-DECISIONS.md` | Tech stack justification |

---

## Step-by-Step Workflow

### STEP 1: Research Phase (Claude)

**What you do:**
1. Open Claude (claude.ai)
2. **Paste APP-CONTRACT.md first** (do this with EVERY prompt!)
3. Copy prompt from `EXECUTE-01-PHASE0-CLAUDE.md` → Prompt 0A
4. Paste into Claude, execute
5. Save output as `categories.json`
6. Copy Prompt 0B, **paste categories.json as context**
7. Save output as `attributes.json`
8. **Validate outputs with Validation_Checklist.md**

**What you get (MVP scope):**
- 5 main categories: Vehicles, Real Estate, Electronics, Fashion, Other
- Complete attributes for cars, apartments; basic for others
- Bilingual labels (Serbian + English)

**Why this matters:**
- This defines your DATA MODEL
- Forms and filters are generated FROM this
- No hardcoding categories in code
- Validation catches issues before they cascade to later phases

---

### STEP 2: Database Schema (Claude)

**What you do:**
1. Open Claude
2. Copy prompt from `EXECUTE-02-PHASE1-CLAUDE.md`
3. **Include categories.json and attributes.json as context**
4. Save outputs as `schema.sql` and `seed.sql`

**What you get:**
```sql
-- Tables for:
categories              -- Category hierarchy
category_attributes     -- Attribute definitions per category
profiles                -- User profiles (extends Supabase auth)
listings                -- Main listings table with JSONB attributes
listing_media           -- Images and videos
swipe_actions           -- Like/nope/maybe/contact tracking
conversations           -- Messaging threads
messages                -- Individual messages
saved_searches          -- User's saved search filters
```

**Why this matters:**
- This is your **single source of truth**
- Types are generated FROM this
- RLS policies protect this
- Everything else is just views on this data

---

### STEP 3: Types & Security (Claude)

**What you do:**
1. Open Claude
2. Copy Prompt 2A from `EXECUTE-03-PHASE2-CLAUDE.md`
3. **Include schema.sql as context**
4. Save as `types.ts`
5. Copy Prompt 2B, save as `rls-policies.sql`

**What you get:**
- Complete TypeScript interfaces matching database
- Row Level Security policies for all tables

**Why this matters:**
- Type safety across entire app
- Database security without app-level code
- Single place to update when schema changes

---

### STEP 4: Screen Specifications (Claude)

**What you do:**
1. Open Claude
2. Copy prompt from `EXECUTE-04-PHASE3-CLAUDE.md`
3. **Include types.ts as context**
4. Save as `screens.md`

**What you get:**
- 40+ screen specifications
- Data requirements per screen
- Component lists per screen
- Navigation flows

**Why this matters:**
- This is the **blueprint for UI work**
- Gemini uses this to build components
- Ensures nothing is missed

---

### STEP 5: UI Components (Gemini) - CAN RUN PARALLEL

**What you do:**
1. Open Gemini (gemini.google.com)
2. For EACH prompt in `EXECUTE-05-PHASE4-GEMINI.md`:
   - **Always include types.ts as context**
   - Execute prompt
   - Save files to correct folder

**Prompts produce:**
| Prompt | Output Folder | Components |
|--------|---------------|------------|
| 4A | `components/ui/` | Button, Input, Select, Toggle, etc. |
| 4B | `components/swipe/` | SwipeCard, SwipeCardStack, overlays |
| 4C | `components/forms/` | DynamicForm, field components |
| 4D | `components/filters/` | FilterBottomSheet, filter fields |
| 4E | `components/categories/`, `components/search/` | CategoryGrid, ListingCard, etc. |

**Why Gemini:**
- Best at React/UI code generation
- Produces cleaner component structure
- Better at animations and styling

---

### STEP 6: Utilities (ChatGPT) - CAN RUN PARALLEL

**What you do:**
1. Open ChatGPT (chatgpt.com)
2. For EACH prompt in `EXECUTE-06-PHASE5-GPT.md`:
   - **Include types.ts as context**
   - Execute prompt
   - Save files to correct folder

**Prompts produce:**
| Prompt | Output Folder | Contents |
|--------|---------------|----------|
| 5A | `utils/format/`, `utils/serbian/` | Price, date, Serbian text formatters |
| 5B | `utils/media/` | Image compression, upload, blurhash |
| 5C | `utils/geo/` | Distance calc, Serbian cities, location |
| 5D | `hooks/` | Supabase React Query hooks |
| 5E | `i18n/` | Translation system |

**Why ChatGPT:**
- Fast at utility functions
- Good at practical implementations
- Produces well-documented code

---

### STEP 7: Integration (Claude)

**What you do:**
1. Open Claude (ideally with large context)
2. Copy prompt from `EXECUTE-07-PHASE6-INTEGRATION.md`
3. **Include ALL previous outputs as context** (or summaries)
4. Get: final glue code, app configuration, setup instructions

**What you get:**
- Root layout with all providers
- Navigation configuration
- Screen implementations using components
- `package.json` with all dependencies
- `.env.example`
- Setup instructions

**Why this matters:**
- Stitches everything together
- Resolves any conflicts between outputs
- Produces runnable app

---

## Testing & Validation Workflow

### Level 1: Component Testing (During Development)

As you save each component file:

```bash
# After saving a component
npx tsc --noEmit                    # Check TypeScript errors
npx expo start                       # Visual check in Expo Go
```

**What to verify:**
- [ ] No TypeScript errors
- [ ] Component renders without crash
- [ ] Dark mode works
- [ ] Bilingual text shows correctly

### Level 2: Integration Testing (After Phase 6)

```bash
# 1. Start local Supabase
supabase start

# 2. Run migrations
supabase db reset    # Applies schema.sql + seed.sql

# 3. Start app
npx expo start

# 4. Test on device via Expo Go
```

**What to verify:**
- [ ] Auth flow works (register, login, logout)
- [ ] Can see listings from seed data
- [ ] Swipe actions are recorded
- [ ] Can post a new listing
- [ ] Search returns results
- [ ] Filters work
- [ ] Messages send

### Level 3: QA Checklist (Before Launch)

Use this checklist for each feature:

```markdown
## AUTH
- [ ] Register with email works
- [ ] Login with email works  
- [ ] Login with Google works
- [ ] Forgot password sends email
- [ ] Session persists after app close
- [ ] Logout clears all state

## SWIPE FEED
- [ ] Cards load from database
- [ ] Swipe right → saves to favorites
- [ ] Swipe left → listing hidden forever
- [ ] Swipe down → saves to "maybe"
- [ ] Swipe up → opens contact/message
- [ ] Double tap → opens detail view
- [ ] Undo works for last swipe
- [ ] Already-swiped listings don't reappear
- [ ] Empty state shows when no cards
- [ ] Pull to refresh works

## POST LISTING
- [ ] Can navigate category tree
- [ ] Dynamic form shows correct fields
- [ ] Dependent fields work (model depends on make)
- [ ] Required field validation works
- [ ] Can upload 10 images
- [ ] Can upload 1 video (60s max)
- [ ] Video over 60s is rejected
- [ ] Can set location
- [ ] Preview shows correct data
- [ ] Publish creates listing
- [ ] New listing appears in feed

## SEARCH
- [ ] Category browsing works
- [ ] Text search returns results
- [ ] Price filter works
- [ ] Dynamic filters per category work
- [ ] Location filter works
- [ ] Sort options work
- [ ] Grid/list toggle works
- [ ] Pagination works

## MESSAGES
- [ ] Can start conversation from listing
- [ ] Messages send and appear
- [ ] Real-time updates work
- [ ] Unread count updates
- [ ] Can view listing from chat

## PROFILE
- [ ] Shows correct user info
- [ ] Can edit profile
- [ ] My listings shows correctly
- [ ] Favorites shows liked items
- [ ] Maybe shows saved items

## SETTINGS
- [ ] Language switch works (Serbian ↔ English)
- [ ] Currency switch works (RSD ↔ EUR)
- [ ] Preference persists after restart
```

### Level 4: Device Testing Matrix

Test on:
- [ ] iOS Simulator (iPhone 14)
- [ ] iOS Physical Device (if available)
- [ ] Android Emulator (Pixel 6)
- [ ] Android Physical Device (if available)

Check:
- [ ] Gestures work on both platforms
- [ ] Keyboard doesn't cover inputs
- [ ] Safe areas respected
- [ ] Performance acceptable (60fps swipe)

---

## Validation Checkpoints

### After Phase 1 (Schema)
```sql
-- Connect to local Supabase and verify:
SELECT * FROM categories LIMIT 5;
SELECT * FROM category_attributes WHERE category_id = 'cars' LIMIT 5;
SELECT * FROM listings LIMIT 5;
```

### After Phase 2 (Types)
```bash
# types.ts should compile without errors
npx tsc types.ts --noEmit
```

### After Phase 4 (Components)
```bash
# Create a test screen that imports all components
# Verify no import errors
```

### After Phase 5 (Hooks)
```typescript
// Test each hook in isolation
const { data, isLoading } = useListings();
console.log(data); // Should fetch from Supabase
```

### After Phase 6 (Integration)
```bash
# Full app should start without errors
npx expo start
# Navigate through all tabs
# Test each core feature
```

---

## Troubleshooting Common Issues

### "Module not found" errors
- Check import paths match actual file locations
- Verify exports in index.ts files
- Run `npx expo start --clear` to clear cache

### Type mismatches
- Regenerate types from Supabase: `supabase gen types typescript`
- Ensure types.ts matches schema.sql

### Supabase connection fails
- Check .env has correct URL and anon key
- Verify Supabase is running: `supabase status`
- Check RLS policies aren't blocking

### Gestures not working (Swipe issues)
- Ensure GestureHandlerRootView at app root
- Check Reanimated babel plugin is configured
- Verify `react-native-reanimated` and `react-native-gesture-handler` versions match Expo SDK
- For MVP: We use 2-direction swipe only (Left/Right) to avoid gesture conflicts

### Images not loading
- Verify Storage bucket exists and is public
- Check RLS policies on storage.objects

### Video upload fails or is slow
- Ensure video compression is working (720p/30fps target)
- Check `react-native-compressor` is installed
- Videos over 60s should be rejected before upload
- Monitor bandwidth costs in Supabase dashboard

### Serbian text search not working
- Verify `normalize_serbian()` function exists in database
- Check search_text_normalized column is being populated
- Test: `SELECT normalize_serbian('Čačak')` should return 'cacak'

---

## Summary: The Assembly Line

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          YOUR WORKFLOW                                   │
│                                                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│  │ Phase 0 │───▶│ Phase 1 │───▶│ Phase 2 │───▶│ Phase 3 │             │
│  │Research │    │ Schema  │    │Types+Zod│    │ Screens │             │
│  │(Claude) │    │(Claude) │    │(Claude) │    │(Claude) │             │
│  │5 categ. │    │+Serbian │    │+schemas │    │~25 scr. │             │
│  └────┬────┘    └─────────┘    └─────────┘    └────┬────┘             │
│       │                                            │                   │
│       ▼ VALIDATE!                  ┌───────────────┼────────────────┐  │
│                                    │               │                │  │
│                                    ▼               ▼                │  │
│                              ┌─────────┐     ┌─────────┐            │  │
│                              │ Phase 4 │     │ Phase 5 │   PARALLEL │  │
│                              │   UI    │     │  Utils  │            │  │
│                              │(Gemini) │     │ (GPT)   │            │  │
│                              │2-dir+hap│     │compress │            │  │
│                              └────┬────┘     └────┬────┘            │  │
│                                   │               │                 │  │
│                                   └───────┬───────┘                 │  │
│                                           │                         │  │
│                              ┌────────────┼────────────┐            │  │
│                              │            │            │            │  │
│                              ▼            │            ▼            │  │
│                         ┌─────────┐       │      ┌─────────┐        │  │
│                         │Phase 6A │───────┴─────▶│Phase 6B │        │  │
│                         │Skeleton │              │ Screens │        │  │
│                         │(Claude) │              │(Claude) │        │  │
│                         └─────────┘              └────┬────┘        │  │
│                                                       │             │  │
│                                                       ▼             │  │
│                                                 WORKING APP         │  │
│                                                                     │  │
└─────────────────────────────────────────────────────────────────────┘

Each phase:
1. PASTE APP-CONTRACT.md FIRST (every prompt!)
2. Copy prompt from EXECUTE-XX file
3. Include required context from previous phases
4. Execute in specified LLM
5. Save outputs to correct location
6. Validate before moving on (especially after Phase 0 and 2)
```

The files are designed as a **production line** where each stage adds value and the context flows forward. Skip a step and later steps will fail. Follow the order and you get a working app.

**Key additions for MVP:**
- APP-CONTRACT.md ensures consistency across all LLM outputs
- Phase 6 split (6A+6B) prevents placeholder code from large prompts
- Validation checkpoints catch data issues early
