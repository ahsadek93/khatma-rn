import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackendResult, CompletedKhatma, KhatmaBackend, KhatmaMember, KhatmaSummary } from "../../contracts";
import { backendSuccess } from "../../results";
import { getAuthenticatedUser } from "../shared/current-user";
import { failed } from "../shared/errors";
import { getMyKhatmaRows } from "../shared/khatma-queries";

export function createKhatmaAdapter(client: SupabaseClient): KhatmaBackend {
  return {
    async createKhatma(name) {
      try {
        const userResult = await getAuthenticatedUser(client);
        if (userResult.error) return userResult;
        const { data, error } = await client.from("khatmas").insert({ name: name.trim(), created_by: userResult.data.id }).select("id, name").single();
        return error ? failed(error) : backendSuccess({ id: data.id, name: data.name });
      } catch (error) {
        return failed(error);
      }
    },
    async joinKhatmaByCode(code) {
      try {
        const { data, error } = await client.rpc("join_khatma_by_code", { requested_code: code });
        return error ? failed(error) : backendSuccess(data);
      } catch (error) {
        return failed(error);
      }
    },
    async getKhatmaMembers(khatmaId) {
      try {
        const { data, error } = await client.from("khatma_members").select("user_id, role, joined_at").eq("khatma_id", khatmaId).order("joined_at");
        if (error) return failed(error);
        const members: KhatmaMember[] = (data ?? []).map((member) => ({
          userId: member.user_id,
          role: member.role as KhatmaMember["role"],
          joinedAt: member.joined_at,
        }));
        return backendSuccess(members);
      } catch (error) {
        return failed(error);
      }
    },
    async getKhatmaJoinCode(khatmaId) {
      try {
        const { data, error } = await client.from("khatmas").select("join_code").eq("id", khatmaId).maybeSingle();
        return error ? failed(error) : backendSuccess(data?.join_code ?? null);
      } catch (error) {
        return failed(error);
      }
    },
    getMyActiveKhatma: () => getMyKhatma(client, "active"),
    async getMyCompletedKhatmas() {
      try {
        const result = await getMyKhatmaRows(client, "completed");
        if (result.error) return failed(result.error);
        const khatmas: CompletedKhatma[] = result.rows.map((khatma) => ({
          id: khatma.id,
          name: khatma.name,
          completedAt: khatma.completed_at ?? "",
        }));
        return backendSuccess(khatmas);
      } catch (error) {
        return failed(error);
      }
    },
  };
}

async function getMyKhatma(client: SupabaseClient, status: "active" | "completed"): Promise<BackendResult<KhatmaSummary | null>> {
  try {
    const { rows, error } = await getMyKhatmaRows(client, status);
    if (error) return failed(error);
    const khatma = rows[0];
    if (!khatma) return backendSuccess(null);
    const { count, error: countError } = await client.from("khatma_members").select("id", { count: "exact", head: true }).eq("khatma_id", khatma.id);
    if (countError) return failed(countError);
    const summary: KhatmaSummary = { id: khatma.id, name: khatma.name, memberCount: count ?? 0 };
    return backendSuccess(summary);
  } catch (error) {
    return failed(error);
  }
}
