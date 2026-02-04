# EXECUTE: PHASE 4 - UI COMPONENTS (Gemini) - UPDATED v2

## Changes from v1
- ✅ MVP: 2-direction swipe (Left/Right) + buttons for Contact/Maybe
- ✅ Added haptic feedback requirement
- ✅ Added skeleton loaders requirement
- ✅ Emphasized optimistic UI patterns

## Instructions

1. Open Gemini (gemini.google.com)
2. **Paste APP-CONTRACT.md first** with every prompt
3. **Paste types.ts** with every prompt
4. Execute prompts in order: 4A → 4B → 4C → 4D → 4E
5. Save outputs to correct folders

---

## PROMPT 4B: Swipe Card System (UPDATED - MVP)

This is the MOST CRITICAL prompt. The swipe system is the core UX.

```
# Task: Build 2-Direction Swipe Card System (MVP)

## App Contract
[PASTE APP-CONTRACT.md HERE]

## TypeScript Types
[PASTE types.ts HERE]

## CRITICAL MVP REQUIREMENTS

### Swipe Model for V1 (Stability First)

For MVP, we implement ONLY 2-direction swipe (Left/Right) with buttons for other actions:

```
         ┌─────────────────────────┐
         │                         │
← LEFT   │      SWIPE CARD         │   RIGHT →
 NOPE    │                         │    LIKE
         │  ┌─────────┬─────────┐  │
         │  │[Maybe ?]│[Contact]│  │  ← BUTTONS
         │  └─────────┴─────────┘  │
         └─────────────────────────┘
```

**Why 2-direction only for MVP:**
- 5-direction gestures have high crash risk (gesture conflicts, especially on Android)
- 2-direction is proven stable (Tinder model)
- Buttons are reliable and accessible
- V2 will unlock full 5-direction after stability proven

### Haptic Feedback (REQUIRED)

Every swipe completion MUST have haptic feedback:

```typescript
import * as Haptics from 'expo-haptics';

// On swipe RIGHT (Like) - satisfying medium impact
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// On swipe LEFT (Nope) - subtle light impact
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On button press (Maybe/Contact) - soft feedback
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

// On undo - notification feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

### Optimistic Updates (REQUIRED)

Card must fly off IMMEDIATELY on swipe, not wait for server:

```typescript
// In parent component using the swipe stack
const handleSwipe = async (listing: Listing, action: SwipeAction) => {
  // 1. IMMEDIATELY animate card out (optimistic)
  // 2. IMMEDIATELY show next card
  // 3. Fire API call in background
  // 4. On error: show toast + add "Undo" option
  
  // The mutation handles rollback via React Query
  recordSwipeMutation.mutate({ listingId: listing.id, action });
};
```

## Components to Build

### 1. SwipeCard Component

```tsx
interface SwipeCardProps {
  listing: Listing;
  language: 'sr' | 'en';
  currency: 'RSD' | 'EUR';
  onMaybePress: () => void;    // Button action
  onContactPress: () => void;  // Button action
}
```

Card Layout:
```
┌─────────────────────────────────┐
│ [●●●○○] Image indicator         │
│                                 │
│         [LISTING IMAGE]         │
│      (tap sides to cycle)       │
│                                 │
├─────────────────────────────────┤
│ ░░░ Gradient overlay ░░░░░░░░░░ │
│ BMW 320d 2019                   │
│ €15,000 · Beograd               │
│ 85,000 km · Diesel · Manual     │
├─────────────────────────────────┤
│ [? Maybe]         [💬 Contact]  │  ← Action buttons
└─────────────────────────────────┘
```

Features:
- Full-bleed image with gradient overlay
- Tap left/right sides to cycle through images
- Dot indicator for image position
- 2-3 key attributes visible
- Action buttons at bottom

### 2. SwipeOverlay Component

```tsx
interface SwipeOverlayProps {
  direction: 'left' | 'right' | null;
  progress: number;  // 0-1 based on swipe distance
}
```

Only TWO overlays for MVP:
- **Right (Like)**: Green heart icon, "LIKE" text, scale up as you swipe
- **Left (Nope)**: Red X icon, "NOPE" text, scale up as you swipe

```tsx
// Overlay appears based on swipe direction
// Opacity = progress (0 at center, 1 at threshold)
// Icon scale = 0.5 + (progress * 0.7)

<Animated.View 
  style={{ opacity: progress }}
  className="absolute inset-0 items-center justify-center"
>
  {direction === 'right' && (
    <View className="bg-success-500/80 p-6 rounded-full">
      <Heart size={64} color="white" fill="white" />
    </View>
  )}
  {direction === 'left' && (
    <View className="bg-danger-500/80 p-6 rounded-full">
      <X size={64} color="white" />
    </View>
  )}
</Animated.View>
```

### 3. SwipeCardStack Component

```tsx
interface SwipeCardStackProps {
  listings: Listing[];
  onSwipe: (listing: Listing, action: 'like' | 'nope') => void;
  onMaybe: (listing: Listing) => void;
  onContact: (listing: Listing) => void;
  onCardTap: (listing: Listing) => void;  // Navigate to detail
  onEmpty: () => void;
  isLoading?: boolean;
  language: 'sr' | 'en';
  currency: 'RSD' | 'EUR';
}

interface SwipeCardStackRef {
  swipeLeft: () => void;   // Programmatic swipe
  swipeRight: () => void;
  undo: () => void;        // Restore last card
}
```

Behavior:
- Stack shows 3 cards (top visible, 2 behind at 95%/90% scale)
- Horizontal swipe only (no vertical)
- Swipe threshold: 120px
- Max rotation: 15 degrees
- Spring animation on release
- Expose imperative methods via ref

### 4. UndoButton Component

```tsx
interface UndoButtonProps {
  visible: boolean;
  onPress: () => void;
  lastAction: 'like' | 'nope';
}
```

- Floating button in bottom-left
- Shows for 5 seconds after swipe
- Hides on new swipe
- Different icon/color based on lastAction

### 5. SwipeEmptyState Component

```tsx
interface SwipeEmptyStateProps {
  onChangeFilters: () => void;
  onChangeCategory: () => void;
  language: 'sr' | 'en';
}
```

Shows when no more cards:
- "Nema više oglasa" / "No more listings"
- "Probaj druge filtere" / "Try different filters"
- Buttons to change filters or category

### 6. SwipeCardSkeleton Component

Skeleton loader matching SwipeCard dimensions:
- Animated shimmer effect
- Same layout as real card
- Shows while initial data loads

## Animation Specifications

### Swipe Gesture
```typescript
const SWIPE_THRESHOLD = 120;  // pixels to trigger action
const MAX_ROTATION = 15;       // degrees

// Rotation based on horizontal position
const rotation = interpolate(
  translateX.value,
  [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
  [-MAX_ROTATION, 0, MAX_ROTATION]
);

// On release
if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
  // Animate out + haptic + callback
  runOnJS(Haptics.impactAsync)(
    translateX.value > 0 
      ? Haptics.ImpactFeedbackStyle.Medium 
      : Haptics.ImpactFeedbackStyle.Light
  );
  translateX.value = withSpring(
    translateX.value > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
    { damping: 15, stiffness: 150 }
  );
} else {
  // Spring back to center
  translateX.value = withSpring(0);
}
```

### Stack Animation
```typescript
// Cards behind scale up as top card moves
const scale = interpolate(
  Math.abs(translateX.value),
  [0, SWIPE_THRESHOLD],
  [0.95, 1],
  Extrapolate.CLAMP
);
```

## Dependencies

```json
{
  "expo-haptics": "~12.x",
  "react-native-reanimated": "~3.x",
  "react-native-gesture-handler": "~2.x",
  "lucide-react-native": "^0.x"
}
```

## Output Structure

```
components/swipe/
├── SwipeCard.tsx
├── SwipeCardStack.tsx
├── SwipeOverlay.tsx
├── SwipeEmptyState.tsx
├── SwipeCardSkeleton.tsx
├── UndoButton.tsx
├── useSwipeGesture.ts      # Reanimated gesture hook
├── constants.ts            # SWIPE_THRESHOLD, etc.
└── index.ts
```

## Example Usage

```tsx
function HomeScreen() {
  const stackRef = useRef<SwipeCardStackRef>(null);
  const { data: listings, fetchMore } = useSwipeFeed();
  const recordSwipe = useRecordSwipe();
  const { language, currency } = useSettings();
  
  const handleSwipe = (listing: Listing, action: 'like' | 'nope') => {
    // Optimistic - card already animated out
    recordSwipe.mutate({ listingId: listing.id, action });
  };
  
  const handleMaybe = (listing: Listing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    recordSwipe.mutate({ listingId: listing.id, action: 'maybe' });
    stackRef.current?.swipeLeft(); // Remove from stack
  };
  
  const handleContact = (listing: Listing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    recordSwipe.mutate({ listingId: listing.id, action: 'contact' });
    navigation.navigate('NewConversation', { listingId: listing.id });
  };
  
  return (
    <View className="flex-1">
      <SwipeCardStack
        ref={stackRef}
        listings={listings}
        onSwipe={handleSwipe}
        onMaybe={handleMaybe}
        onContact={handleContact}
        onCardTap={(l) => navigation.navigate('ListingDetail', { id: l.id })}
        onEmpty={fetchMore}
        language={language}
        currency={currency}
      />
      <UndoButton 
        visible={recordSwipe.canUndo}
        onPress={() => stackRef.current?.undo()}
      />
    </View>
  );
}
```

## V2 Preview (Future)

In V2, we'll add:
- Swipe UP for Contact
- Swipe DOWN for Maybe
- Double-tap for Quick View
- 3D tilt effect based on touch position

But for MVP, keep it simple and stable with 2-direction + buttons.

Provide complete, production-ready code with 60fps animations and haptic feedback.
```

---

## Other Phase 4 Prompts

**4A (Design System)**: Same as v1, but add:
- Skeleton component requirement
- Dark mode MUST work for all components

**4C (Dynamic Forms)**: Same as v1, but add:
- Integration with Zod schemas from Phase 2
- Form state persistence to AsyncStorage

**4D (Filters)**: Same as v1

**4E (Categories & Search)**: Same as v1, but add:
- Skeleton loaders for category grid and search results

---

## Next: Proceed to EXECUTE-06-PHASE5-GPT.md
