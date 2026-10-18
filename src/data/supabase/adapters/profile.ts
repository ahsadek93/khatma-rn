import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileBackend, UserProfile } from "../../contracts";
import { backendSuccess } from "../../results";
import { getAuthenticatedUser } from "../shared/current-user";
import { failed } from "../shared/errors";

export function createProfileAdapter(client: SupabaseClient): ProfileBackend {
  return {
    async getCurrentProfile() {
      try {
        const userResult = await getAuthenticatedUser(client);
        if (userResult.error) return userResult;
        const { data, error } = await client.from("profiles").select("display_name").eq("id", userResult.data.id).maybeSingle();
        if (error) return failed(error);
        const profile: UserProfile = { displayName: data?.display_name ?? "", email: userResult.data.email ?? "" };
        return backendSuccess(profile);
      } catch (error) {
        return failed(error);
      }
    },
    async saveCurrentDisplayName(displayName) {
      try {
        const userResult = await getAuthenticatedUser(client);
        if (userResult.error) return userResult;
        const { error } = await client.from("profiles").upsert(
          { id: userResult.data.id, display_name: displayName },
          { onConflict: "id" },
        );
        return error ? failed(error) : backendSuccess(null);
      } catch (error) {
        return failed(error);
      }
    },
  };
}
