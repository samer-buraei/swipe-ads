# SWIPEMARKET - MASTER EXECUTION GUIDE

## How to Use This Guide

This document contains **15 prompts** to be executed in order across 3 LLMs:
- **Claude** (claude.ai) - Architecture, schema, integration
- **Gemini** (gemini.google.com) - UI components  
- **ChatGPT** (chatgpt.com) - Utilities

### Key Updates (v2)
- MVP simplifications: 2-direction swipe + buttons, 5 categories
- Phase 6 split into 6A (skeleton) + 6B (core screens) for better outputs
- New APP-CONTRACT.md must be pasted with EVERY prompt for consistency
- Added Zod validation, optimistic updates, video compression, haptics

### Execution Order

```
PHASE 0: RESEARCH (Claude) - MVP Limits Applied
├── PROMPT 0A: Category Extraction     → categories.json (5 categories for MVP)
└── PROMPT 0B: Attribute Extraction    → attributes.json
    → Validate with Validation_Checklist.md

PHASE 1: SCHEMA (Claude) - Updated
└── PROMPT 1A: Database Schema         → schema.sql, seed.sql
    NEW: Serbian text normalization, PostGIS, cursor pagination

PHASE 2: TYPES (Claude) - Updated
├── PROMPT 2A: TypeScript Types        → types.ts, schemas.ts (NEW: Zod schemas)
└── PROMPT 2B: RLS Policies            → rls-policies.sql

PHASE 3: SCREENS (Claude) - MVP Scope
└── PROMPT 3A: Screen Specifications   → screens.md (~25 screens)

PHASE 4: UI COMPONENTS (Gemini) [Can run in parallel after Phase 3] - Updated
├── PROMPT 4A: Design System           → components/ui/ (+ skeletons)
├── PROMPT 4B: Swipe Cards             → components/swipe/ (2-dir + haptics + buttons)
├── PROMPT 4C: Dynamic Forms           → components/forms/ (+ Zod integration)
├── PROMPT 4D: Dynamic Filters         → components/filters/
└── PROMPT 4E: Categories & Search     → components/categories/, components/search/

PHASE 5: UTILITIES (ChatGPT) [Can run in parallel after Phase 2] - Updated
├── PROMPT 5A: Serbian Formatters      → utils/format/
├── PROMPT 5B: Media Utilities         → utils/media/ (+ 720p video compression)
├── PROMPT 5C: Geo Utilities           → utils/geo/
├── PROMPT 5D: Supabase Hooks          → hooks/ (+ optimistic updates)
└── PROMPT 5E: i18n System             → i18n/

PHASE 6: INTEGRATION (Claude) - SPLIT into 6A + 6B
├── PROMPT 6A: Project Skeleton        → app/, providers, config files
└── PROMPT 6B: Core Screens            → app/(tabs)/, listing/, etc.
```

### Time Estimates

| Phase | Prompts | Time | Parallel? |
|-------|---------|------|-----------|
| Phase 0 | 2 | 1-2 hours | No |
| Phase 1 | 1 | 1-2 hours | No |
| Phase 2 | 2 | 1-2 hours | No |
| Phase 3 | 1 | 1-2 hours | No |
| Phase 4 | 5 | 3-4 hours | Yes (after Phase 3) |
| Phase 5 | 5 | 2-3 hours | Yes (after Phase 2) |
| Phase 6A | 1 | 1-2 hours | No |
| Phase 6B | 1 | 1-2 hours | No (after 6A) |
| **Total** | **18** | **12-18 hours** | |

### File Organization

Create this folder structure to save outputs:

```
swipemarket/
├── docs/
│   ├── APP-CONTRACT.md      ← Paste with every prompt!
│   ├── HANDOVER.md          ← Resume instructions
│   ├── Validation_Checklist.md  ← Validate Phase 0/2 outputs
│   └── screens.md           ← Phase 3A output
├── research/
│   ├── categories.json      ← Phase 0A output
│   └── attributes.json      ← Phase 0B output
├── database/
│   ├── schema.sql           ← Phase 1A output
│   ├── seed.sql             ← Phase 1A output
│   └── rls-policies.sql     ← Phase 2B output
├── src/
│   ├── types/
│   │   ├── index.ts         ← Phase 2A output (types)
│   │   └── schemas.ts       ← Phase 2A output (Zod schemas)
│   ├── components/
│   │   ├── ui/              ← Phase 4A output
│   │   ├── swipe/           ← Phase 4B output (2-dir + buttons)
│   │   ├── forms/           ← Phase 4C output
│   │   ├── filters/         ← Phase 4D output
│   │   ├── categories/      ← Phase 4E output
│   │   └── search/          ← Phase 4E output
│   ├── hooks/               ← Phase 5D output (+ optimistic updates)
│   ├── utils/
│   │   ├── format/          ← Phase 5A output
│   │   ├── media/           ← Phase 5B output (+ video compression)
│   │   └── geo/             ← Phase 5C output
│   └── i18n/                ← Phase 5E output
├── app/                     ← Phase 6A + 6B output
│   ├── _layout.tsx
│   ├── (tabs)/
│   └── ...
└── README.md
```

---

## CRITICAL: Context Passing Between Prompts

Each prompt builds on previous outputs. You MUST include relevant context:

**IMPORTANT:** Always paste `APP-CONTRACT.md` FIRST with every prompt!

| Prompt | Requires Context From |
|--------|----------------------|
| ALL | APP-CONTRACT.md (paste first!) |
| 0B | 0A (categories.json) |
| 1A | 0A + 0B (categories.json, attributes.json) |
| 2A | 1A (schema.sql) |
| 2B | 1A (schema.sql) |
| 3A | 1A + 2A (schema, types) |
| 4A-4E | 2A + 3A (types.ts, screens.md) |
| 5A-5E | 2A (types.ts) |
| 6A | 2A (types.ts, schemas.ts) |
| 6B | 6A outputs + 4A-4E + 5D (components, hooks) |

---

## Quick Start Checklist

Before starting, ensure you have:

- [ ] Claude account (claude.ai or API)
- [ ] Gemini account (gemini.google.com)
- [ ] ChatGPT account (chatgpt.com)
- [ ] Folder structure created
- [ ] **APP-CONTRACT.md ready to paste with every prompt**
- [ ] 12-18 hours available (can be split across days)

---

## Prompt Files

The prompts are in these files (execute in order):

| File | LLM | Purpose |
|------|-----|---------|
| `EXECUTE-01-PHASE0-CLAUDE.md` | Claude | Research prompts (5 categories MVP) |
| `EXECUTE-02-PHASE1-CLAUDE.md` | Claude | Schema (+ Serbian normalization, PostGIS) |
| `EXECUTE-03-PHASE2-CLAUDE.md` | Claude | Types + Zod schemas |
| `EXECUTE-04-PHASE3-CLAUDE.md` | Claude | Screens (~25 for MVP) |
| `EXECUTE-05-PHASE4-GEMINI.md` | Gemini | UI (2-dir swipe + haptics) |
| `EXECUTE-06-PHASE5-GPT.md` | ChatGPT | Utils (video compression, optimistic updates) |
| `EXECUTE-07-PHASE6A-INTEGRATION.md` | Claude | Project skeleton |
| `EXECUTE-08-PHASE6B-INTEGRATION.md` | Claude | Core screen implementations |

**Supporting files:**
- `APP-CONTRACT.md` - Paste with EVERY prompt for consistency
- `HANDOVER.md` - Resume instructions for new sessions
- `Validation_Checklist.md` - Validate Phase 0/2 outputs

Each file contains copy-paste ready prompts with clear instructions.
