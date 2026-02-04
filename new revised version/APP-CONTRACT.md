# SWIPEMARKET APP CONTRACT v1.0
## Paste This Into Every LLM Prompt

---

## Project Summary
SwipeMarket: Serbian classifieds app (like KupujemProdajem) with Tinder-style swiping.

**Tech Stack**: Expo + React Native + NativeWind + Supabase + TypeScript

---

## Non-Negotiable Requirements

### Code Quality
- TypeScript strict mode - NO `any` types allowed
- All components must be functional with hooks
- All async operations must have error handling
- All lists must use cursor-based (keyset) pagination

### User Experience
- Optimistic updates for all swipe actions (instant feedback)
- Haptic feedback on swipe completion (expo-haptics)
- Skeleton loaders for all async content
- Error boundaries around every screen
- Toast notifications for errors with retry option

### Internationalization
- All user-facing text via i18n: `t('key')` or `tBilingual({sr, en})`
- Never hardcode Serbian or English strings in components
- Date/number formatting must respect language setting

### Data Validation
- All form submissions validated with Zod before API call
- All JSONB attributes validated against category schema
- All user inputs sanitized

### Media Handling
- Images: Compress to max 1200px, quality 0.8, WebP preferred
- Videos: MUST compress to 720p/30fps before upload (max ~20MB for 60s)
- Generate blurhash for all images

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `listing-card.tsx` |
| Components | PascalCase | `ListingCard` |
| Hooks | camelCase + use | `useListings` |
| Types/Interfaces | PascalCase | `Listing` (not `IListing`) |
| Constants | SCREAMING_SNAKE | `MAX_IMAGES` |
| Database columns | snake_case | `created_at` |
| TypeScript props | camelCase | `createdAt` |

---

## Navigation Structure

```
app/
├── (auth)/           # Unauthenticated
│   ├── login
│   ├── register
│   └── forgot-password
├── (tabs)/           # Main authenticated
│   ├── index         # Home (swipe feed)
│   ├── search
│   ├── post
│   ├── messages
│   └── profile
├── listing/[id]      # Listing detail
├── conversation/[id] # Chat
├── post/             # Multi-step posting
│   ├── category
│   ├── details
│   ├── attributes
│   ├── media
│   ├── location
│   └── preview
└── settings/
```

**Modals** (bottom sheets, not screens):
- FilterBottomSheet
- ContactModal
- ShareModal
- ReportModal

---

## Pagination Standard

```typescript
// ALL list queries use cursor-based pagination
interface PaginatedRequest {
  cursor?: string;      // ID of last item
  limit?: number;       // Default 20
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Query pattern
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['listings', filters],
  queryFn: ({ pageParam }) => fetchListings({ cursor: pageParam, limit: 20 }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

---

## Error Handling Standard

```typescript
// Network errors → Toast + retry
if (error instanceof NetworkError) {
  Toast.show({
    type: 'error',
    text1: t('errors.networkError'),
    text2: t('common.retry'),
    onPress: () => refetch(),
  });
}

// Validation errors → Inline field errors
if (error instanceof ValidationError) {
  setFieldError(error.field, error.message);
}

// Auth errors → Redirect to login
if (error instanceof AuthError) {
  signOut();
  navigate('/login');
}

// Unknown errors → Log + generic toast
console.error('Unknown error:', error);
Toast.show({ type: 'error', text1: t('errors.unknownError') });
```

---

## Component Structure

```typescript
// Standard component template
import { View, Text } from 'react-native';
import { useLanguage } from '@/i18n';

interface MyComponentProps {
  // Props here
}

export function MyComponent({ ...props }: MyComponentProps) {
  const { t, language } = useLanguage();
  
  // Hooks at top
  // Event handlers
  // Render
  
  return (
    <View className="...">
      {/* Use t() for all text */}
    </View>
  );
}
```

---

## MVP Scope (V1)

### In Scope
- Swipe: 2-direction (Left/Right) + Contact/Maybe buttons
- Categories: 5 (Cars, Apartments, Phones, Fashion, Other)
- Media: Images (10 max) + Video (60s, compressed)
- Search: Text + category filters + location
- Messages: Basic real-time chat
- Auth: Email + Google

### Out of Scope (V2)
- Full 5-direction swipe gestures
- 15+ categories
- AI recommendations
- Push notifications
- Seller verification badges
- Payment integration

---

## Key Files Reference

| Need | Location |
|------|----------|
| Database schema | `supabase/migrations/001_initial_schema.sql` |
| TypeScript types | `src/types/index.ts` |
| Zod schemas | `src/types/schemas.ts` |
| API hooks | `src/hooks/` |
| UI components | `src/components/ui/` |
| Translations | `src/i18n/translations/` |

---

## Testing Checklist (Run Before Completion)

- [ ] TypeScript compiles with no errors: `npx tsc --noEmit`
- [ ] Component renders without crash
- [ ] Dark mode works
- [ ] Serbian text displays correctly (č, ć, š, ž, đ)
- [ ] Loading state shows skeleton
- [ ] Error state shows message + retry
- [ ] Empty state shows appropriate message
