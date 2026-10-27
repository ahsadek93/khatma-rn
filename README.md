# Khatma

Khatma is a mobile-first Quran reading app built with Expo and React Native. It helps people read together in group Khatmas and follow progress across all 30 Juz.

## Features

- Sign in with an email verification code.
- Create a group Khatma or join one with an invite code.
- View group membership and Quran progress.
- Tap a Juz to see its status and claimant. Claim an available Juz or mark your own claimed Juz complete.
- Set a display name and choose the app language and appearance.
- Use the Zikr screen.
- English and Arabic translations.

## Requirements

- Node.js compatible with the installed Expo SDK.
- A running Khatma backend.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_KHATMA_BE_URL` to the backend URL reachable from your device. For the Android emulator, use `http://10.0.2.2:3000` when the backend runs on the development machine.

## Run the app

Start Expo:

```bash
npx expo start
```

Open the project in a development build, Android emulator, iOS simulator, or Expo Go.

## Checks

```bash
npx expo lint
npx tsc --noEmit
```

## Project structure

- `src/app/` — Expo Router screens and layouts.
- `src/features/` — authentication, Khatma, profile, and Quran data access and UI.
- `src/data/` — backend contracts and HTTP client.
- `src/locales/` — English and Arabic translations.
