import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function sendSignInCode(email: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error() };
  }

  return supabase.auth.signInWithOtp({ email });
}

export async function verifySignInCode(email: string, token: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error() };
  }

  return supabase.auth.verifyOtp({ email, token, type: "email" });
}

export async function signOut() {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error() };
  }

  return supabase.auth.signOut();
}
