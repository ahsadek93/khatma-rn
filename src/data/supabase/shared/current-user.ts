import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthUser, BackendResult } from "../../contracts";
import { backendFailure, backendSuccess } from "../../results";
import { failed } from "./errors";

export async function getAuthenticatedUser(client: SupabaseClient): Promise<BackendResult<AuthUser>> {
  try {
    const { data, error } = await client.auth.getUser();
    if (error) return failed(error);
    if (!data.user) return backendFailure({ code: "unauthenticated", message: "No signed-in user" });
    return backendSuccess({ id: data.user.id, email: data.user.email ?? null });
  } catch (error) {
    return failed(error);
  }
}
