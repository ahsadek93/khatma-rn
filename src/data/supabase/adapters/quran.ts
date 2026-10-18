import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackendResult, QuranBackend, QuranJuz } from "../../contracts";
import { backendSuccess } from "../../results";
import { getAuthenticatedUser } from "../shared/current-user";
import { failed } from "../shared/errors";

export function createQuranAdapter(client: SupabaseClient): QuranBackend {
  return {
    async getKhatmaJuz(khatmaId) {
      try {
        let { data, error } = await client.rpc("get_khatma_juz_details", { target_khatma_id: khatmaId });
        if (error?.code === "PGRST202" || error?.code === "42883") {
          ({ data, error } = await client.from("quran_khatma_juz").select("juz_number, status, claimed_by").eq("khatma_id", khatmaId).order("juz_number"));
        }
        if (error) return failed(error);
        const juz: QuranJuz[] = (data ?? []).map((item) => ({
          juzNumber: item.juz_number,
          status: item.status as QuranJuz["status"],
          claimedBy: item.claimed_by,
          claimedByName: item.claimed_by_name ?? null,
        }));
        return backendSuccess(juz);
      } catch (error) {
        return failed(error);
      }
    },
    async getKhatmaQuranProgress(khatmaId) {
      try {
        const userResult = await getAuthenticatedUser(client);
        if (userResult.error) return userResult;
        const { data, error } = await client.from("quran_khatma_juz").select("juz_number, status, claimed_by").eq("khatma_id", khatmaId);
        if (error) return failed(error);
        const rows = data ?? [];
        return backendSuccess({
          completedJuz: rows.filter((item) => item.status === "completed").length,
          selectedJuz: rows.filter((item) => item.status === "claimed" && item.claimed_by === userResult.data.id).map((item) => item.juz_number),
        });
      } catch (error) {
        return failed(error);
      }
    },
    claimJuz: (khatmaId, juzNumber) => applyJuzAction(client, "claim", khatmaId, juzNumber),
    releaseJuz: (khatmaId, juzNumber) => applyJuzAction(client, "release", khatmaId, juzNumber),
    completeJuz: (khatmaId, juzNumber) => applyJuzAction(client, "complete", khatmaId, juzNumber),
  };
}

async function applyJuzAction(client: SupabaseClient, action: "claim" | "release" | "complete", khatmaId: string, juzNumber: number): Promise<BackendResult<null>> {
  try {
    const { error } = await client.rpc(`${action}_quran_juz`, { target_khatma_id: khatmaId, target_juz_number: juzNumber });
    return error ? failed(error) : backendSuccess(null);
  } catch (error) {
    return failed(error);
  }
}
