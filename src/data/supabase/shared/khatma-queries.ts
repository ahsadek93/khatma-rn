import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "./current-user";

export async function getMyKhatmaRows(client: SupabaseClient, status: "active" | "completed") {
  const userResult = await getAuthenticatedUser(client);
  if (userResult.error) return { rows: [], error: userResult.error };

  const { data, error } = await client
    .from("khatma_members")
    .select("khatmas!inner(id, name, status, completed_at)")
    .eq("user_id", userResult.data.id)
    .eq("khatmas.status", status);
  if (error) return { rows: [], error };
  const rows = (data ?? [])
    .map(({ khatmas }) => Array.isArray(khatmas) ? khatmas[0] : khatmas)
    .filter(Boolean);
  return { rows, error: null };
}
