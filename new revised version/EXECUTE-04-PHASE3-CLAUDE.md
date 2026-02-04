# EXECUTE: PHASE 3 - SCREEN SPECIFICATIONS (Claude) - UPDATED v2

## MVP Scope Update
- Reduced from 40+ screens to ~25 screens
- Merged settings screens into single screen
- Filters and report are modals, not screens
- Swipe model: 2-direction (Left/Right) + buttons for Contact/Maybe

## Instructions

1. Open Claude (claude.ai)
2. **Paste APP-CONTRACT.md first**
3. Paste `types.ts` from Phase 2 as context
4. Execute Prompt 3A
5. Save output as `screens.md`

---

## PROMPT 3A: Complete Screen Specifications

Copy everything below and paste into Claude:

```
# Task: Define Complete Screen Specifications for SwipeMarket

## Context
SwipeMarket is a Serbian classifieds app with Tinder-style swiping. Define every screen the app needs with precise specifications for the UI team.

## TypeScript Types Reference
[PASTE YOUR types.ts HERE]

## App Features

**MVP Swipe Model (V1):**
```
         ┌─────────────────────────┐
         │                         │
← LEFT   │      SWIPE CARD         │   RIGHT →
 NOPE    │                         │    LIKE
         │  ┌─────────┬─────────┐  │
         │  │[Maybe ?]│[Contact]│  │  ← BUTTONS
         │  └─────────┴─────────┘  │
         └─────────────────────────┘
         DoubleTap = Navigate to Details
```

1. **2-Direction Swipe + Buttons**: Right=Like, Left=Nope, Buttons for Contact/Maybe, DoubleTap=Details
2. **Dynamic Forms**: Category-specific attributes when posting
3. **Dynamic Filters**: Category-specific filters (bottom sheet modal)
4. **Bilingual**: Serbian (primary) + English
5. **Dual Currency**: RSD + EUR display
6. **Media**: Images + TikTok-style short videos (60s max, 720p compressed)
7. **Haptic Feedback**: On every swipe completion

## Output Format

For EACH screen, provide:

```yaml
screen_id: unique-kebab-case-id
name:
  sr: "Serbian Name"
  en: "English Name"
route: "/path/[params]"
auth: required | optional | none
tab: home | search | post | messages | profile | null
data:
  fetch:
    - queryName(params)
  params:
    - paramName: type
  realtime:
    - subscriptionName
components:
  - ComponentName
  - ComponentName
actions:
  - "Action description"
navigation:
  from: [screen-ids that navigate here]
  to: [screen-ids this navigates to]
layout: |
  Brief ASCII layout or description
notes: |
  Important behavior notes
```

## Required Screens (~25 for MVP)

### ONBOARDING & AUTH (4 screens)
1. **splash** - App loading screen with logo
2. **login** - Email/password + Google OAuth
3. **register** - Email/password + Google OAuth
4. **forgot-password** - Email input for reset

### MAIN TABS (5 screens)
5. **home** - Swipe card stack with category selector + filter button
   - Actions: Swipe Left (Nope), Swipe Right (Like), Maybe button, Contact button, DoubleTap (Details)
   - Haptic feedback on each swipe
6. **search** - Category grid + search bar (combines category-browse)
7. **post** - Entry point for posting flow (or resume draft)
8. **messages** - Conversation list with unread badges
9. **profile** - User info, stats, favorites count, my listings link, settings

### LISTING SCREENS (3 screens)
10. **listing-detail** - Full listing view with images, video, attributes
    - Actions: Like, Contact, Share, Report (modal)
11. **seller-profile** - Public seller view with their listings
12. **search-results** - Grid of listings (navigated from search)

### POST LISTING FLOW (6 screens)
13. **post-category** - Category tree selection
14. **post-details** - Title, description, price
15. **post-attributes** - Dynamic form based on category (Zod validated)
16. **post-media** - Photo grid + video upload (720p compression)
17. **post-location** - City selector + optional map
18. **post-preview** - Review before publishing

### USER COLLECTIONS (3 screens)
19. **favorites** - Liked listings grid
20. **maybe-list** - Maybe listings grid  
21. **my-listings** - User's listings with status tabs (active/sold/expired)

### MESSAGING (2 screens)
22. **conversation** - Chat view with messages (real-time)
23. **new-conversation** - Start conversation for listing

### SETTINGS (2 screens)
24. **settings** - All settings in one screen (language, currency, notifications, account)
25. **edit-profile** - Edit profile info

### MODALS (Not separate screens - bottom sheets)
- **FilterBottomSheet** - Dynamic filters based on category
- **ReportModal** - Report listing form
- **ShareModal** - Share listing options
- **ContactModal** - Contact seller options
- **ImageGallery** - Fullscreen image viewer (overlay)
- **VideoPlayer** - Fullscreen video player (overlay)

## Detailed Specifications Required

For each screen, include:

### Data Requirements
- What queries to run on mount
- What realtime subscriptions needed
- What route params expected

### Components Used
List specific component names that will be built:
- SwipeCardStack
- CategoryGrid
- DynamicForm
- FilterBottomSheet
- ListingCard
- etc.

### User Actions
Every tappable action and what it does:
- "Tap listing card" → navigate to listing-detail
- "Swipe right" → record like action
- etc.

### Layout Description
Brief description or ASCII art of layout:
```
┌─────────────────────────┐
│ [Category Selector]     │
├─────────────────────────┤
│                         │
│    [Swipe Card Stack]   │
│                         │
├─────────────────────────┤
│ [Undo] [Filter] [Sort]  │
└─────────────────────────┘
```

### Behavior Notes
- Loading states
- Empty states
- Error states
- Edge cases

## Output

Provide a comprehensive `screens.md` file with all ~25 screens fully specified. This document will be used by Gemini to build the actual UI components.

Target length: 1500-2000 lines covering every screen in detail.

**MVP Swipe Actions to Document:**
- Swipe RIGHT → Like (Medium haptic)
- Swipe LEFT → Nope (Light haptic)
- Maybe BUTTON → Add to Maybe list (Soft haptic)
- Contact BUTTON → Navigate to new-conversation (Soft haptic)
- Double Tap → Navigate to listing-detail
```

---

## After Phase 3

You should have:
- `screens.md` - Complete screen specifications (~1500-2000 lines)

**Validation Checklist:**
- [ ] All ~25 MVP screens specified
- [ ] Swipe actions reflect 2-direction + buttons model
- [ ] Every screen has data requirements
- [ ] Every screen has component list
- [ ] Every screen has actions list
- [ ] Navigation flow is complete (no dead ends)
- [ ] Both languages mentioned where relevant
- [ ] Loading/empty/error states noted
- [ ] Haptic feedback noted for swipe actions

**Next**: Proceed to EXECUTE-05-PHASE4-GEMINI.md (UI Components)

**Note**: After Phase 3, you can run Phase 4 (Gemini) and Phase 5 (ChatGPT) in PARALLEL to save time.
