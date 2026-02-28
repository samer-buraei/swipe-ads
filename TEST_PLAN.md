# SwipeMarket — Test Plan & Pass Criteria
**Last updated:** 2026-02-28
**Stack:** Vitest (unit), Playwright (E2E)
**Run all tests:** `npm run test`

---

## Current Test Coverage (as of Phase 7)

| Area | Unit Tests | E2E Tests | Status |
|------|-----------|-----------|--------|
| `toListingCard` helper | ✅ 2 tests | — | Passing |
| Homepage loads | — | ✅ 1 test | Passing |
| Public profile routing | — | ✅ 1 test | Passing |
| New listing form | — | ⚠️ Skipped (needs auth) | Not run |
| Admin guard | — | ⚠️ Skipped (needs auth) | Not run |
| Search profiles | — | ⚠️ Skipped (needs auth) | Not run |
| Auth flow | ❌ Missing | ❌ Missing | **Gap** |
| Image upload | ❌ Missing | ❌ Missing | **Gap** |
| Messaging / Realtime | ❌ Missing | ❌ Missing | **Gap** |
| Swipe events | ❌ Missing | ❌ Missing | **Gap** |
| Favorites | ❌ Missing | ❌ Missing | **Gap** |
| Search + filters | ❌ Missing | ❌ Missing | **Gap** |
| Ratings (Phase 4) | ❌ Not built | ❌ Not built | Phase 4 |
| Payments (Phase 4) | ❌ Not built | ❌ Not built | Phase 4 |

---

## Unit Tests — `test/api.test.ts`

Run with: `npm run test:unit`
Framework: Vitest

### Existing Tests (keep, do not remove)

**`toListingCard` — full mapping**
- Input: complete mock DB row with images and seller
- Asserts: all fields mapped correctly, heroImage picks correct image, isFavorited set

**`toListingCard` — no images**
- Input: DB row with empty `listing_images: []`
- Asserts: `heroImage` is null, `isFavorited` is undefined when not passed

### Tests to Add (Phase 3 gaps)

**`lib/utils.ts` — phone formatting**
```typescript
describe('toE164Serbian', () => {
  it('converts 0641234567 to +381641234567')
  it('converts "064 123 4567" to +381641234567')
  it('leaves +381641234567 unchanged')
  it('handles 065 prefix (Telenor)')
  it('handles 066 prefix (VIP)')
})

describe('formatSerbianPhone', () => {
  it('formats +381641234567 as "064 123 4567"')
})

describe('isValidSerbianMobile', () => {
  it('accepts +381641234567')
  it('rejects landline +381111234567')
  it('rejects non-Serbian number +447911123456')
})
```

**`server/api/helpers.ts` — listing helpers**
```typescript
describe('buildListingFilters', () => {
  it('returns empty object when no filters given')
  it('includes categoryId filter when provided')
  it('includes price range when both min and max given')
  it('includes city filter when provided')
  it('excludes swiped listings when excludeSwiped=true and userId given')
})
```

**`lib/moderation.ts` — content moderation**
```typescript
describe('moderateText', () => {
  it('returns isApproved=true for clean listing text')
  it('returns isApproved=false for flagged content')
  it('degrades gracefully when OPENAI_API_KEY is missing')
})
```

### Pass Criteria for Unit Tests

```
[ ] npm run test:unit exits with code 0
[ ] All tests pass — no skips except tests explicitly marked .skip with a reason comment
[ ] No test takes longer than 2 seconds (pure unit, no network calls)
[ ] Test file has at least 10 test cases covering utils, helpers, and moderation
```

---

## E2E Tests — `tests/e2e.spec.ts`

Run with: `npm run test:e2e`
Framework: Playwright
Requires: `npm run dev` running on http://localhost:3000 with DEMO_MODE=false and valid Supabase credentials

### Existing Tests (keep, do not remove)

**Homepage loads and shows exchange rate**
- Navigates to http://localhost:3000/
- Waits for network idle
- Asserts: page title is "SwipeMarket - Prodaj i kupi brzo"

**Public profile routing resolves**
- Navigates to `/listing/zimski-kaput`
- Waits for network idle
- Takes screenshot

### Critical Flow Tests to Add

**AUTH — Google OAuth (requires test Supabase user)**

Since Google OAuth cannot be automated (Google blocks it), use Supabase magic link or test credentials:

```typescript
test.describe('Authentication', () => {
  test('Login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Nastavi sa Google')).toBeVisible()
    await expect(page.getByPlaceholder(/telefon/i)).toBeVisible()
  })

  test('Unauthenticated user redirected from /new to /login', async ({ page }) => {
    await page.goto('/new')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Unauthenticated user redirected from /messages to /login', async ({ page }) => {
    await page.goto('/messages')
    await expect(page).toHaveURL(/\/login/)
  })
})
```

**LISTINGS — Public browsing**

```typescript
test.describe('Listing browsing', () => {
  test('Home page shows listing cards', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // At least one listing card should be visible
    const cards = page.locator('[data-testid="listing-card"]')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  test('Listing detail page loads for valid slug', async ({ page }) => {
    await page.goto('/listing/zimski-kaput')
    await page.waitForLoadState('networkidle')
    // Should show title or redirect — no 500 error
    await expect(page.locator('h1, [data-testid="listing-title"], text=nije dostupan')).toBeVisible()
  })

  test('Search page renders with search bar', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByPlaceholder(/pretraži/i)).toBeVisible()
  })

  test('Search returns results for common term', async ({ page }) => {
    await page.goto('/search?q=kaput')
    await page.waitForLoadState('networkidle')
    // Either results or "Nema rezultata" — not an error screen
    await expect(page.locator('text=oglasa, text=Nema rezultata').first()).toBeVisible({ timeout: 8000 })
  })
})
```

**NAVIGATION — Mobile layout**

```typescript
test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Bottom nav is visible on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible()
  })

  test('All bottom nav tabs are tappable', async ({ page }) => {
    await page.goto('/')
    const tabs = ['/', '/quick-browse', '/new', '/favorites', '/messages']
    for (const tab of tabs) {
      await page.locator(`[href="${tab}"]`).click()
      await page.waitForLoadState('networkidle')
    }
  })
})
```

**ADMIN — Guard**

```typescript
test('Admin page redirects unauthenticated users', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  // Should either redirect to login or show access denied
  const isRedirected = page.url().includes('/login')
  const isBlocked = await page.locator('text=Nema pristupa, text=Unauthorized').isVisible()
  expect(isRedirected || isBlocked).toBe(true)
})
```

### Pass Criteria for E2E Tests

```
[ ] npm run test:e2e exits with code 0
[ ] Homepage loads in under 5 seconds (networkidle)
[ ] All unauthenticated redirect tests pass
[ ] Search page renders and returns results or empty state (no 500 errors)
[ ] Mobile viewport tests pass at 375×812
[ ] No test marked .skip without a documented reason comment
[ ] Screenshots saved to tests/screenshots/ for visual review
[ ] Playwright report generated in playwright-report/ (gitignored)
```

---

## Manual Smoke Test Checklist

Run this manually on every deployment to staging before promoting to production.
Check each box only after you personally verify it works in a real browser.

### Authentication
```
[ ] Google OAuth sign-in completes — user lands on home screen
[ ] User profile (name, avatar) appears in the app after sign-in
[ ] Sign out clears session — user is redirected to /login
[ ] Refreshing the page after sign-in keeps the session alive
[ ] Unauthenticated users cannot access /new, /messages, /favorites (redirected to /login)
```

### Listings — Create
```
[ ] Navigate to /new — form loads with all fields
[ ] Selecting a category (e.g. Vozila) shows dynamic attribute fields (Marka, Model, Godište)
[ ] Uploading 3 images shows thumbnails immediately with "Naslovna" badge on first
[ ] Submitting form creates listing and redirects to the new listing's detail page
[ ] New listing appears on home screen swipe deck
[ ] New listing appears on /quick-browse grid
[ ] Listing images load from Supabase Storage (not placeholder)
[ ] Attempting to submit without an image shows validation error in Serbian
[ ] Creating 6th listing in one day shows rate limit error in Serbian
```

### Listings — Browse & Swipe
```
[ ] Home screen swipe deck shows real listings from Supabase
[ ] Swiping right saves the listing to /favorites
[ ] Swiping left hides the listing (does not reappear in same session)
[ ] Swiping up navigates to the listing detail / starts contact flow
[ ] Empty state shows when all listings have been swiped
[ ] Premium listings show amber ⭐ PREMIUM badge
[ ] Prices show in RSD and EUR side by side (e.g. "5.000 RSD / ≈43 €")
```

### Listings — Detail
```
[ ] Tapping a listing card opens the detail page at /listing/[slug]
[ ] All images visible in a scrollable gallery
[ ] Seller name, avatar, and verification badge visible
[ ] "Kontaktiraj prodavca" button visible (only when not the owner)
[ ] Listing owner sees Edit and Mark as Sold buttons (Phase 4)
```

### Search
```
[ ] Typing in the header search bar navigates to /search?q=term
[ ] Results update immediately when query changes
[ ] Filter panel opens on tapping Filteri button
[ ] Selecting a category filter narrows results
[ ] Price range filter works
[ ] Removing a filter chip restores broader results
[ ] "Nema rezultata" shown with Serbian message when no matches
```

### Messaging
```
[ ] Tapping "Kontaktiraj prodavca" creates a conversation and redirects to /messages/[id]
[ ] Typing and sending a message shows it immediately in the chat view
[ ] Opening /messages shows all conversations in the left panel
[ ] Unread badge count is correct
[ ] Opening a conversation clears the unread badge
[ ] Messages from the other party appear in real time (Supabase Realtime)
[ ] Sending a message to yourself is blocked (can't message own listing)
```

### Profile
```
[ ] /profile shows current user's name, email/phone, city, bio
[ ] Editing profile fields and saving persists after page refresh
[ ] /profile/[userId] shows public read-only profile of another user
[ ] Public profile shows that user's active listings
```

### Moderation
```
[ ] Listing with obviously offensive text is rejected with moderation error
[ ] Moderation error is shown in Serbian
[ ] Clean listing goes through without moderation flag
[ ] (Optional) Listing with explicit image is rejected if Sightengine configured
```

### Performance
```
[ ] Home screen swipe deck loads in under 3 seconds on a mobile connection (4G simulation)
[ ] Images load as thumbnails (400px wide), not full-size originals
[ ] No obvious layout shift (CLS) when listings load
```

---

## CI Pipeline Pass Criteria

The GitHub Actions pipeline (`.github/workflows/ci.yml`) must be fully green before any merge to `main`.

```
[ ] Step 1 — npm ci: installs without errors
[ ] Step 2 — npm run typecheck: 0 TypeScript errors
[ ] Step 3 — npm run test:unit: all Vitest tests pass
[ ] Step 4 — npm run test:e2e: all Playwright tests pass (no skips with failures)
[ ] Step 5 — npm run lint: 0 ESLint errors (after fixing eslint.config.mjs)
```

**Merge policy:** No code merges to `main` if CI is red. Fix the pipeline before merging.

---

## How to Add a Test (for agents)

### Adding a unit test

```typescript
// test/api.test.ts
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('does the expected thing', () => {
    const result = myFunction(input)
    expect(result).toEqual(expectedOutput)
  })
})
```

### Adding an E2E test

```typescript
// tests/e2e.spec.ts
import { test, expect } from '@playwright/test'

test('User can do X', async ({ page }) => {
  await page.goto('http://localhost:3000/some-page')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Expected content')).toBeVisible()
})
```

### Test naming convention

- Unit test files: `test/*.test.ts`
- E2E test files: `tests/*.spec.ts`
- Both snake_case filenames, describe block matches the module/feature name
