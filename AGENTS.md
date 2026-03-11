# AGENTS.md — SwipeMarket Multi-Agent Workflow Guide

> This file tells every AI agent exactly where the project stands, what to do next, and how to work without breaking other agents' work.
> Last updated: 2026-03-11 (deployment complete; current work is revamp and flow completion)
>
> **Who reads this file:**
> - **Any coding agent** — read the canonical files section first, then use the specific file that matches your task.
> - **Claude / Gemini / Codex / other reviewers** — use this file for operational state and deployment history, not as the sole source of current product completeness.

---

## CANONICAL FILES — READ THESE FIRST

| File | Use it for |
|---|---|
| `AGENTS.md` | Operational state, deployment history, environment caveats, what previously worked or failed |
| `STATUS.md` | Source-verified route map, API map, button/code trace, and known bug inventory |
| `REVAMP_TODO.md` | Current implementation backlog and execution workstreams |
| `FULL_FEATURE_TEST_PLAN_RESULTS.md` | Latest automated browser-test attempt and why it was incomplete |
| `CLAUDE.md` | Codebase map and implementation guardrails, but not the authoritative feature-completeness document |

## CURRENT ENGINEERING FOCUS — EXECUTE IN THIS ORDER

| # | Task | Type | Status |
|---|------|------|--------|
| 1 | Work from `REVAMP_TODO.md` P0 items first | Backlog | ✅ Ready |
| 2 | Use `STATUS.md` for code trace before changing UI or logic | Review | ✅ Ready |
| 3 | Use `FULL_FEATURE_TEST_PLAN_RESULTS.md` to understand what browser automation did not verify | QA | ✅ Ready |
| 4 | Update `REVAMP_TODO.md` / `AGENTS.md` if implementation changes status or invalidates history | Docs | ✅ Ongoing |
| 5 | Connect custom domain `swipemarket.rs` if desired | Vercel Dashboard | ⏳ Optional |

> **Site URL:** https://swipe-ads.vercel.app ✅ Live and working
> **Auth:** Google OAuth ✅ working | Phone OTP ✅ working
> **Middleware removed** — was causing every Vercel deploy to fail. Auth is now client-side only (useEffect + supabase.auth.getUser() in each protected page).

**→ Historical deployment/setup instructions remain below for reference, but they are not the active engineering queue anymore.**

---

## CURRENT STATE (as of 2026-03-11)

| Item | Status | Notes |
|------|--------|-------|
| Site URL | ✅ Live | https://swipe-ads.vercel.app |
| Vercel deployment | ✅ Passing | All builds succeed, no middleware |
| Google OAuth | ✅ Working | Owner samer.buraei@gmail.com logged in successfully |
| Phone OTP | ✅ Working | Test number +381641112222 / code 123456 |
| Database schema | ✅ Applied | All tables, RLS policies, 6 demo listings |
| Storage bucket | ✅ Created | `listing-images` bucket is public, RLS set |
| Image uploads | ✅ Fixed | service_role client uses @supabase/supabase-js directly |
| Image display | ✅ Fixed | Removed ?width= transform params — Supabase paid feature, caused 404s on free tier |
| Middleware | ❌ Removed | Was causing Vercel "Deploying outputs..." internal error. Removed permanently. |
| Admin user | ✅ Done | samer.buraei@gmail.com confirmed as admin via SQL |
| Admin panel | ✅ Working | /admin loads, shows empty moderation queue (listings auto-approved) |
| Posting listings | ✅ Working | Owner posted a listing successfully |
| Messaging | ✅ Fixed | Commit d412fc9 — all message.send writes now use service role. Was blocked by missing RLS INSERT/UPDATE policies on conversations table. |
| Rating | ✅ Fixed | Commit d412fc9 — added service role + users upsert guard. Was failing due to FK constraint when handle_new_user trigger hadn't created public.users row for OAuth user. |
| Error visibility | ⚠️ Limited | No Sentry configured. Server errors: Vercel Dashboard → swipe-ads → Functions → View logs. Client errors: browser console (F12). Added alert() for send message errors. |
| Custom domain | ⏳ Not connected | swipemarket.rs not yet pointed to Vercel |
| Source-verified code map | ✅ Available | See `STATUS.md` |
| Revamp backlog | ✅ Defined | See `REVAMP_TODO.md` |
| Automated browser test pass | ⚠️ Incomplete | See `FULL_FEATURE_TEST_PLAN_RESULTS.md` for the browser-tool limitation |

**Key architecture note:** Route protection is now entirely client-side. Each protected page (`/profile`, `/new`, `/favorites`, `/messages`) has a `useEffect` that calls `supabase.auth.getUser()` and redirects to `/login` if no session. The Header component uses `onAuthStateChange` to show "Prijavi se" (logged out) or "Profil" (logged in) reactively.

**RLS pattern note:** The Supabase RLS policies are written for client-side access only. Server-side operations (tRPC mutations) that write on behalf of multiple users must use `createServiceRoleClient()` to bypass RLS. The session client (`createServerSupabaseClient()`) is fine for SELECTs but breaks for writes involving other users' rows.

---

## HISTORICAL DEPLOYMENT STEPS (Completed 2026-03-02)

### Step A — Set owner as admin (Supabase SQL Editor)

1. Open `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/sql/new`
2. Run this SQL:

```sql
UPDATE users SET is_admin = true WHERE email = 'samer.buraei@gmail.com';
```

3. Verify it worked:

```sql
SELECT id, email, is_admin FROM users WHERE email = 'samer.buraei@gmail.com';
```

4. ✅ PASS: `is_admin` column shows `true`
5. ❌ FAIL: Row not found → the user hasn't logged in yet (handle_new_user trigger creates the row on first login). Have the owner log in at https://swipe-ads.vercel.app first, then re-run.

---

### Step B — Test posting a listing (as owner)

1. Go to `https://swipe-ads.vercel.app`
2. Click **"Prijavi se"** in the header → log in with `samer.buraei@gmail.com` via Google
3. After login: you land on the home page. Header should now show **"Profil"** instead of **"Prijavi se"**
4. Click **"Novo"** (the + button in the bottom nav, or **"Postavi oglas"** in the desktop header)
5. Fill in all required fields: title, description, price, category, condition, city
6. Click the image upload area — select 2–3 JPEG or PNG images from your computer
7. ✅ Confirm: Thumbnail previews appear for each uploaded image (no red error)
8. Click **"Postavi oglas"** / **"Post"** to submit the listing
9. ✅ PASS: You are redirected to the listing detail page, images are visible, no errors
10. ❌ FAIL: Red error on image upload → check STORAGE BUCKET SETUP section; confirm `listing-images` bucket exists in Supabase

---

### Step C — Register second user and send a message

1. Open an **incognito window** → navigate to `https://swipe-ads.vercel.app/login`
2. Log in with a **different Google account** (a second Gmail you own)
3. ✅ Confirm: Logged in as the second user, Header shows "Profil"
4. Browse listings on the home page (swipe deck)
5. Click on the listing posted by the owner in Step B
6. Click the **"Pošalji poruku"** / message button on the listing detail page
7. Send a short test message (e.g. "Zdravo, da li je dostupno?")
8. ✅ PASS: Message appears in the conversation thread
9. Now switch back to the **main browser window** (owner account)
10. Click **"Poruke"** in the nav
11. ✅ PASS: The conversation from the second user is visible in the inbox

---

### Step D — Verify admin panel (after Step A)

1. Log in as `samer.buraei@gmail.com`
2. Click **"Profil"** in the header → navigate to `/profile`
3. ✅ PASS: You see an **"Admin Panel"** button or link (only visible to is_admin = true users)
4. Click it → navigates to `/admin`
5. ✅ PASS: Admin panel shows list of all users, listings, and reports

---

### Step E — Run full feature test plan

After Steps A–D pass, run the full feature test plan (Tests 1–18 below).
Start with TEST 1 and work through in order.
Report ✅ PASS or ❌ FAIL for each test, with the exact error text on failure.

---

## DEPLOYMENT SESSION HISTORY (2026-03-02)

This documents everything that broke during the deployment session and how each issue was resolved. For reference if similar issues arise.

---

### Issue 1 — Image uploads failing: "Neautorizovan pristup"

**Symptom:** Every image upload from `/new` returned "Neautorizovan pristup" (Unauthorized access).

**Root cause:** `lib/supabase/server.ts` had a `createServiceRoleClient()` function that imported `createServerClient` from `@supabase/ssr`. The SSR client always injects the requesting user's JWT as the Bearer token, which overrides the service_role key with the user's limited permissions.

**Fix:** Replaced `createServiceRoleClient()` to import `createClient` directly from `@supabase/supabase-js` (not the SSR package), with `auth: { autoRefreshToken: false, persistSession: false }`. This correctly sends the service_role key as Bearer, bypassing RLS.

---

### Issue 2 — "permission denied for schema public"

**Symptom:** After fixing the service_role client, uploads still failed with a PostgreSQL error: "permission denied for schema public".

**Root cause:** The `service_role` PostgreSQL role had no explicit GRANT on the public schema. Even though it has superuser-level privileges in many contexts, Supabase's default config does not grant it public schema access automatically.

**Fix:** Ran in Supabase SQL Editor:
```sql
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
```

---

### Issue 3 — verifyOtp tRPC mutation not setting session cookies

**Symptom:** After Phone OTP verification succeeded (Supabase returned tokens), the user's session was not persisted. Refreshing the page showed them logged out.

**Root cause:** tRPC uses `fetchRequestHandler` under the hood. It creates its own `Response` object and does not propagate `Set-Cookie` headers set via Next.js's `cookies().set()` inside the tRPC handler.

**Fix:** Changed the `verifyOtp` tRPC mutation to return `{ accessToken, refreshToken }` in its response instead of trying to set cookies server-side. In `app/login/page.tsx`, the `onSuccess` callback now calls `supabase.setSession({ access_token, refresh_token })` client-side, which correctly persists the session in the browser.

---

### Issue 4 — middleware.ts causing every Vercel deployment to fail

**Symptom:** Every Vercel deployment succeeded at "Building" but then failed at "Deploying outputs..." with an internal Vercel error. The error had no user-readable message — just an internal failure code.

**Root cause:** `middleware.ts` was added for Supabase session refresh. It imported `createServerClient` from `@supabase/ssr`, which created an Edge Middleware bundle of 74.5 kB. This exceeded an internal Vercel limit for Edge Middleware bundles, triggering the deployment failure.

**Attempts that failed:**
1. Simplified middleware to only check cookies (no @supabase/ssr import) → bundle 26.7 kB → still failed
2. Deleted duplicate `next.config.ts` file → still failed
3. Deleted and recreated the entire Vercel project from scratch → still failed
4. Added VAPID env vars to new Vercel project → different build error (see Issue 6) but deploy still would have failed

**Final fix:** Deleted `middleware.ts` entirely. Route protection moved to client-side `useEffect` in each protected page. Session refresh happens via `onAuthStateChange` in `Header.tsx` which is mounted on every page.

---

### Issue 5 — Duplicate next.config files (.mjs + .ts)

**Symptom:** Vercel build failed with: `Configuring Next.js via 'next.config.ts' is not supported. Please rename it to 'next.config.js' or 'next.config.mjs'.`

**Root cause:** Both `next.config.mjs` and `next.config.ts` existed in the repo root. `next.config.ts` is only supported in Next.js 15+. This project uses Next.js 14.2.18.

**Fix:** Deleted `next.config.ts`. Kept `next.config.mjs` with the full config including Supabase image hostname:
```js
remotePatterns: [
  { protocol: 'https', hostname: 'awbtohtpjrqlxfoqtita.supabase.co' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'picsum.photos' },
]
```

---

### Issue 6 — push.ts VAPID crash at build time

**Symptom:** After recreating the Vercel project (fresh env vars), build failed with: `No subject set in vapidDetails.subject`. The crash happened during Next.js page data collection at build time (not runtime).

**Root cause:** `lib/push.ts` called `webpush.setVapidDetails(...)` at the module's top level (outside any function). When Next.js imported this module during the build to collect page metadata, the VAPID env vars were not set yet (new Vercel project hadn't had them added yet).

**Fix:** Wrapped the `setVapidDetails()` call in a conditional:
```typescript
if (
    process.env.VAPID_SUBJECT &&
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
) {
    webpush.setVapidDetails(...)
}
```
Also added a guard at the top of `sendPushNotification()`: if `!process.env.VAPID_SUBJECT`, return `{ expired: false }` silently. This makes VAPID/push entirely optional — the app builds and runs fine without those env vars.

---

### Issue 7 — BottomNav and Header missing auth-aware elements

**Symptom:** The bottom nav had no "Profile" link, and the desktop header had no login/logout button. Users had no way to navigate to their profile or know if they were logged in.

**Fix:**
- `components/layout/BottomNav.tsx`: Replaced the 4th nav item (was "Omiljeni"/Heart) with "Profil" (User icon → `/profile`).
- `components/layout/Header.tsx`: Added `'use client'` directive + `useState<User | null>` + `useEffect` with `supabase.auth.getUser()` + `onAuthStateChange`. Shows "Prijavi se" link (→ `/login`) when logged out, "Profil" link (→ `/profile`) when logged in.

---

### Issue 8 — Site 404 after Vercel project deletion

**Symptom:** After deleting the old Vercel project and creating a new one, `https://swipe-ads.vercel.app` showed `404 DEPLOYMENT_NOT_FOUND`.

**Root cause:** When a Vercel project is deleted, its custom domain assignments are removed. The new project was deployed but `swipe-ads.vercel.app` was not yet associated with it.

**Fix:** In the new Vercel project → Settings → Domains → added `swipe-ads.vercel.app` → Vercel showed "Valid Configuration". After the next successful deployment, the domain started serving the app.

---

### Final outcome

- `middleware.ts` deleted, `next.config.ts` deleted, `push.ts` guarded, `Header.tsx` and `BottomNav.tsx` fixed
- Deployment succeeded: `https://swipe-ads.vercel.app` is live
- Owner `samer.buraei@gmail.com` logged in via Google OAuth successfully ✅

---

## DATABASE SETUP — Run this first (Antigravity instructions)

> The live site currently shows "Could not find the table 'public.listings'" because the database has no tables.
> You must run 3 SQL files in the Supabase SQL Editor in this exact order.
> **Project ID:** `awbtohtpjrqlxfoqtita`
> **SQL Editor URL:** `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/sql/new`

---

### STEP 1 — Run the base schema (supabase-schema.sql)

This creates ALL tables: users, listings, listing_images, favorites, swipe_events, search_profiles, conversations, conversation_participants, messages, reports, ratings, categories. Also creates all RLS policies, indexes, the auth trigger, and 6 demo listings.

1. Open `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/sql/new`
2. Make sure you are logged in to Supabase (project: awbtohtpjrqlxfoqtita)
3. You will see a large empty text editor area
4. Open the file `C:\Users\sam\Desktop\swipemarket\supabase-schema.sql` and copy its entire contents
5. Paste the entire contents into the Supabase SQL Editor text area (replacing any existing content)
6. Click the green **"Run"** button (bottom right of the editor)
7. Wait for it to complete — it may take 10–20 seconds
8. ✅ PASS: At the bottom of the screen you see "Success. No rows returned" or similar success message
9. ❌ FAIL: Any red error text appears. If you see "already exists" errors on the ENUMs/tables, the schema was partially run before — see TROUBLESHOOTING note below

> **TROUBLESHOOTING:** If you get "already exists" errors, it means the schema was partially run. In that case, navigate to `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/sql/new` and run this cleanup first, then re-run the schema:
> ```sql
> DROP TABLE IF EXISTS ratings, reports, messages, conversation_participants, conversations, search_profiles, swipe_events, favorites, listing_images, listings, category_attributes, categories, users CASCADE;
> DROP TYPE IF EXISTS listing_status, item_condition, swipe_direction, report_reason, report_status, attribute_type CASCADE;
> DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
> ```

---

### STEP 2 — Run the search_profiles migration

This converts the `keywords` column from TEXT to TEXT[] and adds a `conditions` column.

1. Click **"New query"** (top left, or navigate to `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/sql/new`)
2. Paste this SQL exactly:

```sql
-- supabase/migrations/20231025000000_search_profiles_arrays.sql

-- 1. Cast existing `keywords` from TEXT to TEXT[] using a comma delimiter split
ALTER TABLE search_profiles
ALTER COLUMN keywords TYPE TEXT[] USING string_to_array(keywords, ',');

-- 2. Add the `conditions` textual array to match the ItemConditionSchema
ALTER TABLE search_profiles
ADD COLUMN conditions TEXT[];
```

3. Click **"Run"**
4. ✅ PASS: "Success. No rows returned" — the columns were altered successfully
5. ❌ FAIL: If you get "column keywords is of type text[]" — the migration already ran, skip to Step 3

---

### STEP 3 — Run the category attributes seed

This seeds all attributes for vehicles, real estate, electronics, fashion, sports, pets, and services categories.

1. Click **"New query"** (top left)
2. Open the file `C:\Users\sam\Desktop\swipemarket\supabase-seed-category-attributes.sql` and copy its entire contents
3. Paste into the SQL Editor
4. Click **"Run"**
5. ✅ PASS: "Success. Rows affected: 47" (or similar positive number) — attributes seeded
6. ❌ FAIL: "duplicate key value violates unique constraint" — seed already ran, skip (attributes are already there)

---

### STEP 4 — Verify the data is there

1. Click **"New query"** (top left)
2. Paste and run:
```sql
SELECT COUNT(*) FROM listings WHERE status = 'ACTIVE';
```
3. ✅ PASS: Returns `6` — the 6 demo listings are there
4. ❌ FAIL: Returns `0` — the seed data didn't insert. Re-run Step 1.

---

### STEP 5 — Go to the live site

1. Navigate to `https://vercel.com/dashboard` and find the **swipe-ads** project
2. Get the Vercel URL (e.g. `https://swipe-ads-abc123.vercel.app`)
3. Navigate to that URL
4. ✅ PASS: You see a stack of listing cards (MacBook, PS5, iPhone, etc.) — the 6 demo listings appear
5. ❌ FAIL: Still shows "Could not find table" — wait 30 seconds and refresh (Vercel may have cached the error)

---

### STEP 6 — Add Vercel URL to Supabase Auth redirect URLs (required for Google login)

1. Navigate to `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/auth/url-configuration`
2. Scroll down to **"Redirect URLs"**
3. Click **"Add URL"** → type `[YOUR_VERCEL_URL]/auth/callback` → click **"Add"**
4. Click **"Add URL"** again → type `[YOUR_VERCEL_URL]/**` → click **"Add"**
5. Click **"Save"**
6. ✅ PASS: Both URLs appear in the Redirect URLs list

---

> **Once Steps 1–6 are complete, the app is fully functional. Proceed to the FULL FEATURE TEST PLAN below.**

---

## STORAGE BUCKET SETUP — Run this to fix image uploads

> **Why:** The `listing-images` Supabase Storage bucket was never created as part of initial deployment. Without it, every image upload fails with "Bucket not found" and users cannot submit listings.
> **File:** `C:\Users\sam\Desktop\swipemarket\setup-storage-rls.sql`

### STEP 1b — Run setup-storage-rls.sql

1. Open `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/sql/new`
2. Open the file `C:\Users\sam\Desktop\swipemarket\setup-storage-rls.sql` and copy its entire contents
3. Paste into the SQL Editor and click **"Run"**
4. ✅ PASS: "Success" message — the bucket and RLS policies are created
5. ❌ FAIL: "policy already exists" — run only the INSERT line below and skip policy creation:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('listing-images', 'listing-images', true)
   ON CONFLICT (id) DO NOTHING;
   ```

### STEP 1b-verify — Confirm bucket exists

1. Navigate to `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/storage/buckets`
2. ✅ PASS: You see a bucket named `listing-images` marked as Public
3. ❌ FAIL: No bucket visible — re-run Step 1b

### STEP 1b-test — Confirm image upload works on live site

1. Navigate to `https://swipe-ads.vercel.app` and log in (OTP: 0641112222 / 123456)
2. Go to `/new` (create listing)
3. Click the image upload area and select any JPEG or PNG file
4. ✅ PASS: Image thumbnail appears in the uploader, no error overlay
5. ❌ FAIL: Red error text appears on the image slot — note the exact error text and report it

---

## FULL FEATURE TEST PLAN — Browser Agent (Antigravity)

> **When to run:** After Vercel deployment shows "Ready" (green check).
> **How to report:** For every test, write ✅ PASS or ❌ FAIL. On failure, copy the exact error text from the screen and the URL you were on.
> **Important:** Complete PRE-TEST SETUP A and B before running any test — they are mandatory prerequisites.

---

### PRE-TEST SETUP

> ⚠️ **Before running any tests, you must complete DATABASE SETUP Steps 1–6 above.** The tests will fail if the database schema hasn't been run.

**A — Find the live URL (do this first)**

1. Navigate to `https://vercel.com/dashboard`
2. Click the **swipe-ads** project tile
3. Look at the top of the page — there is a URL ending in `.vercel.app`
4. Copy that URL exactly (e.g. `https://swipe-ads-abc123.vercel.app`)
5. This is your `[LIVE_URL]` — substitute it everywhere below

**B — Confirm 6 listing cards are visible**

1. Navigate to `[LIVE_URL]`
2. ✅ Confirm: You can see a stack of listing cards (MacBook, PS5, iPhone, dvosed, gitara, bicikla)
3. ❌ If you see an error or blank screen: DATABASE SETUP Step 1 did not run correctly. Stop and fix that first.

**C — Prepare two browser sessions**

Some tests require two different logged-in users at the same time:
- **Session A** — your main browser window (normal)
- **Session B** — a separate incognito window (Ctrl+Shift+N in Chrome) or a different browser

You do not need to log in yet — the tests will tell you when and how.

---

---

### TEST 1 — App loads without crashing

**URL:** Navigate to `[LIVE_URL]`

**What to look for:**
- The page renders within 5 seconds
- You see either: a login page with phone number input, OR a stack of listing cards (swipe deck)
- The bottom of the screen has 5 navigation icons (Home, Search, Post, Messages, Profile)

**✅ PASS criteria:** Page renders, bottom nav is visible, no error text on screen

**❌ FAIL criteria:** Any of these appear on screen:
- "Application error: a client-side exception has occurred"
- "500 Internal Server Error"
- Blank white page that stays blank for more than 10 seconds
- "This page could not be found" (404)

---

### TEST 2 — Phone OTP login (Session A)

**URL:** Navigate to `[LIVE_URL]/login`

**Steps:**
1. You see a page with a phone number input field and text "Unesite vaš broj telefona"
2. In the phone input field, type: `0641112222`
3. Click the button labelled **"Pošalji kod"**
4. The screen should change — a new input appears asking for a 6-digit code with text like "Unesite kod"
5. In the code field, type: `123456`
   _(This works because +381641112222 is a test number configured in Supabase with fixed OTP 123456)_
6. Click the button labelled **"Potvrdi"** or **"Prijavi se"**

**✅ PASS criteria:** You are redirected to `[LIVE_URL]` (home page) and the bottom nav shows a Profile icon you can click. You are now logged in as User A. Note this session stays open.

**❌ FAIL criteria:**
- After clicking "Pošalji kod": error message appears (e.g. "Nevažeći broj telefona" or any red text)
- After entering 123456: error says code is wrong or expired
- Page stays on login after submitting — you are not redirected home

---

### TEST 3 — Google OAuth login (Session B)

**URL:** Open a new incognito window. Navigate to `[LIVE_URL]/login`

**Steps:**
1. You see the login page with a button labelled **"Nastavi sa Google"** (or similar, with a Google logo)
2. Click that button
3. A Google account chooser page opens (either in the same tab or a popup)
4. Select any Google account
5. Google redirects back to the app

**✅ PASS criteria:** You land back on `[LIVE_URL]` logged in as a different user. You can see the home page / swipe deck. This is now your Session B (User B). Keep this incognito window open.

**❌ FAIL criteria:**
- A page shows "Error 400: redirect_uri_mismatch" → means PRE-TEST SETUP step B was skipped. Stop, go complete step B, then retry this test.
- Google page shows "Access blocked" → a different OAuth config issue, report the exact error text
- You end up back on the login page after Google — not redirected home

---

### TEST 4 — Swipe deck browsing and favorites

**Session:** Use Session A (logged in as User A)
**URL:** Navigate to `[LIVE_URL]`

**Steps:**
1. You should see stacked cards — each card has a photo, a title, a price, and a city
2. Note the title of the top card
3. Click and drag the card to the RIGHT, or click the heart ♥ button at the bottom of the card
4. The card should slide off-screen to the right, revealing the next card underneath
5. Now click the bottom nav icon that looks like a heart (Favorites)
6. You land on `[LIVE_URL]/favorites`

**✅ PASS criteria:**
- The card you swiped right on appears in the Favorites list with its title visible
- At least one card title matches what you noted in step 2

**❌ FAIL criteria:**
- No cards appear on home screen (only acceptable if the database is empty — check if listings exist)
- Swiping does nothing (card stays in place)
- Favorites page shows "Nema sačuvanih oglasa" even though you just swiped right
- Any red error text or spinning loader that never stops

---

### TEST 5 — Grid browse and listing detail

**Session:** Session A
**URL:** Navigate to `[LIVE_URL]/quick-browse`

**Steps:**
1. You should see a 2-column grid of listing cards with photos and prices
2. Click on any one card
3. A new page opens — the listing detail page

**✅ PASS criteria on the detail page:**
- The page URL changes to `[LIVE_URL]/listing/[some-slug]`
- You can see: the listing title as an `<h1>` heading, the price in RSD, at least one photo, a seller section showing the seller's name, and a "Kontaktiraj prodavca" button

**❌ FAIL criteria:**
- Grid shows spinning loader that never resolves
- Clicking a card goes nowhere or shows a blank page
- Detail page loads but shows only partial content (missing price, seller info, or images)

---

### TEST 6 — Search with text and city filter

**Session:** Session A
**URL:** Navigate to `[LIVE_URL]/search`

**Steps:**
1. You see a search bar at the top
2. Click the search bar and type: `a` (single letter — just to get any results)
3. Wait up to 3 seconds for results to appear below the search bar
4. Note how many results appear
5. Find a city filter dropdown or input (labelled something like "Grad" or "Sve lokacije")
6. Select **"Beograd"** from the dropdown
7. Observe the results list

**✅ PASS criteria:**
- After typing `a`: at least 1 result card appears (if the DB has listings)
- After selecting Beograd: results change — either fewer results appear (filtered) or 0 results with text "Nema rezultata"
- No red error messages at any point

**❌ FAIL criteria:**
- Search bar is visible but results never appear after 5 seconds
- Selecting the city filter causes a crash or blank page
- Page shows "Greška pri učitavanju" (error loading)

---

### TEST 7 — Create a new listing (Session A — User A)

**Session:** Session A
**URL:** Click the **+** (post/add) icon in the bottom nav, or navigate to `[LIVE_URL]/new`

**Steps:**
1. A form appears with fields for title, description, price, city, category, condition, and image upload
2. Fill in the fields with exactly these values:
   - Title field: type `Test oglas QA`
   - Description field: type `Ovo je test oglas koji ce biti obrisan`
   - Price field: type `1500`
   - City field: type or select `Beograd`
   - Category: click the dropdown, select any category (e.g. "Elektronika")
   - Condition: click the dropdown, select `Novo`
3. Find the image upload area — click it or click "Dodaj slike" and upload any image file from your computer (any JPG or PNG under 5MB works)
4. Wait for the image to finish uploading — a thumbnail should appear
5. Click the submit button (labelled **"Objavi oglas"** or **"Postavi oglas"**)

**✅ PASS criteria:**
- After submit, the page redirects to `[LIVE_URL]/listing/test-oglas-qa` (or similar slug)
- The listing detail page shows the title "Test oglas QA", price "1.500 RSD", city "Beograd"
- Copy the URL of this listing detail page — you will need it for Tests 8, 9, 10, 12

**❌ FAIL criteria:**
- Image upload shows an error (red text, or thumbnail never appears)
- Submit button stays spinning for more than 15 seconds
- After submit, an error appears instead of redirecting to the listing
- You stay on `/new` with a validation error — note which field caused it

---

### TEST 8 — Edit the listing

**Session:** Session A
**URL:** Navigate to `[LIVE_URL]/profile`

**Steps:**
1. You see "Moji oglasi" section with listing cards
2. Find the card for **"Test oglas QA"** (from TEST 7)
3. Below that card, there are action buttons — click the button labelled **"Izmeni"**
4. A new page opens at `[LIVE_URL]/listing/[slug]/edit`
5. Check that all form fields are pre-filled: title shows "Test oglas QA", price shows "1500", city shows "Beograd"
6. Click into the Title field, clear it, and type: `Test oglas QA — izmenjen`
7. Click the save button (labelled **"Sačuvaj izmene"** or **"Sačuvaj"**)

**✅ PASS criteria:**
- After saving, you are redirected back to the listing detail page
- The title on the listing detail page now reads **"Test oglas QA — izmenjen"** (not the old title)

**❌ FAIL criteria:**
- Edit page opens but fields are empty (pre-fill broken)
- Save button does nothing or shows a spinner that never stops
- After saving, the listing still shows the old title "Test oglas QA"
- Page shows any error text

---

### TEST 9 — Mark as sold, then reactivate

**Session:** Session A
**URL:** Navigate to `[LIVE_URL]/profile`

**Steps:**
1. Find the **"Test oglas QA — izmenjen"** card under "Moji oglasi"
2. Below the card, click the button labelled **"Prodato"**
3. Watch the buttons below that card — they should change
4. Now click the button that appeared in place of "Prodato" — it should be labelled **"Reaktiviraj"**
5. Watch the buttons change back

**✅ PASS criteria:**
- After clicking "Prodato": the button label changes to "Reaktiviraj" within 2 seconds (no page reload needed)
- After clicking "Reaktiviraj": the button label changes back to "Prodato" within 2 seconds

**❌ FAIL criteria:**
- Clicking either button does nothing visible
- Page reloads but button label stays the same
- Any error message appears

---

### TEST 10 — Delete the listing

**Session:** Session A
**URL:** Navigate to `[LIVE_URL]/profile`

**Steps:**
1. Find the **"Test oglas QA — izmenjen"** card
2. Click the button labelled **"Obriši"** (it may be styled in red)
3. A browser dialog box appears asking for confirmation with text like "Obrisati oglas?"
4. Click **OK** (or the confirm button) in that dialog

**✅ PASS criteria:**
- The listing card for "Test oglas QA — izmenjen" disappears from the profile page immediately
- Navigate back to the listing's old URL (from TEST 7) — the page shows "not found" or a 404 message, or redirects to home

**❌ FAIL criteria:**
- No confirmation dialog appears — deletion happens without warning (UX issue, report it)
- After confirming, the card is still visible in the profile
- An error message appears after clicking OK

---

### TEST 11 — Create a listing for messaging and rating tests

Before running tests 12 and 13, User A needs an active listing.

**Session:** Session A
**URL:** Navigate to `[LIVE_URL]/new`

1. Create a new listing:
   - Title: `Oglas za testiranje poruka`
   - Description: `Test`
   - Price: `500`
   - City: `Beograd`
   - Category: any
   - Condition: `Novo`
   - Upload any image
2. Click **"Objavi oglas"**
3. ✅ **Pass:** Redirected to the listing detail page. Copy this URL — you will use it in tests 12 and 13.

---

### TEST 12 — Messaging between two users

**Sessions:** Both Session A (User A) and Session B (User B) open at the same time

**In Session B (User B's incognito window):**
1. Navigate to the listing URL you copied in TEST 11
2. You see the listing detail page for "Oglas za testiranje poruka"
3. Scroll down to the seller section — find and click the button labelled **"Kontaktiraj prodavca"**
4. A message input area appears below (or a modal opens)
5. Type exactly: `Zdravo, da li je dostupno?`
6. Click the send button (a paper plane icon, or a button labelled "Pošalji")

**✅ PASS (Session B):** The message "Zdravo, da li je dostupno?" appears in the conversation area with a timestamp. The input field clears.

**Now switch to Session A (User A):**
7. Navigate to `[LIVE_URL]/messages`
8. You should see a conversation listed with User B's name

**✅ PASS (Session A):** The conversation from User B appears in the list showing the message preview "Zdravo, da li je dostupno?"

9. Click that conversation
10. You see the message. Type a reply: `Da, dostupno je!`
11. Click send

**Switch back to Session B:**
12. Look at the conversation — do NOT reload the page

**✅ PASS (real-time):** The reply "Da, dostupno je!" appears in Session B's conversation within 5 seconds WITHOUT refreshing the page

**❌ FAIL criteria (any of these = failure):**
- "Kontaktiraj prodavca" button is missing on the listing detail page
- Clicking the button does nothing
- Message fails to send (error text appears)
- Session A does not see the conversation in `/messages`
- Reply does not appear in Session B after 10 seconds even after manual page refresh

---

### TEST 13 — Seller ratings

**Sessions:** Both Session A and Session B

**In Session B (User B):**
1. Navigate to the listing URL from TEST 11 (User A's listing)
2. Scroll to the seller card section — look for a link or button labelled **"Oceni prodavca"**

**✅ PASS:** "Oceni prodavca" link is visible to User B (because User B does not own this listing)

3. Click **"Oceni prodavca"**
4. A modal/popup opens with 5 star icons and an optional comment field
5. Click the **4th star** (so 4 out of 5 stars are highlighted/filled)
6. In the comment field type: `Odličan prodavac, preporučujem!`
7. Click the button labelled **"Pošalji ocenu"** or **"Oceni"**

**✅ PASS:** Modal closes. In the seller card on the listing page, a star rating now appears showing something like **"★ 4.0 · 1 ocena"**. If the count doesn't update immediately, refresh the page — it should appear after refresh.

8. Click **"Oceni prodavca"** again (it may still be visible for a second attempt)
9. Select any stars and click submit again

**✅ PASS:** An error message appears saying something like **"Već ste ocenili"** (already rated). The rating is NOT submitted a second time.

**Switch to Session A (User A):**
10. Navigate to the listing URL from TEST 11
11. Look at the seller card — there should be NO "Oceni prodavca" link visible

**✅ PASS:** "Oceni prodavca" is NOT shown when you are the owner of the listing

**❌ FAIL criteria:**
- "Oceni prodavca" is not visible to User B on a listing owned by User A
- After submitting, no stars appear in the seller card (even after page refresh)
- Second submission does not show an error — double rating is silently accepted
- "Oceni prodavca" is visible to User A on their own listing

---

### TEST 14 — Push notifications

**Session:** Session A (User A — normal browser, not incognito)

> Push notifications require a real browser with notification permissions. They will NOT work in incognito mode.
> They will ONLY work on HTTPS — the Vercel URL is fine, localhost is not.

**Steps:**
1. Navigate to `[LIVE_URL]/search-profiles`
2. Look for a blue banner or button near the top of the page labelled **"🔔 Dozvoli notifikacije za nove oglase"**

**✅ PASS:** The blue notification button is visible

3. Click that button
4. The browser shows a permission popup at the top of the screen asking: "Allow [LIVE_URL] to send notifications?" with Allow / Block options
5. Click **"Allow"**

**✅ PASS:** The blue button disappears from the page (it only shows when permission is not yet granted)

6. Now switch to **Session B** and create a new listing in city **"Beograd"**:
   - Go to `[LIVE_URL]/new`
   - Title: `Oglas koji treba da triguje notifikaciju`
   - City: `Beograd`
   - Any other fields, upload an image, submit
7. Return to Session A's browser and wait up to 30 seconds

**✅ PASS:** A browser push notification appears in the corner of the screen (or as a system notification) with:
- Title: **"Novi oglas koji te zanima"**
- Body text containing the listing title and city

8. Click the notification

**✅ PASS:** The browser opens the new listing's page

**❌ FAIL criteria:**
- The blue button is not visible on `/search-profiles`
- Browser permission prompt never appears after clicking the button
- Blue button is still visible after clicking Allow (subscription not saved)
- No notification arrives after 30 seconds (push delivery failed)

---

### TEST 15 — Own profile editing

**Session:** Session A
**URL:** Click the Profile icon in the bottom nav, or navigate to `[LIVE_URL]/profile`

**Steps:**
1. You see your profile page with your name (or "Postavi ime" if not set), city, and two stats: "Aktivni" and "Prodato" counts
2. Find the pencil / edit icon button in the top-right of the profile card and click it
3. Input fields appear: one for name, one for city, one for bio
4. Clear the name field and type: `Test Korisnik`
5. Click the button labelled **"Sačuvaj"**

**✅ PASS criteria:**
- The edit fields disappear and the profile card now shows the name **"Test Korisnik"**
- No page reload required — update happens in place
- The stats (Aktivni, Prodato) show correct numbers reflecting your actual listings

**❌ FAIL criteria:**
- Profile page shows a loading spinner that never resolves
- Edit icon is not visible
- After clicking "Sačuvaj", name still shows old value
- Any error message appears

---

### TEST 16 — Public profile view

**Session:** Session B (User B)
**URL:** Navigate to `[LIVE_URL]/listing/[slug-from-test-11]` (User A's listing)

**Steps:**
1. On the listing detail page, find the seller card — it shows User A's name
2. Click on User A's name or avatar photo

**✅ PASS criteria:**
- Browser navigates to `[LIVE_URL]/profile/[user-id]` (a different URL from `/profile`)
- Page shows User A's name ("Test Korisnik"), their city, and a list of their active listings
- There is NO pencil/edit icon on this page (because you are User B, not the owner)
- The star rating from TEST 13 (★ 4.0) may appear here as well

**❌ FAIL criteria:**
- Clicking seller name does nothing or shows 404
- Page shows edit controls (should not be editable by User B)
- Page shows your own profile (User B's) instead of User A's

---

### TEST 17 — Report a listing

**Session:** Session B (User B)
**URL:** Navigate to any listing owned by User A

**Steps:**
1. Scroll to the bottom of the listing detail page
2. Look for a small link or button labelled **"Prijavi oglas"** (Report listing)
3. Click it
4. A modal/popup opens with a dropdown or list of report reasons (e.g. "Prevara", "Neprikladni sadržaj", etc.)
5. Select any reason from the list
6. Click the submit button (labelled "Pošalji" or "Prijavi")

**✅ PASS criteria:**
- A success message appears: something like "Hvala na prijavi" or "Oglas je prijavljen"
- The modal closes after the success message

**❌ FAIL criteria:**
- "Prijavi oglas" link is not visible on the page
- Modal does not open
- Submit causes a red error message
- Nothing happens after clicking submit

---

### TEST 18 — Admin dashboard

> **Prerequisite:** Your Supabase user must have `is_admin = true` in the database.
> **How to set it:** Navigate to `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/editor` → click the `users` table → find your user row → click the `is_admin` cell → change to `true` → click outside to save → then refresh the app.

**Session:** Session A (the admin account)
**URL:** Navigate to `[LIVE_URL]/admin`

**Steps:**
1. The admin page loads — you see two sections: a list of listings pending approval, and a list of reports

**Section A — Listing approval:**
2. Find any listing in the pending list (status: PENDING)
3. Click **"Odobri"** on one of them
4. ✅ **Pass:** That listing row disappears from the pending list within 2 seconds
5. Find another pending listing, click **"Odbij"**
6. ✅ **Pass:** That listing row also disappears

**Section B — Report resolution:**
7. Find any entry in the reports list
8. Click **"Rešeno"** on it
9. ✅ **Pass:** That report row disappears from the list

**❌ FAIL criteria:**
- Navigating to `/admin` shows a blank page, 403 error, or redirects to login
- Clicking "Odobri"/"Odbij" does nothing (buttons appear but have no effect)
- Listings or reports stay in the list after action buttons are clicked
- Any error message appears after clicking action buttons

---

### FINAL SUMMARY — Report this table back

| # | Feature tested | ✅ Pass / ❌ Fail | Notes (error text + URL if failed) |
|---|---------------|-----------------|-------------------------------------|
| 1 | App loads | | |
| 2 | Phone OTP login | | |
| 3 | Google OAuth login | | |
| 4 | Swipe deck + favorites | | |
| 5 | Grid browse + listing detail | | |
| 6 | Search + city filter | | |
| 7 | Create listing with image | | |
| 8 | Edit listing | | |
| 9 | Mark sold / reactivate | | |
| 10 | Delete listing | | |
| 11 | Create listing for messaging tests | | |
| 12 | Messaging + real-time delivery | | |
| 13 | Seller ratings + duplicate block | | |
| 14 | Push notifications | | |
| 15 | Own profile edit | | |
| 16 | Public profile view | | |
| 17 | Report a listing | | |
| 18 | Admin dashboard (approve/reject/resolve) | | |

**When done:** Paste this table with filled-in results. For any ❌ FAIL, include the exact error text shown on screen and the URL you were on.

---

## DEPLOYMENT CHECKLIST — Browser Agent Instructions

> **For:** Antigravity or any browser-automation agent.
> **Steps 1–5 are already done.** Deployment is live.
> **Stripe is skipped entirely** — do not add any Stripe env vars.
> **GitHub repo:** `https://github.com/samer-buraei/swipe-ads`

---

### ✅ STEP 1 — SQL migrations — DONE
### ✅ STEP 2 — DEMO_MODE=false — DONE
### ✅ STEP 3 — VAPID keys in .env.local — DONE
### ✅ STEP 4 — Code pushed to GitHub — DONE
### ✅ STEP 5 — Vercel project imported + env vars + deployed — DONE

---

### STEP 4 — Push all code to GitHub (terminal)

All Phase 4 code is uncommitted. Run these commands in the terminal at `C:\Users\sam\Desktop\swipemarket\`:

```bash
git add -A
git commit -m "Phase 4 complete: Phone OTP, listing management, ratings, push notifications, admin fix"
git push origin main
```

If `main` is rejected (wrong branch name), try `git push origin master`.

After pushing, verify at `https://github.com/samer-buraei/swipe-ads` that the latest commit shows the new files (`lib/push.ts`, `public/sw.js`, `app/api/push/`, `app/api/webhooks/stripe/`, `components/ratings/`, etc.)

---

### STEP 5 — Import project to Vercel (browser)

**Navigate to:** `https://vercel.com/new`

1. You will see "Import Git Repository"
2. If GitHub is not connected, click **"Connect GitHub"** and authorize Vercel to access your repositories
3. Find **`swipe-ads`** in the repository list and click **"Import"**
4. On the "Configure Project" screen:
   - **Project Name:** `swipemarket` (or leave as `swipe-ads`)
   - **Framework Preset:** should auto-detect as `Next.js` — confirm this
   - **Root Directory:** leave as `/` (default)
   - **Do NOT click Deploy yet** — you must add env vars first (Step 6)
5. Look for **"Environment Variables"** section on the same configure screen — expand it

---

### STEP 6 — Add env vars and deploy (browser, same screen as Step 5)

Still on the Vercel import/configure screen, add each variable below by clicking **"Add"** for each one:

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://awbtohtpjrqlxfoqtita.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (copy from `.env.local` — the long `eyJ...` value next to `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | (copy from `.env.local` — the `eyJ...` value next to `SUPABASE_SERVICE_ROLE_KEY`) |
| `DEMO_MODE` | `false` |
| `NEXT_PUBLIC_APP_URL` | `https://swipemarket.rs` (or your Vercel URL if no custom domain yet — you can update this later) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (copy from `.env.local`) |
| `VAPID_PRIVATE_KEY` | (copy from `.env.local`) |
| `VAPID_SUBJECT` | `mailto:admin@swipemarket.rs` |

After adding all 8 variables, click **"Deploy"**.

Wait for the build to complete — it will show a **"Congratulations"** screen with your deployment URL (e.g. `https://swipe-ads-xyz.vercel.app`).

**Note:** If you have the domain `swipemarket.rs` ready, go to Vercel → your project → Settings → Domains → add `swipemarket.rs` and follow the DNS instructions. Otherwise the Vercel URL works fine for testing.

---

### STEP 1 — Run SQL migrations in Supabase (browser — ALREADY DONE, kept for reference)

Two tables need to be created: `ratings` and `push_subscriptions`. Run them as two separate queries.

**Navigate to:** `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/sql/new`

If prompted to log in, do so first, then return to that URL.

**Query 1 — Ratings table:**

1. Click "New query" (the `+` button in the SQL Editor sidebar, or the button at the top)
2. Clear any existing content in the editor
3. Paste the following SQL exactly:

```sql
CREATE TABLE IF NOT EXISTS ratings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id   UUID REFERENCES listings(id) ON DELETE SET NULL,
  score        INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON ratings(to_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_from_user ON ratings(from_user_id);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_read" ON ratings FOR SELECT USING (true);

CREATE POLICY "ratings_insert" ON ratings FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);
```

4. Click the green **"Run"** button (or press Ctrl+Enter)
5. Confirm the result panel shows: `Success. No rows returned`

**Query 2 — Push subscriptions table:**

1. Click "New query" again to open a fresh editor
2. Paste the following SQL:

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_sub_select" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_sub_insert" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_sub_delete" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);
```

3. Click **"Run"**
4. Confirm: `Success. No rows returned`

**Verify both tables exist:**

Navigate to: `https://supabase.com/dashboard/project/awbtohtpjrqlxfoqtita/editor`

In the left panel (Table Editor), confirm you can see both `ratings` and `push_subscriptions` in the table list. If they appear, Step 1 is complete.

---

### STEP 2 — Set DEMO_MODE=false (local file edit)

Open the file: `C:\Users\sam\Desktop\swipemarket\.env.local`

Find the line:
```
DEMO_MODE="true"
```

Change it to:
```
DEMO_MODE="false"
```

Save the file. This enables real Supabase connections instead of mock data.

---

### STEP 3 — Generate VAPID keys (terminal)

Open a terminal in `C:\Users\sam\Desktop\swipemarket\` and run:

```bash
node -e "const wp = require('web-push'); const k = wp.generateVAPIDKeys(); console.log('PUBLIC:', k.publicKey); console.log('PRIVATE:', k.privateKey);"
```

The output will look like:
```
PUBLIC: BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxAA
PRIVATE: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Copy both values. Then open `.env.local` and add these three lines (replace the placeholder values):

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxAA"
VAPID_PRIVATE_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_SUBJECT="mailto:admin@swipemarket.rs"
```

Save `.env.local`. Keep the PUBLIC and PRIVATE key values copied — you will paste them into Vercel in Step 4.

---

### STEP 4 — Add environment variables to Vercel (browser)

**Navigate to:** `https://vercel.com/dashboard`

1. Find and click on the **SwipeMarket** project
2. Click the **"Settings"** tab at the top
3. In the left sidebar, click **"Environment Variables"**
4. For each variable below, click **"Add New"**, fill in the Name and Value fields, select the appropriate environments, and click **"Save"**:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `DEMO_MODE` | `false` | Production, Preview, Development |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (public key from Step 3) | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | (private key from Step 3) | Production, Preview, Development |
| `VAPID_SUBJECT` | `mailto:admin@swipemarket.rs` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sk_test_...` from Stripe Dashboard → Developers → API Keys | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` from Stripe Dashboard | Production, Preview, Development |

> **Note:** `STRIPE_WEBHOOK_SECRET` (`whsec_...`) will be added in Step 5 after the webhook is created.

5. After adding all 6 variables above, do NOT redeploy yet — wait until Step 5 adds the 7th variable.

**Where to find Stripe keys:**
- Navigate to `https://dashboard.stripe.com/test/apikeys`
- Copy the **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)

---

### STEP 5 — Configure Stripe webhook and copy secret back to Vercel (browser)

**Part A — Find your Vercel deployment URL:**

1. Navigate to `https://vercel.com/dashboard`
2. Click the SwipeMarket project
3. On the **Deployments** tab, copy the production URL (e.g. `https://swipemarket-xyz.vercel.app`)

**Part B — Create the webhook in Stripe:**

1. Navigate to: `https://dashboard.stripe.com/test/webhooks`
2. Click **"Add endpoint"**
3. In the **Endpoint URL** field, enter:
   ```
   https://YOUR-VERCEL-URL/api/webhooks/stripe
   ```
   (replace `YOUR-VERCEL-URL` with the URL from Part A)
4. Under **"Select events to listen to"**, click **"Select events"**
5. Search for `checkout.session.completed`, check the box next to it, click **"Add events"**
6. Click **"Add endpoint"** to save
7. You will be taken to the webhook detail page
8. Find the **"Signing secret"** section and click **"Reveal"**
9. Copy the full `whsec_...` value

**Part C — Add the webhook secret to Vercel:**

1. Navigate back to: `https://vercel.com/dashboard` → SwipeMarket → Settings → Environment Variables
2. Click **"Add New"**
3. Name: `STRIPE_WEBHOOK_SECRET`, Value: the `whsec_...` you copied, Environments: Production, Preview, Development
4. Click **"Save"**

**Part D — Redeploy:**

1. Navigate to the **Deployments** tab of the SwipeMarket project in Vercel
2. Click the three-dot menu (`...`) next to the most recent deployment
3. Click **"Redeploy"** → confirm
4. Wait for the deployment to show **"Ready"** status (green)

---

### VERIFICATION — Confirm everything works

After the redeployment is live, test each feature:

**Test 1 — Ratings:**
1. Navigate to your live app URL
2. Open any listing
3. Log in as a user who does NOT own that listing
4. You should see **"Oceni prodavca"** link below the seller info
5. Click it → modal opens → pick stars → submit → star rating appears on the page
6. Submit again → should get error "Već ste ocenili ovog prodavca za ovaj oglas"

**Test 2 — Push Notifications:**
1. Navigate to `/search-profiles` on the live app
2. You should see a blue button: **"🔔 Dozvoli notifikacije za nove oglase"**
3. Click it → browser asks for permission → click **Allow**
4. The button should disappear (pushStatus becomes 'granted')
5. From a different account, create a new listing in the same city
6. The first browser should receive a push notification: "Novi oglas koji te zanima"
7. Click the notification → it should open the listing page

**Test 3 — Premium Payments:**
1. Navigate to `/profile` on the live app
2. On an ACTIVE listing that is not yet premium, you should see **"★ Promoviši"** button
3. Click it → you should be redirected to Stripe's hosted checkout page
4. Use test card: `4242 4242 4242 4242`, expiry `12/34`, CVC `123`, any name/ZIP
5. Click **"Pay"** → Stripe redirects you back to the listing page with `?promoted=1`
6. Go back to `/profile` → the listing should now show **"★ Premium"** badge instead of "★ Promoviši"
7. Check the homepage swipe deck or search results → the premium listing should appear first

**If any test fails:**
- Check Vercel → Deployments → click the latest deployment → click **"Functions"** tab → check for runtime errors
- Check Stripe Dashboard → Developers → Webhooks → click your endpoint → check "Recent deliveries" for failed events
- Check Supabase Dashboard → Logs → API logs for SQL errors

---

## READ THIS FIRST — CURRENT STATE

**Project:** SwipeMarket (Serbian classifieds marketplace — Tinder-style swipe meets Halo Oglasi)
**Stack:** Next.js 14.2 + React 18.3 + tRPC 10 + Supabase + Tailwind 4 + TypeScript
**Root:** `C:\Users\sam\Desktop\swipemarket\`
**Deployment target:** Vercel + Supabase hosted PostgreSQL

---

## Phases Completed

| Phase | What was built |
|-------|---------------|
| Phase 1 | Core app — DB schema, tRPC routers, Supabase Auth (Google OAuth), swipe deck, listing cards |
| Phase 2 | Image upload (Supabase Storage), real-time messaging (Supabase Realtime), search page, category attributes from DB |
| Phase 3 | Dual currency display, user profiles, premium listing UI, branding, empty states/skeletons |
| Phase 7 | RLS enforcement, message rate limits, badge sync, search profiles fix, AI moderation activated, CI scaffolded |
| Phase 4 (partial) | Phone OTP auth, listing management UI, seller ratings (code), admin bug fix — see detail below |

---

## One Remaining Blocker

| Priority | Blocker | File | Fix |
|----------|---------|------|-----|
| P0 | `DEMO_MODE` still `"true"` | `.env.local` | Change to `"false"` — **must be done by human, not agent** |

Previously tracked blockers that are now resolved:
- ~~Prisma not in devDependencies~~ — fixed, `package.json` has `prisma ^5.22.0` in devDependencies
- ~~ESLint config broken~~ — fixed, ESLint downgraded to `^8.57.1`, `.eslintrc.json` uses `next/core-web-vitals`

---

## Phase 4 Status — Task by Task

### ✅ Phone OTP Auth (done)
Primary login method is now phone number + SMS OTP (Serbian numbers only, +381 prefix).
Google OAuth kept as a fallback option on the login page.

**Files:**
- `app/(auth)/login/page.tsx` — full rewrite, 2-step phone → OTP flow
- `server/api/routers/auth.ts` — `sendOtp`, `verifyOtp`, `addPhone` tRPC procedures
- `components/profile/PhoneVerification.tsx` — phone add/change widget on profile page
- `lib/utils.ts` — `toE164Serbian()`, `formatSerbianPhone()`, `isValidSerbianMobile()`

**How it works:**
1. User enters Serbian mobile (e.g. `064 123 4567`)
2. `toE164Serbian()` converts to `+381641234567`
3. `auth.sendOtp` calls `supabase.auth.signInWithOtp({ phone })`
4. Supabase sends SMS via their phone provider
5. User enters 6-digit code → `auth.verifyOtp` calls `supabase.auth.verifyOtp`
6. Supabase sets session cookie automatically — user is logged in

**⚠️ How to test OTP without a paid SMS provider (development only):**

Supabase has a built-in "Test Phone Numbers" feature — you can pin a specific number to always accept a fixed OTP code, no real SMS sent.

1. Go to **Supabase Dashboard → Authentication → Providers → Phone**
2. Enable the Phone provider (fill Twilio fields with placeholder values if required)
3. In the same section, find **Test Phone Numbers**
4. Add a test number: `+381641112222` with fixed OTP: `123456`
5. Save

Now you can log in with `+381641112222` / `123456` in dev without any SMS charges. Use real Twilio credentials only when deploying to production.

---

### ✅ Listing Management UI (done)
Sellers can edit, mark as sold, reactivate, and delete their own listings from the profile page.
An edit page exists at `/listing/[slug]/edit`.

**Files:**
- `app/profile/page.tsx` — added Izmeni / Prodato / Obriši buttons below each listing card
- `app/listing/[slug]/edit/page.tsx` — **new** — edit form (title, description, price, city, condition)

**How it works:**
- Profile page calls `api.listing.changeStatus` (marks SOLD/ACTIVE) and `api.listing.delete` (soft delete → status REMOVED)
- Edit page calls `api.listing.get` to pre-fill form, then `api.listing.update` on submit
- All three backend procedures already existed — this was frontend-only work

---

### ✅ Admin Dashboard Bug Fix (done)
`resolveReport` was silently failing because it sent status `'RESOLVED'` which doesn't exist in the DB enum.
Correct value is `'ACTION_TAKEN'`. Fixed in both the router and the UI.

**Files:**
- `server/api/routers/admin.ts` — input enum: `['ACTION_TAKEN', 'DISMISSED']`
- `app/admin/page.tsx` — "Rešeno" button now sends `'ACTION_TAKEN'`

---

### ⚠️ Seller Ratings — CODE DONE, SQL MIGRATION PENDING

The feature is fully implemented in code but **requires a SQL migration to be run manually in the Supabase dashboard** before it will work at runtime.

#### Step to do before testing: Run this SQL in Supabase Dashboard → SQL Editor

```sql
CREATE TABLE IF NOT EXISTS ratings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id   UUID REFERENCES listings(id) ON DELETE SET NULL,
  score        INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id, listing_id)
);

CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);
CREATE INDEX idx_ratings_from_user ON ratings(from_user_id);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_read" ON ratings FOR SELECT USING (true);

CREATE POLICY "ratings_insert" ON ratings FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);
```

**Files added:**
- `server/api/routers/rating.ts` — `create`, `list`, `summary` procedures
- `server/api/root.ts` — `rating: ratingRouter` registered
- `contracts/validators.ts` — `createRatingSchema`, `listRatingsSchema`
- `contracts/api.ts` — `RatingItem`, `RatingSummary`, `RatingsResponse`
- `prisma/schema.prisma` — `Rating` model added (for reference only — actual table is in Supabase)
- `components/ratings/RatingStars.tsx` — star display component (score + count)
- `components/ratings/RateSellerModal.tsx` — interactive star picker + comment modal
- `app/listing/[slug]/page.tsx` — wired `rating.summary` query, `RatingStars` in seller card, "Oceni prodavca" button + modal

**How it works:**
- Any logged-in user who is NOT the seller sees "Oceni prodavca" link in the seller card on listing detail
- Clicking opens `RateSellerModal` — pick 1–5 stars, optional comment, submit
- `rating.create` inserts into `ratings` table; unique constraint prevents double-rating per listing
- `rating.summary` computes average + count — shown as `RatingStars` in the seller card
- `rating.list` returns paginated ratings with reviewer info (not yet surfaced in a UI tab — future work)

---

### ❌ Push Notifications — Not started

**What this feature does:** When a user saves a search profile with "Notify me" turned on, they receive a browser push notification whenever a new listing is posted that matches their saved filters. No email, no SMS — browser web-push only.

**Approach:** Keep it inside Next.js — no Supabase Edge Functions needed. Use the `web-push` npm package server-side, called directly from the `listing.create` tRPC procedure after the listing is saved.

---

#### Step 1 — Install the web-push package

Run in terminal:
```bash
npm install web-push
npm install --save-dev @types/web-push
```

---

#### Step 2 — Generate VAPID keys (one-time setup, done by a human)

Run once in terminal:
```bash
node -e "const wp = require('web-push'); const keys = wp.generateVAPIDKeys(); console.log(keys);"
```

Copy the output into `.env.local`:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BxxxxYourPublicKeyHere..."
VAPID_PRIVATE_KEY="xxxxYourPrivateKeyHere..."
VAPID_SUBJECT="mailto:admin@swipemarket.rs"
```

Also add these to Vercel environment variables when deploying.

---

#### Step 3 — Run this SQL in Supabase Dashboard → SQL Editor

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "push_sub_select" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_sub_insert" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_sub_delete" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);
```

---

#### Step 4 — Create the subscribe API route

**File to create:** `app/api/push/subscribe/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  // body.subscription is a standard PushSubscription JSON object from the browser
  const { endpoint, keys } = body.subscription
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  }, { onConflict: 'user_id,endpoint' })

  return NextResponse.json({ success: true })
}
```

---

#### Step 5 — Create the push sender utility

**File to create:** `lib/push.ts`

```ts
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionRow,
  payload: { title: string; body: string; url: string }
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    )
  } catch (err: any) {
    // 410 = subscription expired/unsubscribed — caller should delete it
    if (err.statusCode === 410) return { expired: true }
    // Other errors are non-fatal — log and continue
    console.error('Push send failed:', err.message)
  }
  return { expired: false }
}
```

---

#### Step 6 — Wire notifications into listing.create

**File to edit:** `server/api/routers/listing.ts`

At the top of the file, add the import:
```ts
import { sendPushNotification } from '@/lib/push'
```

At the bottom of the `create` mutation, after the listing and images are saved (after the `imageRows` insert block), add:

```ts
// Fire-and-forget push notifications to matching saved searches
;(async () => {
  try {
    // Filter at DB level: only load profiles matching this listing's city.
    // Profiles with city=null mean "all cities" — .or() handles both cases.
    // This avoids loading every search profile into memory on every listing create.
    const { data: profiles } = await ctx.supabase
      .from('search_profiles')
      .select('user_id, category_ids, keywords, city')
      .eq('notify_on_new', true)
      .or(`city.is.null,city.ilike.${input.city}`)

    if (!profiles?.length) return

    // Keyword and category matching still done in JS (can't do this in PostgREST easily)
    const matchingUserIds = profiles
      .filter(p => {
        // Empty category_ids means "all categories"
        const catMatch = !p.category_ids?.length || p.category_ids.includes(input.categoryId)
        const kwMatch = !p.keywords?.length || p.keywords.some((kw: string) =>
          input.title.toLowerCase().includes(kw.toLowerCase()) ||
          input.description.toLowerCase().includes(kw.toLowerCase())
        )
        return catMatch && kwMatch
      })
      .map(p => p.user_id)
      // Don't notify the poster about their own listing
      .filter((id: string) => id !== ctx.user.id)

    if (!matchingUserIds.length) return

    // Fetch push subscriptions for matching users
    const { data: subs } = await ctx.supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', matchingUserIds)

    if (!subs?.length) return

    const listingUrl = `/listing/${slug}`
    for (const sub of subs) {
      const result = await sendPushNotification(sub, {
        title: 'Novi oglas koji te zanima',
        body: `${input.title} — ${input.city}`,
        url: listingUrl,
      })
      // Clean up expired subscriptions
      if (result?.expired) {
        await ctx.supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }
  } catch (e) {
    // Never let push notification errors break listing creation
    console.error('Push notification error:', e)
  }
})()
```

---

#### Step 7 — Add the browser-side subscription UI

**File to edit:** `app/search-profiles/page.tsx`

Add a "Dozvoli notifikacije" (Allow notifications) button. This only needs to be shown once to get the browser permission. Add this component inside the page:

```tsx
// Add near the top of the component (after existing imports):
const [pushStatus, setPushStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown')

useEffect(() => {
  if ('Notification' in window) setPushStatus(Notification.permission as any)
}, [])

const handleEnablePush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Vaš pregledač ne podržava notifikacije.')
    return
  }
  const permission = await Notification.requestPermission()
  setPushStatus(permission as any)
  if (permission !== 'granted') return

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub }),
  })
}

// Add in JSX (above the list of search profiles):
{pushStatus !== 'granted' && (
  <button
    onClick={handleEnablePush}
    className="w-full bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl py-3 text-sm font-medium mb-4"
  >
    🔔 Dozvoli notifikacije za nove oglase
  </button>
)}
```

---

#### Step 8 — Add the service worker (required for web-push)

**File to create:** `public/sw.js`

This file must be at the root URL `/sw.js` — that's why it goes in `public/`.

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'SwipeMarket', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
```

Then register the service worker in `app/layout.tsx` (client-side, in a `useEffect`):

```tsx
// In the root layout or providers.tsx, add this effect:
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error)
  }
}, [])
```

---

#### Known limitations (acceptable for MVP, fix post-launch)
- **Browser pre-prompt:** Calling `Notification.requestPermission()` directly on button click can trigger browser warnings. Post-MVP: show a custom modal explaining the benefit first, then call `requestPermission()` from the modal's confirm button.
- **Logout unsubscribe:** If a user logs out, their service worker still exists and will receive pushes. Post-MVP: call `DELETE /api/push/subscribe` with the current subscription on `supabase.auth.signOut()`. Not critical for MVP since clicking a received notification just opens the listing URL.

#### Testing Push Notifications
1. Set the 3 VAPID env vars in `.env.local`
2. Run `npm run dev`
3. Go to `/search-profiles` → click "Dozvoli notifikacije" → browser asks permission → click Allow
4. Create a new listing (from another browser tab or user) in a matching category
5. You should receive a browser notification: "Novi oglas koji te zanima"
6. Click the notification → opens the listing page
7. Run `npx tsc --noEmit` — must pass with zero errors

---

### ❌ Premium Payments — Not started

**What this feature does:** Sellers can pay to "promote" a listing, which sets `is_premium = true`. Premium listings appear first in search results and swipe deck (already sorted by `is_premium` in `listing.ts`), and show an amber "Premium" badge (already styled in `ListingCard`). The backend is ready — only the payment flow and UI trigger are missing.

**Approach:** Stripe Checkout (redirect-based, no card UI needed in the app). Seller clicks "Promoviši oglas" → redirected to Stripe's hosted checkout → pays → Stripe webhook fires → listing gets `is_premium = true`.

---

#### Step 1 — Install Stripe

```bash
npm install stripe @stripe/stripe-js
```

---

#### Step 2 — Add env vars to `.env.local`

```bash
STRIPE_SECRET_KEY="sk_test_..."         # From Stripe Dashboard → Developers → API Keys
STRIPE_WEBHOOK_SECRET="whsec_..."       # Created when you set up the webhook endpoint (Step 5)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Also from Stripe Dashboard
```

---

#### Step 3 — Create the checkout session route

**File to create:** `app/api/checkout/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId } = await req.json()
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

  // Verify the listing belongs to this user
  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, slug')
    .eq('id', listingId)
    .eq('user_id', user.id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'rsd',
        product_data: {
          name: `Premium oglas: ${listing.title}`,
          description: '30 dana na vrhu pretrage i swipe špila',
        },
        unit_amount: 49900, // 499 RSD in paras (smallest unit)
      },
      quantity: 1,
    }],
    mode: 'payment',
    // Pass listing ID through so the webhook knows what to promote
    metadata: { listingId: listing.id, userId: user.id },
    success_url: `${appUrl}/listing/${listing.slug}?promoted=1`,
    cancel_url: `${appUrl}/profile`,
  })

  return NextResponse.json({ url: session.url })
}
```

---

#### Step 4 — Create the Stripe webhook handler

**File to create:** `app/api/webhooks/stripe/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const listingId = session.metadata?.listingId
    if (!listingId) return NextResponse.json({ received: true })

    // Use service role to bypass RLS — this is a server webhook, not a user action
    const adminSupabase = createServiceRoleClient()

    // Idempotency check: Stripe has at-least-once delivery — webhook can fire more than once.
    // If the listing is already premium and hasn't expired, skip the update.
    const { data: existing } = await adminSupabase
      .from('listings')
      .select('is_premium, featured_until')
      .eq('id', listingId)
      .single()

    if (existing?.is_premium && existing?.featured_until && new Date(existing.featured_until) > new Date()) {
      // Already processed — acknowledge and exit
      return NextResponse.json({ received: true })
    }

    const premiumUntil = new Date()
    premiumUntil.setDate(premiumUntil.getDate() + 30)

    const { error: updateError } = await adminSupabase
      .from('listings')
      .update({
        is_premium: true,
        featured_until: premiumUntil.toISOString(),
      })
      .eq('id', listingId)

    // If DB update fails, return 500 so Stripe retries the webhook automatically
    if (updateError) {
      console.error('Webhook: failed to update listing premium status', updateError)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
```

---

#### Step 5 — Set up the Stripe webhook (done by a human in Stripe Dashboard)

1. Go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://your-vercel-domain.vercel.app/api/webhooks/stripe`
3. Select event: `checkout.session.completed`
4. Copy the **Signing secret** → paste as `STRIPE_WEBHOOK_SECRET` in `.env.local` and Vercel env vars

For local testing, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook secret it prints → set as STRIPE_WEBHOOK_SECRET
```

---

#### Step 6 — Add the "Promoviši oglas" button to the profile page

**File to edit:** `app/profile/page.tsx`

Add a `handlePromote` function near the other handlers:

```tsx
const handlePromote = async (listingId: string) => {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId }),
  })
  const { url } = await res.json()
  if (url) window.location.href = url  // redirect to Stripe Checkout
}
```

Then in the listing action buttons section (next to the Izmeni / Prodato / Obriši buttons already there), add for non-premium active listings:

```tsx
{listing.status === 'ACTIVE' && !listing.isPremium && (
  <button
    onClick={() => handlePromote(listing.id)}
    className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 rounded-xl py-2 font-medium hover:bg-amber-100"
  >
    ★ Promoviši
  </button>
)}
{listing.isPremium && (
  <span className="text-xs bg-amber-100 text-amber-700 px-3 rounded-xl py-2 font-medium">
    ★ Premium
  </span>
)}
```

---

#### Testing Premium Payments
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (copy the webhook secret to `.env.local`)
3. Run `npm run dev`
4. Go to `/profile` → click "★ Promoviši" on an ACTIVE listing
5. You should be redirected to Stripe's hosted checkout page
6. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
7. After paying, Stripe redirects to `/listing/[slug]?promoted=1`
8. The `checkout.session.completed` webhook fires → listing gets `is_premium = true`
9. Go to `/profile` — the listing should now show "★ Premium" badge instead of "★ Promoviši"
10. Check the swipe deck or search results — premium listing should appear first
11. Run `npx tsc --noEmit` — must pass with zero errors

**Important:** The Stripe webhook will NOT fire if the local server is not reachable. Always run `stripe listen` in a second terminal when testing payments locally.

---

## Architecture Overview

```
prisma/schema.prisma         ← DB shape reference (source of truth for model names/fields)
      ↓
contracts/validators.ts      ← Zod input schemas (used by tRPC routers for input validation)
      ↓
contracts/api.ts             ← TypeScript response types (used everywhere — routers + components)
      ↓
server/api/routers/*.ts      ← tRPC procedures (all business logic lives here)
server/api/root.ts           ← Registers all routers into appRouter
server/api/helpers.ts        ← toListingCard(), toListingDetail() — DB row → frontend type transforms
      ↓
app/**/page.tsx              ← Next.js pages ('use client' unless pure server layout)
components/**/*.tsx          ← UI components consuming tRPC hooks
```

**Contract-First Rule:** Contracts are defined first. No agent touches `contracts/` without updating both `validators.ts` AND `api.ts` together. The Prisma schema is the naming reference for DB columns — never write SQL that contradicts it.

---

## Agent Definitions

### ARCHITECT AGENT

**When to use:** Adding new data models, designing new API contracts, making tech decisions, resolving cross-agent conflicts.

**Files owned:**
- `prisma/schema.prisma`
- `contracts/validators.ts`
- `contracts/api.ts`
- `CLAUDE.md`, `AGENTS.md`

**Files never modified by others without approval:**
- Any file in `contracts/`
- `prisma/schema.prisma`

**Prompt template:**
```
You are the Architect Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace (Tinder swipe + classifieds)
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2, Supabase (Auth/Storage/Realtime/DB), Prisma 5
ROOT: C:\Users\sam\Desktop\swipemarket\
AUTH: Supabase Auth (Google OAuth + Phone OTP) — no NextAuth, no Docker
DB: Supabase hosted PostgreSQL — use supabase client, not raw Prisma queries
TASK: [describe task]

Before making changes:
1. Read prisma/schema.prisma and contracts/validators.ts and contracts/api.ts
2. Check if change is backward compatible
3. If schema changes: write a migration SQL for supabase/migrations/
4. Update both validators.ts AND api.ts together — never one without the other
5. Document which routers and components need to be updated
```

---

### BACKEND AGENT

**When to use:** Implementing or modifying tRPC procedures, fixing API logic, integrating external services.

**Files owned:**
- `server/api/routers/*.ts`
- `server/api/helpers.ts`
- `server/api/root.ts`
- `server/api/trpc.ts`
- `lib/moderation.ts`
- `lib/utils.ts`
- `app/api/**/*.ts`

**Prompt template:**
```
You are the Backend Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace (Tinder swipe + classifieds)
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2, Supabase (Auth/Storage/Realtime/DB), Prisma 5
ROOT: C:\Users\sam\Desktop\swipemarket\
AUTH: Supabase Auth (Google OAuth + Phone OTP) — no NextAuth, no Docker
DB: Supabase hosted PostgreSQL — use supabase client, never raw Prisma queries
TASK: [describe task]

Rules:
1. Always validate input using Zod schemas from contracts/validators.ts
2. Always return types matching contracts/api.ts — never return undocumented shapes
3. Never modify contracts/ files — request that from Architect Agent
4. Use ctx.supabase (createServerSupabaseClient) for all user-scoped queries — RLS is enforced
5. Use createServiceRoleClient() ONLY inside admin.ts procedures
6. tRPC v10: throw TRPCError for errors, use protectedProcedure for auth-required endpoints
7. Mutation state in components uses isLoading (NOT isPending — that is tRPC v11)

Before implementing:
- Read prisma/schema.prisma for exact field names
- Check existing patterns in other routers for consistency
```

**Standard protected procedure pattern:**
```typescript
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { mySchema } from '@/contracts/validators'
import type { MyResponseType } from '@/contracts/api'
import { ERRORS } from '@/lib/constants'

export const myRouter = createTRPCRouter({
  doThing: protectedProcedure
    .input(mySchema)
    .mutation(async ({ ctx, input }): Promise<MyResponseType> => {
      // ctx.user.id = logged-in user's ID
      // ctx.supabase = Supabase client with RLS
      const { data, error } = await ctx.supabase
        .from('my_table')
        .insert({ user_id: ctx.user.id, ...input })
        .select()
        .single()

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ERRORS.GENERIC_ERROR })
      return { success: true }
    }),
})
```

After creating a new router, always register it in `server/api/root.ts`:
```typescript
import { myRouter } from './routers/my'
export const appRouter = createTRPCRouter({
  // ...existing...
  my: myRouter,
})
```

---

### FRONTEND AGENT

**When to use:** Building UI components, implementing pages, wiring tRPC hooks to UI, handling form state and navigation.

**Files owned:**
- `app/**/*.tsx` (all pages)
- `components/**/*.tsx`
- `lib/hooks/*.ts`
- `app/globals.css`

**Files never modified:**
- `components/ui/*` — base UI primitives, do not touch
- `contracts/*` — read only

**Prompt template:**
```
You are the Frontend Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace (Tinder swipe + classifieds)
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2, Supabase (Auth/Storage/Realtime/DB)
ROOT: C:\Users\sam\Desktop\swipemarket\
AUTH: Supabase Auth (Google OAuth + Phone OTP)
UI LANGUAGE: Serbian — all user-facing text must be in Serbian
TASK: [describe task]

Rules:
1. Always use types from contracts/api.ts for API response shapes
2. Always handle loading, error, and empty states — never leave a blank white screen
3. Never call Supabase directly from components for data — use tRPC hooks
4. Use createClient() from lib/supabase/client.ts only for auth state (getUser, signOut)
5. Add 'use client' directive to any component using hooks, event handlers, or browser APIs
6. Mobile-first: every component must work on 375px screen
7. tRPC v10 mutations use isLoading, not isPending

Component checklist before marking done:
[ ] Props interface defined with TypeScript
[ ] Loading state: skeleton or spinner
[ ] Error state: Serbian error message
[ ] Empty state: Serbian message explaining what to do
[ ] Mobile responsive (tested at 375px)
[ ] No hardcoded English strings
```

**Standard component pattern:**
```typescript
'use client'
import { api } from '@/lib/trpc'

interface Props {
  categoryId: string
}

export function ListingGrid({ categoryId }: Props) {
  const { data, isLoading, error } = api.listing.list.useQuery({ categoryId, limit: 20 })

  if (isLoading) return <ListingGridSkeleton />
  if (error) return <p className="text-center text-red-500 py-8">Greška pri učitavanju</p>
  if (!data?.items.length) return (
    <div className="text-center py-16 text-gray-400">
      <p>Nema oglasa u ovoj kategoriji</p>
    </div>
  )

  return (
    <div className="grid grid-cols-2 gap-3">
      {data.items.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
```

---

### QA AGENT

**When to use:** Writing tests, verifying completed features, identifying edge cases, running CI.

**Files owned:**
- `tests/*.spec.ts` (Playwright E2E)
- `test/*.test.ts` (Vitest unit)
- `playwright.config.ts`
- `vitest.config.ts`

**Prompt template:**
```
You are the QA Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace
STACK: Next.js 14.2, tRPC 10, Supabase, Vitest, Playwright
ROOT: C:\Users\sam\Desktop\swipemarket\
TASK: [describe what to test]

Test requirements:
1. Every tRPC procedure needs a happy path unit test
2. Every mutation needs an invalid input test
3. Critical user flows need E2E tests (see critical flows below)
4. Run npm run typecheck first — must be 0 errors before any test is written

Critical flows to cover:
1. Phone OTP sign-in → lands on home screen with swipe deck
2. Swipe right → listing appears in /favorites
3. Create listing with 3 photos → listing visible in grid with images
4. Open listing → tap Kontaktiraj → message sent → appears in /messages
5. Search for term → results appear → apply filter → results narrow
6. Profile edit → save → refresh → changes persist
7. Edit own listing → change title → confirm change on listing detail page
8. Mark listing as sold → card shows Reaktiviraj button
9. Rate seller → stars appear on listing detail page

Phase 4 smoke test checklist:
[ ] Phone OTP login completes (Supabase sends SMS, code verifies, session is set)
[ ] Edit listing form pre-fills correctly from existing data
[ ] Mark as sold → listing status changes in DB
[ ] Delete listing → listing no longer appears in profile
[ ] Rate seller → rating stored → average star count shows on listing page
[ ] Rating blocked on own listing (error message shown)
[ ] Admin resolve report → report disappears from queue (was broken, now fixed)
```

---

### DEVOPS AGENT

**When to use:** Fixing CI pipeline, configuring Vercel deployment, running Supabase migrations, managing environment variables.

**Files owned:**
- `.github/workflows/ci.yml`
- `supabase/migrations/*.sql`
- `next.config.ts`

**Prompt template:**
```
You are the DevOps Agent for SwipeMarket.

PROJECT: SwipeMarket — Serbian classifieds marketplace
STACK: Next.js 14.2, Supabase hosted PostgreSQL, Vercel deployment, GitHub Actions CI
ROOT: C:\Users\sam\Desktop\swipemarket\
TASK: [describe task]

Infrastructure:
- Deployment: Vercel (not Hetzner, not Coolify, not Docker)
- Database: Supabase hosted (awbtohtpjrqlxfoqtita.supabase.co)
- Storage: Supabase Storage bucket 'listing-images'
- Auth: Supabase Auth (Google OAuth + Phone OTP configured in Supabase dashboard)
- CI: GitHub Actions (.github/workflows/ci.yml)

Current CI pipeline:
1. Checkout code
2. Setup Node.js 20 with npm cache
3. npm ci
4. npm run typecheck (tsc --noEmit)
5. npm run test:unit (Vitest)
6. Install Playwright browsers
7. npm run test:e2e (Playwright)

Security checklist:
[ ] SUPABASE_SERVICE_ROLE_KEY only used in server/api/routers/admin.ts
[ ] No secrets in code or committed files
[ ] Vercel env vars set for production (DEMO_MODE=false, NEXT_PUBLIC_APP_URL=https://swipemarket.rs)
[ ] Supabase RLS policies active on all tables (including new 'ratings' table)
[ ] listing-images bucket is public read, authenticated write only

Pending migration to run in Supabase (ratings table — see Phase 4 section above for full SQL):
- CREATE TABLE ratings (...)
- RLS policies for ratings
```

---

## Parallel Work — What Can Run Simultaneously

```
Architect defines contracts
        │
        ├── Backend Agent implements routers
        └── Frontend Agent builds UI with mock types

                    (merge when both done)

QA Agent writes tests against merged implementation
DevOps Agent fixes CI pipeline (independent of above)
```

**Safe to run in parallel:**
- Frontend + Backend (after contracts are defined)
- DevOps + any other agent (infra is independent)
- QA writing tests + any feature agent

**Must be sequential:**
- Architect defines contracts → THEN Backend + Frontend start
- Feature complete → THEN QA verifies
- SQL migration run → THEN ratings feature testable

---

## Handoff Protocol

When one agent blocks on another, leave this at the top of `SESSION_NOTES.md`:

```markdown
## HANDOFF: [From] → [To]

**Task:** Brief description
**Why blocked:** Specific reason
**Files to read:** List of relevant files
**Expected output:** What the receiving agent should produce
**Return to:** What the sending agent will do once unblocked
```

---

## Session Notes Format

Create or update `SESSION_NOTES.md` at the end of every session:

```markdown
# Session Notes — [YYYY-MM-DD] — [Agent Type]

## Completed This Session
- [x] Task description (file changed: path/to/file.ts)

## In Progress (not finished)
- Task name: what's done, what remains, why stopped

## Blocked
- Task name: waiting on [agent] for [specific thing]

## Verified Working (manually tested)
- Feature: what was tested and confirmed

## Known Issues Found
- Issue: description + workaround if any

## Next Session Should Start With
1. First priority
2. Second priority
```

---

## Context Loading Guide

Load only what you need. Don't paste the entire codebase into context.

| Agent | Always load | Load when relevant |
|-------|------------|-------------------|
| Architect | `prisma/schema.prisma`, `contracts/*.ts` | The router you're designing for |
| Backend | `prisma/schema.prisma`, `contracts/*.ts`, target router | `server/api/trpc.ts`, related routers |
| Frontend | `contracts/api.ts`, target component/page | Related components, `lib/trpc.ts` |
| QA | Test target files, `contracts/*.ts` | Implementation files |
| DevOps | `.github/workflows/ci.yml`, `package.json` | App code rarely |

**Minimum context header for any session (paste at the top of your prompt):**
```
PROJECT: SwipeMarket — Serbian classifieds marketplace (Tinder swipe meets Halo Oglasi)
STACK: Next.js 14.2, React 18.3, TypeScript, Tailwind 4, tRPC 10.45.2, Supabase (Auth/Storage/Realtime/DB)
ROOT: C:\Users\sam\Desktop\swipemarket\
AUTH: Supabase Auth, Google OAuth + Phone OTP — NO NextAuth, NO Docker, NO Prisma queries (Supabase client only)
PHASE: Phase 4 — push notifications and premium payments not yet started (see AGENTS.md)
CRITICAL: tRPC v10 — use isLoading not isPending on mutations
CURRENT SESSION GOAL: [your specific task here]
```

---

## What Must Never Change Without Architect Approval

1. `prisma/schema.prisma` — any model or enum change requires a Supabase migration SQL
2. `contracts/validators.ts` — changing a schema breaks all callers
3. `contracts/api.ts` — changing a response type breaks all components consuming it
4. `lib/supabase/types.ts` — regenerate via Supabase CLI, don't hand-edit
5. Stack versions — Next.js 14.2, React 18.3, tRPC 10.45.2 are pinned intentionally

---

## Common Mistakes to Avoid

| Mistake | Why it breaks | Correct approach |
|---------|--------------|-----------------|
| Using `isPending` on mutation | tRPC v10 doesn't have this | Use `isLoading` |
| `createServiceRoleClient()` in a user router | Bypasses RLS — security hole | Use `createServerSupabaseClient()` |
| Writing UI text in English | App is Serbian-language | All strings in Serbian |
| Querying Supabase directly from a React component | Bypasses tRPC type safety | Use tRPC hooks via `api.*` |
| Skipping loading/error/empty states | White screen on slow connections | All three states required |
| Adding features to `components/ui/*` | These are base primitives | Create in `components/listings/`, `components/ratings/`, etc. |
| Using `'RESOLVED'` as report status | Not a valid enum value in DB | Use `'ACTION_TAKEN'` or `'DISMISSED'` |
| Importing `ratingRouter` without running ratings SQL | Runtime error — table doesn't exist | Run SQL migration first |
| Forgetting to register new router in `root.ts` | tRPC won't expose the endpoints | Add import + entry to `appRouter` in `server/api/root.ts` |
