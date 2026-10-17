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
- A Supabase project for authentication and shared Khatma data.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set the Supabase project URL and publishable key:

   ```text
   EXPO_PUBLIC_SUPABASE_URL=your-project-url
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. Apply the SQL files in `supabase/migrations` to your Supabase project in filename order. This includes `20261017000000_khatma_juz_claimant_names.sql`, which provides claimant names to members of the relevant Khatma.

4. Configure Supabase email OTP as described in [Supabase setup](supabase/README.md).

## Run the app

Start Expo:

```bash
npx expo start
```

Open the project in a development build, Android emulator, iOS simulator, or Expo Go. Native module compatibility may vary in Expo Go; use a development build when needed.

## Checks

```bash
npx expo lint
npx tsc --noEmit
```

## Project structure

- `src/app/` — Expo Router screens and layouts.
- `src/features/` — authentication, Khatma, profile, and Quran data access and UI.
- `src/data/` — backend contracts and Supabase adapter.
- `src/locales/` — English and Arabic translations.
- `supabase/migrations/` — database schema, access policies, and functions.
