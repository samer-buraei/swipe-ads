# PHASE 4 — STEP 1: Fix Production Blockers
**Estimated time:** 30 minutes total
**Do this before anything else in Phase 4.**

---

## Session context header (paste this at the top of your agent session)

```
PROJECT: SwipeMarket — Serbian classifieds marketplace
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2
AUTH: Supabase Auth (Google OAuth) — NO NextAuth
DB: Supabase hosted PostgreSQL — supabase client only
ROOT: C:\Users\sam\Desktop\swipemarket\
CURRENT TASK: PHASE4_STEP1 — Fix 3 production blockers
DO NOT modify any component or router files in this session.
Only touch: .env.local, package.json, eslint.config.mjs
```

---

## TASK 1.1 — Set DEMO_MODE to false

**Files to edit:** `.env.local`

Open `.env.local`. Find the line `DEMO_MODE="true"` and change it to:

```
DEMO_MODE="false"
```

Also update:
```
NEXT_PUBLIC_APP_URL="https://swipemarket.rs"
```

If you are testing on a Vercel preview URL instead of the real domain, set it to the preview URL for now.

**Verify:**
```bash
npm run dev
```
Open http://localhost:3000. You should see real Supabase listings, not demo mock data. The "Demo Login" button should no longer appear.

**Done when:** Home page loads with real data and no demo banner.

---

## TASK 1.2 — Add Prisma to package.json

**Files to edit:** `package.json`

**Files to read first:** `package.json` (check current scripts section)

Run this command:
```bash
npm install --save-dev prisma@^5.0.0
npm install @prisma/client@^5.0.0
```

Then open `package.json`. Find the `"scripts"` section and add these entries:

```json
"db:generate": "prisma generate",
"db:push": "prisma db push",
"db:studio": "prisma studio"
```

The scripts section should look like this after the edit:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "test": "npm run test:unit && npm run test:e2e",
  "test:unit": "vitest run",
  "test:e2e": "playwright test",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:studio": "prisma studio"
}
```

Then run:
```bash
npm run db:generate
```

**Verify:**
```bash
npm run typecheck
```
Must return 0 errors.

**Done when:** `npm run db:generate` succeeds and `npm run typecheck` shows 0 errors.

---

## TASK 1.3 — Fix ESLint config

**Files to read first:** `eslint.config.mjs`

**Files to edit:** `eslint.config.mjs`

Open `eslint.config.mjs`. Find the import line that says:
```js
import nextConfig from "eslint-config-next/core-web-vitals"
```

Change it to:
```js
import nextConfig from "eslint-config-next/core-web-vitals.js"
```

(Just add `.js` to the end of the import path — nothing else changes.)

**Verify:**
```bash
npm run lint
```

**Done when:** `npm run lint` runs without the "Cannot find module" error. There may be a small number of actual lint warnings — that is acceptable. Zero errors is the goal.

---

## TASK 1.4 — Verify Supabase Storage bucket

This is a manual step in the Supabase dashboard — no code to write.

1. Go to https://supabase.com/dashboard
2. Open project `awbtohtpjrqlxfoqtita`
3. Click **Storage** in the left sidebar
4. Find bucket named `listing-images`
5. Click the bucket → click **Policies**
6. Confirm there is a policy allowing public SELECT (read)
7. If the bucket does not exist: click **New bucket** → name it `listing-images` → check **Public bucket** → Save

**Done when:** You can open a listing image URL in a browser tab and it loads without a 403 error.

---

## TASK 1.5 — Full build verification

Run all of these in order:

```bash
npm run typecheck
```
Expected: `0 errors`

```bash
npm run lint
```
Expected: no errors (warnings OK)

```bash
npm run build
```
Expected: `✓ Compiled successfully`

```bash
npm run test:unit
```
Expected: all tests pass

**Done when:** All 4 commands complete without errors. This is the baseline for the rest of Phase 4.

---

## Step 1 complete — what was fixed

| Blocker | Fixed |
|---------|-------|
| `DEMO_MODE="true"` blocking real data | ✅ Set to `"false"` |
| Prisma missing from devDependencies | ✅ Installed + scripts added |
| ESLint config broken | ✅ `.js` extension added |
| Supabase Storage bucket verified | ✅ Manual dashboard check |

**Next:** Open `PHASE4_STEP2_PHONE_OTP.md` or `PHASE4_STEP3_LISTING_MGMT.md`
