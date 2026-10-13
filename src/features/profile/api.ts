import { supabase } from "@/lib/supabase";

export async function getCurrentProfile() {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured") };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { data: null, error: userError ?? new Error("No signed-in user") };

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return { data: data ? { ...data, email: user.email ?? "" } : { display_name: "", email: user.email ?? "" }, error };
}

export async function saveCurrentDisplayName(displayName: string) {
  if (!supabase) return { error: new Error("Supabase is not configured") };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: userError ?? new Error("No signed-in user") };

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });

  return { error };
}
