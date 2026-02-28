# Mobile Porting Guide (iOS & Android) via Capacitor

This instruction set is for a Junior Developer to package the SwipeMarket Next.js application into native iOS (`.ipa`/`.app`) and Android (`.apk`/`.aab`) apps.

Since SwipeMarket heavily utilizes Next.js App Router features (like API routes for tRPC, server-side data fetching, etc.), a pure "Static Export" would break backend functionality. Therefore, the absolute **easiest and officially recommended method** for porting full-stack Next.js apps is using the **Capacitor Live Web URL Wrapper**.

This approach embeds a native WebView that loads the live Vercel URL. The app functions completely as a native app on the device (can use Push Notifications, Camera native interfaces, etc.), but pulls the UI from the live server.

## Prerequisites
- **Node.js**: Installed on your machine.
- **Android Studio**: Installed (required for compiling the Android App).
- **Xcode & macOS**: Installed (required if compiling the iOS App).

---

## Step 1: Install Capacitor Dependencies
Run the following commands in the root of the SwipeMarket project:
```bash
# Install the core library
npm install @capacitor/core

# Install the CLI and platform packages as dev dependencies
npm install -D @capacitor/cli @capacitor/ios @capacitor/android
```

## Step 2: Initialize Capacitor
Initialize the Capacitor configuration. We will point the web directory to `public` (a dummy directory for our use case, since we are loading a remote URL).
```bash
npx cap init SwipeMarket com.swipemarket.app --web-dir public
```

## Step 3: Configure for Live Vercel URL
Open the newly generated `capacitor.config.ts` file in the root directory and modify it to point to the live Vercel production deployment URL:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swipemarket.app',
  appName: 'SwipeMarket',
  webDir: 'public',
  // This tells the native app to load the live web URL instead of local files
  server: {
    url: 'https://your-swipemarket-vercel-url.vercel.app', 
    cleartext: true
  }
};

export default config;
```
*(Make sure to replace the `url` with the actual Vercel URL after it is deployed).*

## Step 4: Add Mobile Platforms
Inject the native Android and iOS scaffolding into the project. This gives you the `android/` and `ios/` folders containing native code.
```bash
npx cap add android
npx cap add ios
```

## Step 5: Open Native IDEs & Run on Device
To test and compile the applications, Capacitor will open their respective native IDEs.

**For Android:**
```bash
npx cap open android
```
*Wait for Android Studio to finish indexing Gradle. Then, select an emulator or plug in an Android phone and press the green "Play" button at the top.*

**For iOS (Mac only):**
```bash
npx cap open ios
```
*Wait for Xcode to load. You must click on the "App" project in the left sidebar, go to "Signing & Capabilities", and select an Apple Developer Team. Then, choose an iPhone simulator and press "Play".*

---

## Moving Forward: Native Features
Because this is running in Capacitor, the web app can 'talk' to the native phone hardware. For example, if you need native push notifications or the native camera later, you can install plugins on the Next.js side:
- `npm install @capacitor/camera`
- `npm install @capacitor/push-notifications`

When you import and call these from a Next.js client component, they will automatically trigger the native iOS/Android permissions and UI.
