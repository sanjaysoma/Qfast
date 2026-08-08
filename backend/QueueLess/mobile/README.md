# QFast Mobile App - Setup Guide

This is a React Native Expo app that wraps the QFast web frontend into a mobile app.

## Prerequisites

- **Node.js** v16+ and npm
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI** (for APK building): `npm install -g eas-cli`
- **Expo Account** (create free at https://expo.dev)

## Initial Setup

1. **Install dependencies**
   ```bash
   cd d:\backup\OneDrive\Desktop\QFast\backend\QFast\mobile\QFastApp
   npm install
   ```

2. **Update Web URL in App.js or build env**
   - Open `App.js` or use environment variables for EAS build.
   - Change `WEB_URL` to point to your frontend:
     - Development: `http://YOUR_MACHINE_IP:5173` (get IP from `ipconfig` on Windows)
     - Production: `https://yourdomain.com`
   - For EAS builds, you can set the target URLs via env vars:
     - `WEB_URL=https://yourdomain.com`
     - `BACKEND_URL=https://your-backend.com`

3. **Test locally (optional)**
   ```bash
   npm start
   # Then press 'a' to run on Android emulator or scan QR with Expo Go app
   ```

## Build APK for Android

### Option A: Cloud Build (Recommended, no Android Studio needed)

1. **Login to Expo**
   ```bash
   eas login
   ```
   (Enter your Expo account credentials)

2. **Create EAS config** (first time only)
   ```bash
   eas build:configure
   ```
   - Select "Android" when prompted
   - Accept defaults

3. **Build APK**
   ```bash
   eas build --platform android
   ```
   - Select "APK" when asked (not "App Bundle")
   - Wait for build to complete (~5-10 min)
   - Download APK from the link provided

4. **Install on device**
   - Transfer APK to Android device or download directly
   - Open file manager on device, tap the APK to install
   - Grant permissions when prompted

### Option B: Local Build (Requires Android Studio + JDK)

1. **Install Android Studio** (if not already installed)
   - Download from https://developer.android.com/studio
   - Install with Android SDK, NDK, and Gradle

2. **Set environment variables**
   ```powershell
   $env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\sdk"
   $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
   ```

3. **Eject from Expo** (one-way, creates native Android project)
   ```bash
   expo prebuild --clean
   ```

4. **Build APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### WebView won't load
- Check that frontend (Vite) is running on the IP/port specified in `App.js`
- Ensure Android device can reach that URL (same network or public URL)
- Check Android emulator has internet access

### Location not working
- Grant location permission in app settings on device
- Ensure `geolocationEnabled={true}` in WebView props
- Test with browser geolocation first

### Build fails on EAS
- Update `expo` version: `npm install expo@latest`
- Check app.json is valid JSON
- View build logs on Expo dashboard

## APK Distribution

Once you have the APK:
- Upload to Google Play Store (requires developer account, $25 one-time)
- Share APK directly (users install via file transfer or download link)
- Use Firebase App Distribution for beta testing

---

**Need help?** See https://docs.expo.dev/build/setup for detailed Expo docs.


