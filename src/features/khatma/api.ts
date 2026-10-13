import { supabase } from "@/lib/supabase";

export type KhatmaSummary = { id: string; name: string; memberCount: number };
export type CompletedKhatma = { id: string; name: string; completedAt: string };
export type KhatmaMember = { userId: string; role: "owner" | "member"; joinedAt: string };

export async function createKhatma(name: string) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured") };
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { data: null, error: userError ?? new Error("No signed-in user") };

  const { data, error } = await supabase
    .from("khatmas")
    .insert({ name: name.trim(), created_by: user.id })
    .select("id, name")
    .single();
  return { data, error };
}

export async function joinKhatmaByCode(code: string) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured") };
  const { data, error } = await supabase.rpc("join_khatma_by_code", { requested_code: code });
  return { data, error };
}

export async function getKhatmaMembers(khatmaId: string) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured") };
  const { data, error } = await supabase
    .from("khatma_members")
    .select("user_id, role, joined_at")
    .eq("khatma_id", khatmaId)
    .order("joined_at");
  return {
    data: data?.map((member) => ({ userId: member.user_id, role: member.role, joinedAt: member.joined_at })) ?? null,
    error,
  };
}

export async function getKhatmaJoinCode(khatmaId: string) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured") };
  const { data, error } = await supabase
    .from("khatmas")
    .select("join_code")
    .eq("id", khatmaId)
    .maybeSingle();
  return { data: data?.join_code ?? null, error };
}

async function getMyKhatmasByStatus(status: "active" | "completed") {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured") };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { data: null, error: userError ?? new Error("No signed-in user") };

  const { data, error } = await supabase
    .from("khatma_members")
    .select("khatmas!inner(id, name, status, completed_at)")
    .eq("user_id", user.id)
    .eq("khatmas.status", status);
  if (error) return { data: null, error };

  const khatmas = data?.map(({ khatmas }) => Array.isArray(khatmas) ? khatmas[0] : khatmas).filter(Boolean) ?? [];
  return { data: khatmas, error: null };
}

export async function getMyActiveKhatma() {
  const { data: khatmas, error } = await getMyKhatmasByStatus("active");
  if (error || !khatmas) return { data: null, error };
  const active = khatmas[0];
  if (!active) return { data: null, error: null };

  const { count, error: countError } = await supabase!
    .from("khatma_members")
    .select("id", { count: "exact", head: true })
    .eq("khatma_id", active.id);
  if (countError) return { data: null, error: countError };
  return { data: { id: active.id, name: active.name, memberCount: count ?? 0 } satisfies KhatmaSummary, error: null };
}

export async function getMyCompletedKhatmas() {
  const { data: khatmas, error } = await getMyKhatmasByStatus("completed");
  if (error || !khatmas) return { data: null, error };
  const completedKhatmas: CompletedKhatma[] = khatmas.map((khatma) => ({
    id: khatma.id,
    name: khatma.name,
    completedAt: khatma.completed_at ?? "",
  }));
  return { data: completedKhatmas, error: null };
}
