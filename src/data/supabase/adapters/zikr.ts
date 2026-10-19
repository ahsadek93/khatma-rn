import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackendResult, ZikrBackend, ZikrKhatmaProgress } from "../../contracts";
import { backendSuccess } from "../../results";
import { failed } from "../shared/errors";

export function createZikrAdapter(client: SupabaseClient): ZikrBackend {
  return {
    async getKhatmaProgress(khatmaId) {
      try {
        const { data, error } = await client.rpc("get_zikr_khatma_details", { target_khatma_id: khatmaId });
        if (error) return failed(error);
        const row = data?.[0] as {
          phrase: string;
          goal_count: number;
          completed_count: number;
          pending_count: number;
          my_pending_count: number;
        } | undefined;
        if (!row) return failed(new Error("Zikr Khatma not found"));
        const progress: ZikrKhatmaProgress = {
          phrase: row.phrase,
          goalCount: row.goal_count,
          completedCount: row.completed_count,
          pendingCount: row.pending_count,
          myPendingCount: row.my_pending_count,
        };
        return backendSuccess(progress);
      } catch (error) {
        return failed(error);
      }
    },
    setClaim: (khatmaId, amount) => call(client, "set_zikr_khatma_claim", {
      target_khatma_id: khatmaId,
      target_amount: amount,
    }),
    releaseClaim: (khatmaId) => call(client, "release_zikr_khatma_claim", {
      target_khatma_id: khatmaId,
    }),
    completeClaim: (khatmaId) => call(client, "complete_zikr_khatma_claim", {
      target_khatma_id: khatmaId,
    }),
    updateSettings: (khatmaId, phrase, goalCount) => call(client, "update_zikr_khatma_settings", {
      target_khatma_id: khatmaId,
      target_phrase: phrase.trim(),
      target_goal_count: goalCount,
    }),
  };
}

async function call(client: SupabaseClient, functionName: string, args: Record<string, unknown>): Promise<BackendResult<null>> {
  try {
    const { error } = await client.rpc(functionName, args);
    return error ? failed(error) : backendSuccess(null);
  } catch (error) {
    return failed(error);
  }
}
