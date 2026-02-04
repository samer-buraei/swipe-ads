# SWIPEMARKET - QUICK REFERENCE CARD

## One-Page Summary

### What We're Building
Serbian classifieds app (like KupujemProdajem) + Tinder-style swiping + TikTok-style video posts

### MVP Scope (V1)
- 5 categories: Vehicles, Real Estate, Electronics, Fashion, Other
- 2-direction swipe (Left/Right) + buttons for Contact/Maybe
- ~25 screens
- Video: 60s max, compressed to 720p

### Tech Stack
```
Frontend: Expo + React Native + NativeWind + TypeScript
Backend:  Supabase (PostgreSQL + Auth + Storage + Realtime)
Search:   PostgreSQL Full-Text + JSONB + Serbian normalization
State:    React Query + Zustand
Validation: Zod
```

---

## Execution Checklist

**IMPORTANT:** Paste APP-CONTRACT.md FIRST with every prompt!

### PHASE 0: Research (Claude) 1-2 hours
```
□ Paste APP-CONTRACT.md
□ PROMPT 0A → categories.json (5 categories MVP)
□ PROMPT 0B → attributes.json
□ Validate with Validation_Checklist.md
```

### PHASE 1: Schema (Claude) 1-2 hours
```
□ Paste APP-CONTRACT.md
□ PROMPT 1A → schema.sql, seed.sql (+ Serbian normalization, PostGIS)
```

### PHASE 2: Types (Claude) 1-2 hours
```
□ Paste APP-CONTRACT.md
□ PROMPT 2A → types.ts + schemas.ts (Zod schemas)
□ PROMPT 2B → rls-policies.sql
□ Validate Zod schemas compile
```

### PHASE 3: Screens (Claude) 1-2 hours
```
□ Paste APP-CONTRACT.md
□ PROMPT 3A → screens.md (~25 screens MVP)
```

### PHASE 4: UI (Gemini) 3-4 hours [PARALLEL]
```
□ Paste APP-CONTRACT.md + types.ts with each prompt
□ PROMPT 4A → components/ui/ (+ skeletons)
□ PROMPT 4B → components/swipe/ (2-dir + haptics + buttons)
□ PROMPT 4C → components/forms/ (+ Zod integration)
□ PROMPT 4D → components/filters/
□ PROMPT 4E → components/categories/, components/search/
```

### PHASE 5: Utils (ChatGPT) 2-3 hours [PARALLEL]
```
□ Paste APP-CONTRACT.md + types.ts with each prompt
□ PROMPT 5A → utils/format/, utils/serbian/
□ PROMPT 5B → utils/media/ (+ 720p video compression)
□ PROMPT 5C → utils/geo/
□ PROMPT 5D → hooks/ (+ optimistic updates)
□ PROMPT 5E → i18n/
```

### PHASE 6: Integration (Claude) 2-4 hours
```
□ Paste APP-CONTRACT.md
□ PROMPT 6A → Project skeleton, providers, config
□ PROMPT 6B → Core screen implementations
```

**Total: 15 prompts, 12-18 hours**

---

## 🔗 Context Passing Rules

| When Running... | Include These Files... |
|-----------------|------------------------|
| Phase 0B | categories.json from 0A |
| Phase 1 | categories.json + attributes.json |
| Phase 2 | schema.sql |
| Phase 3 | types.ts |
| Phase 4 (all) | types.ts + screens.md |
| Phase 5 (all) | types.ts |
| Phase 6 | ALL previous outputs |

---

## Final File Count (MVP)

| Folder | Files | Description |
|--------|-------|-------------|
| database/ | 3 | schema, seed, RLS |
| src/types/ | 2 | types.ts + schemas.ts (Zod) |
| src/components/ui/ | 12+ | Design system + skeletons |
| src/components/swipe/ | 4 | 2-dir swipe + undo (simplified) |
| src/components/forms/ | 10+ | Dynamic forms + Zod |
| src/components/filters/ | 6 | Filter system |
| src/components/categories/ | 5 | Category browser |
| src/components/search/ | 6 | Search UI |
| src/hooks/ | 8 | Supabase hooks + optimistic updates |
| src/utils/ | 20+ | Formatters, media (+ compression), geo |
| src/i18n/ | 6 | Translations |
| app/ | 25+ | Screens (Expo Router) |
| **Total** | **~100+** | |

---

## 💰 Estimated LLM Costs

| LLM | Tokens (approx) | Cost |
|-----|-----------------|------|
| Claude (Opus) | 300K | $20-30 |
| Gemini Pro | 200K | $5-10 |
| ChatGPT-4 | 150K | $10-15 |
| **Total** | **650K** | **$35-55** |

---

## 🧪 Testing Commands

```bash
# Start Supabase locally
supabase start

# Run migrations
supabase db reset

# Start Expo
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

---

## MVP Swipe Model (2-Direction + Buttons)

```
         ┌─────────────────────────┐
         │                         │
← LEFT   │      SWIPE CARD         │   RIGHT →
 NOPE    │                         │    LIKE
         │  ┌─────────┬─────────┐  │
         │  │[Maybe ?]│[Contact]│  │  ← BUTTONS
         │  └─────────┴─────────┘  │
         └─────────────────────────┘
         
         DOUBLE TAP = DETAILS
```

**Haptic Feedback:**
- Right swipe (Like): Medium impact
- Left swipe (Nope): Light impact
- Button press: Soft impact
- Undo: Success notification

**V2 (Future):** Full 5-direction swipe (Up=Contact, Down=Maybe)

---

## 🌍 Bilingual Keys

All user-facing text uses:
```typescript
{
  sr: "Srpski tekst",
  en: "English text"
}
```

Access via: `t('key')` or `tBilingual(text)`

---

## 💱 Currency Display

- Store: Original currency + EUR equivalent
- Display: User's preferred (RSD or EUR)
- Convert: Using exchange_rates table

---

## 📁 Key Files Quick Reference

| Need... | Look in... |
|---------|------------|
| Database tables | schema.sql |
| TypeScript types | src/types/index.ts |
| API hooks | src/hooks/ |
| Translations | src/i18n/translations/ |
| Swipe UI | src/components/swipe/ |
| Dynamic forms | src/components/forms/ |
| Screen specs | docs/screens.md |

---

## Quick Start (After All Phases Complete)

```bash
# 1. Install dependencies
npm install

# 2. Key dependencies to verify are installed:
#    - expo-haptics (haptic feedback)
#    - react-native-compressor (video compression)
#    - zod (validation)
#    - zustand (client state)

# 3. Start Supabase
supabase start

# 4. Run migrations & seed
supabase db reset

# 5. Copy env file
cp .env.example .env.local

# 6. Start app
npx expo start

# 7. Scan QR with Expo Go
```

---

## 🚀 You're Ready!

Follow the prompts in order. Each builds on the last.
The result: A fully functional Serbian classifieds app.
