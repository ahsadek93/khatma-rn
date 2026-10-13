# Supabase setup

The app uses Supabase Auth email OTP for sign-in. Auth is hosted by Supabase,
so there are no database migrations required for this first flow.

1. Create a Supabase project and copy its Project URL and publishable key.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These are client-side values; never
   put a service role key in the app or in an `EXPO_PUBLIC_` variable.
3. Configure custom SMTP in Supabase so you can edit authentication email
   templates.
4. In **Authentication > Email Templates**, update both **Confirm signup** and
   **Magic Link** to show the OTP using `{{ .Token }}` instead of
   `{{ .ConfirmationURL }}`. For example:

   ```html
   <h2>Your Khatma sign-in code</h2>
   <p>Enter this code in Khatma:</p>
   <p>{{ .Token }}</p>
   ```

   Supabase can use Confirm signup for a new account and Magic Link for a
   returning account. The app verifies the eight-digit code with
   `verifyOtp({ email, token, type: "email" })`.

The mobile client and OTP calls live in `src/lib`. Keep database migrations,
Edge Functions, and other server-side Supabase code in this directory as they
are added.
