import { supabase } from "@/lib/supabase";

export type KhatmaQuranProgress = { completedJuz: number; selectedJuz: number[] };
export type QuranJuz = { juzNumber: number; status: "free" | "claimed" | "completed"; claimedBy: string | null };

export async function getKhatmaJuz(khatmaId: string) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured") };

  const { data, error } = await supabase
    .from("quran_khatma_juz")
    .select("juz_number, status, claimed_by")
    .eq("khatma_id", khatmaId)
    .order("juz_number");

  return {
    data: data?.map((item) => ({ juzNumber: item.juz_number, status: item.status, claimedBy: item.claimed_by })) ?? null,
    error,
  };
}

export async function getKhatmaQuranProgress(khatmaId: string) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: userError ?? new Error("No signed-in user") };
  }

  const { data, error } = await supabase
    .from("quran_khatma_juz")
    .select("juz_number, status, claimed_by")
    .eq("khatma_id", khatmaId);

  if (error) return { data: null, error };

  return {
    data: {
      completedJuz: data?.filter((item) => item.status === "completed").length ?? 0,
      selectedJuz: data?.filter((item) => item.status === "claimed" && item.claimed_by === user.id).map((item) => item.juz_number) ?? [],
    },
    error: null,
  };
}

async function applyJuzAction(action: "claim" | "release" | "complete", khatmaId: string, juzNumber: number) {
  if (!supabase) return { error: new Error("Supabase is not configured") };
  const { error } = await supabase.rpc(`${action}_quran_juz`, {
    target_khatma_id: khatmaId,
    target_juz_number: juzNumber,
  });
  return { error };
}

export const claimJuz = (khatmaId: string, juzNumber: number) => applyJuzAction("claim", khatmaId, juzNumber);
export const releaseJuz = (khatmaId: string, juzNumber: number) => applyJuzAction("release", khatmaId, juzNumber);
export const completeJuz = (khatmaId: string, juzNumber: number) => applyJuzAction("complete", khatmaId, juzNumber);
