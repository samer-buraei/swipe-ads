# EXECUTE: PHASE 6B - CORE SCREENS (Claude)

## Context

Phase 6A created the skeleton. Now we implement the actual screens with full logic.

## Instructions

1. Open Claude (claude.ai)
2. **Paste APP-CONTRACT.md first**
3. Paste: types.ts, schemas.ts, and component summaries from Phase 4
4. Execute the prompt below
5. Save screens to app/ folder

---

## PROMPT 6B: Core Screen Implementations

```
# Task: Implement Core SwipeMarket Screens

## App Contract
[PASTE APP-CONTRACT.md HERE]

## Types Reference
[PASTE types.ts HERE]

## Available Components (from Phase 4)
- SwipeCardStack, SwipeCard, UndoButton (from components/swipe/)
- DynamicForm, AttributeField (from components/forms/)
- FilterBottomSheet, PriceFilter, LocationFilter (from components/filters/)
- CategoryGrid, SubcategoryList, SearchHeader (from components/categories/)
- ListingCard, ListingGrid (from components/search/)
- Button, TextInput, Select, Badge, Skeleton, etc. (from components/ui/)

## Available Hooks (from Phase 5)
- useAuth, useCurrentUser
- useSwipeFeed, useListing, useSearchListings, useMyListings
- useRecordSwipe, useFavorites, useMaybes
- useCategories, useCategoryAttributes
- useConversations, useSendMessage
- useLanguage (t, tBilingual)

## Priority Screens to Implement

### 1. Home Screen (Swipe Feed) - MOST IMPORTANT

```typescript
// app/(tabs)/index.tsx
import { useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { SwipeCardStack, SwipeCardStackRef, UndoButton, SwipeCardSkeleton } from '@/components/swipe';
import { CategorySelector } from '@/components/categories';
import { FilterButton } from '@/components/filters';
import { useSwipeFeed, useRecordSwipe } from '@/hooks/useListings';
import { useLanguage } from '@/i18n';

export default function HomeScreen() {
  const router = useRouter();
  const stackRef = useRef<SwipeCardStackRef>(null);
  const { t, language, currency } = useLanguage();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [lastAction, setLastAction] = useState<'like' | 'nope'>('nope');
  
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage 
  } = useSwipeFeed({ categoryId: selectedCategory });
  
  const recordSwipe = useRecordSwipe();
  
  const handleSwipe = (listing: Listing, action: 'like' | 'nope') => {
    // Haptic feedback
    Haptics.impactAsync(
      action === 'like' 
        ? Haptics.ImpactFeedbackStyle.Medium 
        : Haptics.ImpactFeedbackStyle.Light
    );
    
    // Record swipe (optimistic update in hook)
    recordSwipe.mutate({ listingId: listing.id, action });
    
    // Show undo button
    setLastAction(action);
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 5000);
  };
  
  const handleMaybe = (listing: Listing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    recordSwipe.mutate({ listingId: listing.id, action: 'maybe' });
    stackRef.current?.swipeLeft(); // Remove from stack visually
  };
  
  const handleContact = (listing: Listing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    recordSwipe.mutate({ listingId: listing.id, action: 'contact' });
    router.push(`/conversation/new?listingId=${listing.id}`);
  };
  
  const handleUndo = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    stackRef.current?.undo();
    setShowUndo(false);
    // Undo mutation would restore the swipe action
  };
  
  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-neutral-900 p-4">
        <SwipeCardSkeleton />
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-2">
        <CategorySelector
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <FilterButton 
          onPress={() => router.push('/filters')}
          activeCount={0}
        />
      </View>
      
      {/* Swipe Stack */}
      <View className="flex-1">
        <SwipeCardStack
          ref={stackRef}
          listings={data?.listings || []}
          onSwipe={handleSwipe}
          onMaybe={handleMaybe}
          onContact={handleContact}
          onCardTap={(l) => router.push(`/listing/${l.id}`)}
          onEmpty={() => hasNextPage && fetchNextPage()}
          language={language}
          currency={currency}
        />
      </View>
      
      {/* Undo Button */}
      <UndoButton
        visible={showUndo}
        onPress={handleUndo}
        lastAction={lastAction}
      />
    </View>
  );
}
```

### 2. Listing Detail Screen

```typescript
// app/listing/[id].tsx
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Heart, MessageCircle, Share2, Flag, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useListing, useRecordSwipe } from '@/hooks/useListings';
import { Button, Badge, Skeleton } from '@/components/ui';
import { ImageGallery } from '@/components/media';
import { AttributeList } from '@/components/listing';
import { useLanguage } from '@/i18n';
import { formatPrice, timeAgo } from '@/utils/format';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, language, currency } = useLanguage();
  
  const { data: listing, isLoading, error } = useListing(id);
  const recordSwipe = useRecordSwipe();
  
  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recordSwipe.mutate({ listingId: id, action: 'like' });
  };
  
  const handleContact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    recordSwipe.mutate({ listingId: id, action: 'contact' });
    router.push(`/conversation/new?listingId=${id}`);
  };
  
  if (isLoading) {
    return <ListingDetailSkeleton />;
  }
  
  if (error || !listing) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-danger-500">{t('errors.listingNotFound')}</Text>
        <Button onPress={() => router.back()}>{t('common.back')}</Button>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Image Gallery */}
      <ImageGallery 
        media={listing.media}
        onBack={() => router.back()}
      />
      
      <ScrollView className="flex-1">
        {/* Title & Price */}
        <View className="p-4">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            {listing.title}
          </Text>
          <Text className="text-3xl font-bold text-primary-500 mt-2">
            {formatPrice({ 
              amount: listing.price || 0, 
              currency: listing.priceCurrency || 'RSD',
              language 
            })}
            {listing.isNegotiable && (
              <Text className="text-sm text-neutral-500"> · {t('listing.negotiable')}</Text>
            )}
          </Text>
          
          <View className="flex-row items-center mt-2">
            <Text className="text-neutral-500">
              {listing.city} · {timeAgo(listing.createdAt, language)}
            </Text>
          </View>
        </View>
        
        {/* Key Attributes */}
        <View className="px-4 py-2">
          <AttributeList 
            attributes={listing.attributes}
            categoryId={listing.categoryId}
            language={language}
          />
        </View>
        
        {/* Description */}
        {listing.description && (
          <View className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <Text className="text-lg font-semibold mb-2">{t('listing.description')}</Text>
            <Text className="text-neutral-700 dark:text-neutral-300">
              {listing.description}
            </Text>
          </View>
        )}
        
        {/* Seller Info */}
        <Pressable 
          className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex-row items-center"
          onPress={() => router.push(`/seller/${listing.userId}`)}
        >
          <Image 
            source={{ uri: listing.seller?.avatarUrl }}
            className="w-12 h-12 rounded-full bg-neutral-200"
          />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-neutral-900 dark:text-white">
              {listing.seller?.displayName}
            </Text>
            <Text className="text-sm text-neutral-500">
              {t('listing.memberSince', { date: listing.seller?.createdAt })}
            </Text>
          </View>
          <ChevronLeft size={20} className="text-neutral-400 rotate-180" />
        </Pressable>
        
        {/* Spacer for bottom buttons */}
        <View className="h-24" />
      </ScrollView>
      
      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-4 flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          leftIcon={<Heart size={20} />}
          onPress={handleLike}
        >
          {t('swipe.like')}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          leftIcon={<MessageCircle size={20} />}
          onPress={handleContact}
        >
          {t('listing.contact')}
        </Button>
      </View>
    </View>
  );
}
```

### 3. Search Screen

```typescript
// app/(tabs)/search.tsx
import { useState } from 'react';
import { View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

import { SearchHeader, SearchSuggestions } from '@/components/search';
import { CategoryGrid, SubcategoryList } from '@/components/categories';
import { ListingGrid, ListingCardSkeleton } from '@/components/search';
import { FilterBottomSheet } from '@/components/filters';
import { useCategories, useSearchListings } from '@/hooks/useListings';
import { useLanguage } from '@/i18n';
import { FilterState } from '@/types';

export default function SearchScreen() {
  const router = useRouter();
  const { t, language, currency } = useLanguage();
  
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const { data: categories } = useCategories();
  const { data: results, isLoading, fetchNextPage } = useSearchListings({
    query: isSearching ? query : undefined,
    categoryId: selectedCategory?.id,
    ...filters,
  });
  
  const handleSearch = () => {
    setIsSearching(true);
  };
  
  const handleCategorySelect = (category: Category) => {
    if (category.subcategories?.length) {
      setSelectedCategory(category);
    } else {
      // Leaf category - start search
      setSelectedCategory(category);
      setIsSearching(true);
    }
  };
  
  // Show category browser if not searching
  if (!isSearching) {
    return (
      <View className="flex-1 bg-white dark:bg-neutral-900">
        <SearchHeader
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSearch}
          onFilterPress={() => setShowFilters(true)}
          placeholder={t('search.searchPlaceholder')}
        />
        
        {selectedCategory ? (
          <SubcategoryList
            category={selectedCategory}
            onSelect={handleCategorySelect}
            onBack={() => setSelectedCategory(null)}
            language={language}
          />
        ) : (
          <CategoryGrid
            categories={categories || []}
            onSelect={handleCategorySelect}
            language={language}
          />
        )}
      </View>
    );
  }
  
  // Show search results
  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSearch}
        onClear={() => {
          setQuery('');
          setIsSearching(false);
        }}
        onFilterPress={() => setShowFilters(true)}
        activeFilterCount={Object.keys(filters).length}
      />
      
      {isLoading ? (
        <View className="flex-row flex-wrap p-2">
          {[...Array(6)].map((_, i) => (
            <View key={i} className="w-1/2 p-2">
              <ListingCardSkeleton />
            </View>
          ))}
        </View>
      ) : (
        <ListingGrid
          listings={results?.listings || []}
          onListingPress={(l) => router.push(`/listing/${l.id}`)}
          onEndReached={() => fetchNextPage()}
          language={language}
          currency={currency}
        />
      )}
      
      <FilterBottomSheet
        isVisible={showFilters}
        onClose={() => setShowFilters(false)}
        categoryId={selectedCategory?.id}
        currentFilters={filters}
        onApply={(f) => {
          setFilters(f);
          setShowFilters(false);
        }}
        onClear={() => setFilters({})}
        language={language}
        currency={currency}
      />
    </View>
  );
}
```

### 4. Post Screen (Entry Point)

```typescript
// app/(tabs)/post.tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { PlusCircle, FileText } from 'lucide-react-native';

import { Button } from '@/components/ui';
import { useLanguage } from '@/i18n';
import { useDraftStore } from '@/stores/draftStore';

export default function PostScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { draft, clearDraft } = useDraftStore();
  
  const handleNewListing = () => {
    clearDraft();
    router.push('/post/category');
  };
  
  const handleResumeDraft = () => {
    // Continue from where they left off
    const nextStep = draft.categoryId 
      ? (draft.title ? '/post/attributes' : '/post/details')
      : '/post/category';
    router.push(nextStep);
  };
  
  return (
    <View className="flex-1 bg-white dark:bg-neutral-900 p-6 justify-center">
      <Text className="text-2xl font-bold text-center mb-8 text-neutral-900 dark:text-white">
        {t('post.createListing')}
      </Text>
      
      <Button
        variant="primary"
        size="lg"
        leftIcon={<PlusCircle size={24} />}
        onPress={handleNewListing}
        className="mb-4"
      >
        {t('post.newListing')}
      </Button>
      
      {draft.categoryId && (
        <Button
          variant="outline"
          size="lg"
          leftIcon={<FileText size={24} />}
          onPress={handleResumeDraft}
        >
          {t('post.resumeDraft')}
        </Button>
      )}
    </View>
  );
}
```

### 5. Messages Screen

```typescript
// app/(tabs)/messages.tsx
import { View, FlatList, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { useConversations } from '@/hooks/useMessages';
import { useLanguage } from '@/i18n';
import { timeAgo } from '@/utils/format';
import { Skeleton, EmptyState } from '@/components/ui';

export default function MessagesScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { data: conversations, isLoading } = useConversations();
  
  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-neutral-900 pt-12">
        {[...Array(5)].map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </View>
    );
  }
  
  if (!conversations?.length) {
    return (
      <EmptyState
        icon="message-circle"
        title={t('messages.noMessages')}
        description={t('messages.noMessagesYet')}
      />
    );
  }
  
  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <View className="pt-12 pb-4 px-4 border-b border-neutral-200 dark:border-neutral-700">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
          {t('tabs.messages')}
        </Text>
      </View>
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            className="flex-row p-4 border-b border-neutral-100 dark:border-neutral-800"
            onPress={() => router.push(`/conversation/${item.id}`)}
          >
            <Image
              source={{ uri: item.otherUser?.avatarUrl }}
              className="w-12 h-12 rounded-full bg-neutral-200"
            />
            <View className="flex-1 ml-3">
              <View className="flex-row justify-between">
                <Text className="font-semibold text-neutral-900 dark:text-white">
                  {item.otherUser?.displayName}
                </Text>
                <Text className="text-xs text-neutral-500">
                  {timeAgo(item.lastMessageAt, language)}
                </Text>
              </View>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={1}>
                {item.listing?.title}
              </Text>
              <Text 
                className={`text-sm ${item.unreadCount > 0 ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-500'}`}
                numberOfLines={1}
              >
                {item.lastMessage?.content}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View className="bg-primary-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
```

## Remaining Screens

Implement similar patterns for:
- **Profile screen** - User info, my listings, favorites, settings links
- **Auth screens** - Login, register, forgot password forms
- **Post flow screens** - Category, details, attributes, media, location, preview
- **Conversation screen** - Chat messages with real-time updates
- **Settings screens** - Language, currency toggles

Use the same patterns:
- Skeleton loaders while loading
- Error states with retry
- Empty states with helpful messages
- Optimistic updates where applicable
- Haptic feedback on actions
- i18n for all text

Provide complete implementations for all screens listed above.
```

---

## Validation Checklist (After Phase 6B)

```bash
# Full app should run
npx expo start

# Test each screen:
# 1. Home - swipe cards load, gestures work
# 2. Search - categories show, filters work
# 3. Post - can navigate through flow
# 4. Messages - conversations load
# 5. Profile - user info displays
```

---

## After Phase 6B, your app is complete!
