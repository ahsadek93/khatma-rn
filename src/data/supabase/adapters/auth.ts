import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthBackend, AuthUser } from "../../contracts";
import { backendSuccess } from "../../results";
import { failed } from "../shared/errors";

function currentUser(user: { id: string; email?: string } | null): AuthUser | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

export function createAuthAdapter(client: SupabaseClient): AuthBackend {
  return {
    async getCurrentUser() {
      try {
        const { data, error } = await client.auth.getSession();
        return error ? failed(error) : backendSuccess(currentUser(data.session?.user ?? null));
      } catch (error) {
        return failed(error);
      }
    },
    async sendSignInCode(email) {
      try {
        const { error } = await client.auth.signInWithOtp({ email });
        return error ? failed(error) : backendSuccess(null);
      } catch (error) {
        return failed(error);
      }
    },
    async verifySignInCode(email, token) {
      try {
        const { data, error } = await client.auth.verifyOtp({ email, token, type: "email" });
        if (error) return failed(error);
        const user = currentUser(data.user);
        return user ? backendSuccess(user) : failed(new Error("Verification returned no user"));
      } catch (error) {
        return failed(error);
      }
    },
    async signOut() {
      try {
        const { error } = await client.auth.signOut();
        return error ? failed(error) : backendSuccess(null);
      } catch (error) {
        return failed(error);
      }
    },
  };
}
