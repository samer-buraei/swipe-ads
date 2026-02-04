# EXECUTE: PHASE 6A - INTEGRATION SKELETON (Claude)

## Why Split Phase 6?

The original Phase 6 prompt was too large. LLMs hit output limits and produce placeholder code like `// implement logic here`.

**Split into:**
- **6A (This file)**: Project skeleton, providers, navigation, configuration
- **6B (Next file)**: Core screen implementations with real logic

## Instructions

1. Open Claude (claude.ai)
2. **Paste APP-CONTRACT.md first**
3. Paste key outputs: types.ts, schemas.ts (summaries OK for large files)
4. Execute the prompt below
5. Save all outputs to correct locations

---

## PROMPT 6A: Project Skeleton & Configuration

```
# Task: Create SwipeMarket Project Skeleton

## App Contract
[PASTE APP-CONTRACT.md HERE]

## Types Reference
[PASTE types.ts - or summary of main types]

## Goal

Create the foundational project structure that all screens will build on:
- Expo configuration
- Navigation setup
- Provider hierarchy
- Theme configuration
- Utility setup

## Required Outputs

### 1. app.json (Expo Configuration)

```json
{
  "expo": {
    "name": "SwipeMarket",
    "slug": "swipemarket",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3B82F6"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.swipemarket.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Potrebno za fotografisanje oglasa",
        "NSPhotoLibraryUsageDescription": "Potrebno za izbor fotografija",
        "NSLocationWhenInUseUsageDescription": "Potrebno za pretragu u blizini"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#3B82F6"
      },
      "package": "com.swipemarket.app",
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-localization",
      [
        "expo-image-picker",
        {
          "photosPermission": "Dozvoli pristup fotografijama za oglase",
          "cameraPermission": "Dozvoli pristup kameri za fotografisanje"
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Dozvoli pristup lokaciji za pretragu u blizini"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### 2. package.json

```json
{
  "name": "swipemarket",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@gorhom/bottom-sheet": "^4",
    "@react-navigation/native": "^6",
    "@supabase/supabase-js": "^2",
    "@tanstack/react-query": "^5",
    "expo": "~50.0.0",
    "expo-av": "~13.0.0",
    "expo-file-system": "~16.0.0",
    "expo-haptics": "~12.0.0",
    "expo-image": "~1.10.0",
    "expo-image-picker": "~14.0.0",
    "expo-linear-gradient": "~12.0.0",
    "expo-localization": "~14.0.0",
    "expo-location": "~16.0.0",
    "expo-router": "~3.0.0",
    "expo-secure-store": "~12.0.0",
    "expo-splash-screen": "~0.26.0",
    "expo-status-bar": "~1.11.0",
    "lucide-react-native": "^0.300.0",
    "nativewind": "^4",
    "react": "18.2.0",
    "react-hook-form": "^7",
    "react-native": "0.73.0",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-reanimated": "~3.6.0",
    "react-native-safe-area-context": "^4",
    "react-native-screens": "~3.29.0",
    "react-native-svg": "^14",
    "react-native-toast-message": "^2",
    "react-native-compressor": "^1",
    "tailwindcss": "^3.4.0",
    "zod": "^3",
    "zustand": "^4"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@hookform/resolvers": "^3",
    "@types/react": "~18.2.0",
    "eslint": "^8",
    "eslint-config-expo": "^7",
    "typescript": "^5"
  }
}
```

### 3. app/_layout.tsx (Root Layout)

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';

import { LanguageProvider } from '@/i18n';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/theme';
import { toastConfig } from '@/components/ui/Toast';

import '../global.css';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();
  const { colorScheme } = useTheme();
  
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);
  
  if (isLoading) {
    return null; // Splash screen still showing
  }
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen 
          name="listing/[id]" 
          options={{ presentation: 'card' }} 
        />
        <Stack.Screen 
          name="conversation/[id]" 
          options={{ presentation: 'card' }} 
        />
      </Stack>
      <Toast config={toastConfig} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### 4. app/(tabs)/_layout.tsx (Tab Navigator)

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react-native';
import { useLanguage } from '@/i18n';
import { useTheme } from '@/theme';
import { useUnreadCount } from '@/hooks/useMessages';

export default function TabLayout() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { data: unreadCount } = useUnreadCount();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.neutral[200],
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: t('tabs.post'),
          tabBarIcon: ({ color, size }) => (
            <PlusCircle size={size + 8} color={colors.primary[500]} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### 5. app/(auth)/_layout.tsx (Auth Layout)

```typescript
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function AuthLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

### 6. lib/supabase.ts

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Secure storage adapter for auth tokens
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 7. theme/index.ts

```typescript
// theme/index.ts
import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export const colors = {
  primary: {
    50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
    400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
  },
  success: { 500: '#22C55E', 600: '#16A34A' },
  danger: { 500: '#EF4444', 600: '#DC2626' },
  warning: { 500: '#F59E0B', 600: '#D97706' },
  info: { 500: '#06B6D4', 600: '#0891B2' },
  neutral: {
    50: '#FAFAFA', 100: '#F5F5F5', 200: '#E5E5E5', 300: '#D4D4D4',
    400: '#A3A3A3', 500: '#737373', 600: '#525252', 700: '#404040',
    800: '#262626', 900: '#171717',
  },
};

interface ThemeContextValue {
  colorScheme: 'light' | 'dark';
  colors: typeof colors & { background: string; text: string };
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(systemScheme || 'light');
  
  const themeColors = {
    ...colors,
    background: colorScheme === 'dark' ? colors.neutral[900] : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : colors.neutral[900],
  };
  
  return (
    <ThemeContext.Provider value={{ 
      colorScheme, 
      colors: themeColors,
      toggleTheme: () => setColorScheme(s => s === 'light' ? 'dark' : 'light'),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### 8. tailwind.config.js

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
          400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
        },
        success: { 500: '#22C55E', 600: '#16A34A' },
        danger: { 500: '#EF4444', 600: '#DC2626' },
        warning: { 500: '#F59E0B', 600: '#D97706' },
      },
    },
  },
  plugins: [],
};
```

### 9. .env.example

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 10. global.css

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 11. tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

## Output

Provide all files listed above, complete and ready to use.
These form the foundation - Phase 6B will add the screen implementations.
```

---

## Validation Checklist (After Phase 6A)

```bash
# Install dependencies
npm install

# TypeScript check
npx tsc --noEmit

# Start app (should show blank tabs)
npx expo start
```

---

## Next: Proceed to EXECUTE-08-PHASE6B-INTEGRATION.md
