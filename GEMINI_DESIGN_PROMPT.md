# SwipeList Design Brief for Gemini

> **Project:** SwipeList - Tinder-style Marketplace for Serbia
> **Goal:** Elevate the UI/UX to Red Dot Design Award standards
> **Target:** Web + Mobile responsive application

---

## Design Context

SwipeList is a classified ads platform with a unique Tinder-like swipe interface. Users can browse listings traditionally (grid) or swipe through cards (right = save, left = skip). The app is for the Serbian market with Serbian language UI.

### Current Tech Stack
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion (animations)
- shadcn/ui components
- Lucide React icons

### Current Visual Style
- Warm beige background (#f6f1ea)
- White glassmorphic cards (bg-white/70, backdrop-blur)
- Black text with opacity variations
- Rounded corners (2xl, 3xl)
- Fonts: Sora (body), Fraunces (display)

---

## Red Dot Award Design References (2022-2024 Winners)

Study these award-winning web designs for inspiration:

### 1. **Porsche Design System** (Red Dot 2024)
- Ultra-clean typography hierarchy
- Generous whitespace
- Micro-interactions on every interactive element
- Subtle gradients and shadows
- Reference: https://www.porsche.com/designsystem

### 2. **Apple Human Interface** (Red Dot 2023)
- Depth through layered translucency
- Fluid animations (spring physics)
- Consistent visual rhythm
- Bold typography paired with minimal UI
- Reference: https://developer.apple.com/design/human-interface-guidelines

### 3. **Stripe Dashboard** (Red Dot 2023)
- Information density without clutter
- Sophisticated color palette
- Seamless transitions between states
- Clear visual hierarchy
- Reference: https://stripe.com/blog/dashboard

### 4. **Linear App** (Red Dot 2024)
- Keyboard-first but beautiful
- Dark/light mode excellence
- Micro-animations everywhere
- Purple accent color system
- Reference: https://linear.app

### 5. **Vercel Design System** (Red Dot 2023)
- Geometric precision
- Black & white with accent
- Hover states that feel alive
- Loading states as experiences
- Reference: https://vercel.com/design

### 6. **Airbnb Experiences** (Red Dot 2022)
- Emotional imagery
- Card-based layouts
- Smooth scrolling experiences
- Warm, inviting color palette
- Reference: https://www.airbnb.com/experiences

### 7. **Figma Interface** (Red Dot 2024)
- Contextual UI that adapts
- Playful but professional
- Rainbow gradient accents
- Collaborative indicators
- Reference: https://www.figma.com

### 8. **Notion Design** (Red Dot 2023)
- Calm, focused aesthetic
- Typography as design
- Subtle shadows and borders
- Empty states as opportunities
- Reference: https://www.notion.so

---

## Design Tasks

### Task 1: Color System Refinement

**Current:** Warm beige with black text
**Goal:** A more sophisticated, award-worthy palette

Consider:
- Primary brand color (beyond just black)
- Accent color for CTAs and highlights
- Success/error/warning states in Serbian context
- Dark mode support
- Gradient usage (subtle, Apple-style)

**Deliverables:**
- CSS variables for all colors
- Light and dark mode variants
- Color usage guidelines

---

### Task 2: Typography Hierarchy

**Current:** Sora + Fraunces
**Goal:** Clear, elegant type system

Consider:
- Heading scales (h1-h6)
- Body text sizes
- Caption and label styles
- Price display (make it pop)
- Serbian character support (čćšđž)

**Deliverables:**
- Tailwind typography config
- Font pairing rationale
- Example usage in key screens

---

### Task 3: Swipe Card Redesign

**Current:** Basic card with image + text overlay
**Goal:** Delightful, tactile card experience

Study: Tinder, Bumble, Hinge card designs

Consider:
- Card depth and shadows
- Image treatment (gradients, overlays)
- Information hierarchy on card
- Swipe indicator overlays (LIKE/SKIP)
- Animation physics (spring, damping)
- Card stack appearance
- Gesture feedback (haptic-feel visuals)

**Deliverables:**
- New SwipeDeck component design
- Animation specifications
- Mobile gesture guidelines

---

### Task 4: Grid Card Component

**Current:** Basic card with image and details
**Goal:** Scannable, beautiful listing cards

Consider:
- Image aspect ratio optimization
- Hover/tap states
- Favorite button placement
- Price badge design
- Condition badge design
- Seller avatar integration
- Loading skeleton design

**Deliverables:**
- ListingCard component redesign
- Grid spacing and rhythm
- Responsive breakpoint specs

---

### Task 5: Navigation & Layout

**Current:**
- Mobile: Fixed bottom nav (5 items)
- Desktop: Sticky header

**Goal:** Navigation that feels native

Consider:
- Navigation transitions
- Active state indicators
- Badge for unread messages
- FAB for "Post Listing" on mobile
- Breadcrumbs on desktop
- Search bar prominence

**Deliverables:**
- Header redesign
- BottomNav redesign
- Navigation animation specs

---

### Task 6: Form Design

**Current:** Basic inputs with Tailwind
**Goal:** Forms that are a pleasure to use

Study: Linear, Stripe, Notion form patterns

Consider:
- Input field styling
- Focus states
- Error states with Serbian messages
- Multi-step form flow
- Image upload UX
- Category selection (visual)
- Dynamic field transitions

**Deliverables:**
- Input component designs
- Form layout patterns
- Validation state designs

---

### Task 7: Empty States & Loading

**Current:** Basic loading text
**Goal:** Delightful waiting experiences

Consider:
- Skeleton loaders (shimmer effect)
- Empty state illustrations
- First-time user guidance
- Error recovery UI
- Pull-to-refresh indicator

**Deliverables:**
- Skeleton component designs
- Empty state illustrations
- Loading animation specs

---

### Task 8: Micro-interactions

**Goal:** Every interaction feels alive

Study: Framer Motion, Lottie animations

Consider:
- Button press feedback
- Card hover effects
- Toggle animations
- Toast notifications
- Modal transitions
- Page transitions
- Scroll-triggered animations

**Deliverables:**
- Interaction design specs
- Framer Motion code snippets
- Animation timing guidelines

---

### Task 9: Messaging Interface

**Current:** Basic message bubbles
**Goal:** WhatsApp/iMessage quality chat

Consider:
- Message bubble design
- Time stamps and read receipts
- Message input field
- Emoji/attachment options
- Typing indicator
- Listing context card in chat

**Deliverables:**
- Chat UI design
- Input component design
- Animation specs

---

### Task 10: Mobile-First Polish

**Goal:** Native app feel in browser

Consider:
- Safe area handling
- Gesture navigation support
- Pull-to-refresh
- Swipe-back navigation
- Keyboard handling
- Touch target sizes (min 44px)
- Haptic feedback hints

**Deliverables:**
- Mobile-specific CSS
- Gesture implementation guide
- PWA manifest recommendations

---

## Visual Guidelines

### Do's
- Use generous whitespace (like Apple)
- Embrace asymmetry where it adds interest
- Use shadows to create depth, not borders
- Make CTAs unmissable
- Design for thumb reach on mobile
- Use motion to guide attention
- Make loading states beautiful
- Design empty states with care

### Don'ts
- No harsh borders (use shadows/opacity)
- No pure black on white (soften to near-black)
- No jarring color transitions
- No static feeling buttons
- No ignored error states
- No placeholder-quality designs
- No accessibility afterthoughts

---

## Serbian Market Considerations

- Currency: RSD (Serbian Dinar) and EUR
- Cities: Beograd, Novi Sad, Niš, Kragujevac, Subotica...
- Trust signals: Verified sellers, phone numbers
- Common categories: Vehicles, Real Estate, Electronics
- Cultural: Warm, personal, relationship-based commerce
- Language: Use Serbian everywhere, no English fallbacks

---

## Deliverables Summary

1. **Color System** - CSS variables, dark mode
2. **Typography** - Scale, fonts, Serbian support
3. **Swipe Cards** - Card design, animations
4. **Grid Cards** - Listing card component
5. **Navigation** - Header, bottom nav, transitions
6. **Forms** - Inputs, validation, multi-step
7. **Empty States** - Illustrations, copy
8. **Micro-interactions** - Animation specs
9. **Messaging** - Chat UI, input
10. **Mobile Polish** - Native feel, gestures

---

## Files to Modify

| Design Area | Files |
|-------------|-------|
| Colors | `styles/globals.css`, `tailwind.config.ts` |
| Typography | `app/layout.tsx`, `tailwind.config.ts` |
| Swipe Cards | `components/listings/SwipeDeck.tsx` |
| Grid Cards | `components/listings/ListingCard.tsx` |
| Navigation | `components/layout/Header.tsx`, `BottomNav.tsx` |
| Forms | `app/new/page.tsx`, `components/ui/*.tsx` |
| Animations | Add to any component with Framer Motion |

---

## Success Criteria

The redesigned SwipeList should:
1. Feel like a native mobile app
2. Be instantly recognizable as premium quality
3. Make swiping through ads genuinely fun
4. Build trust through professional design
5. Stand up to Red Dot Award scrutiny
6. Work flawlessly on mobile and desktop

---

*This brief is for Gemini or any designer/AI to create award-winning UI for SwipeList.*
