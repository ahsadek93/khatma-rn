import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackendResult, CompletedKhatma, KhatmaBackend, KhatmaMember, KhatmaSummary, KhatmaType } from "../../contracts";
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
    async createZikrKhatma(name, phrase, goalCount) {
      try {
        const { data, error } = await client.rpc("create_zikr_khatma", {
          target_name: name.trim(),
          target_phrase: phrase.trim(),
          target_goal_count: goalCount,
        });
        return error ? failed(error) : backendSuccess({ id: data, name: name.trim() });
      } catch (error) {
        return failed(error);
      }
    },
    async joinKhatmaByCode(code) {
      try {
        const { data, error } = await client.rpc("join_khatma_by_code", { requested_code: code });
        if (error) return failed(error);
        const { data: khatma, error: typeError } = await client
          .from("khatmas")
          .select("khatma_type")
          .eq("id", data)
          .single();
        return typeError ? failed(typeError) : backendSuccess({ id: data, type: khatma.khatma_type as KhatmaType });
      } catch (error) {
        return failed(error);
      }
    },
    async getKhatmaMembers(khatmaId) {
      try {
        const [membershipResult, detailsResult] = await Promise.all([
          client.from("khatma_members").select("user_id, role, joined_at").eq("khatma_id", khatmaId).order("joined_at"),
          client.rpc("get_khatma_member_details", { target_khatma_id: khatmaId }),
        ]);
        if (membershipResult.error) return failed(membershipResult.error);
        if (detailsResult.error) return failed(detailsResult.error);
        const names = new Map<string, string | null>((detailsResult.data ?? []).map((member: { user_id: string; display_name: string | null }) => [member.user_id, member.display_name || null]));
        const members: KhatmaMember[] = (membershipResult.data ?? []).map((member) => ({
          userId: member.user_id,
          displayName: names.get(member.user_id) ?? null,
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
    getMyActiveKhatmas: (type = "quran") => getMyActiveKhatmas(client, type),
    async getMyCompletedKhatmas(type = "quran") {
      try {
        const result = await getMyKhatmaRows(client, "completed", type);
        if (result.error) return failed(result.error);
        const khatmas: CompletedKhatma[] = result.rows.map((khatma) => ({
          id: khatma.id,
          name: khatma.name,
          type: khatma.khatma_type as KhatmaType,
          completedAt: khatma.completed_at ?? "",
        }));
        return backendSuccess(khatmas);
      } catch (error) {
        return failed(error);
      }
    },
  };
}

async function getMyActiveKhatmas(client: SupabaseClient, type: KhatmaType = "quran"): Promise<BackendResult<KhatmaSummary[]>> {
  try {
    const { rows, error } = await getMyKhatmaRows(client, "active", type);
    if (error) return failed(error);
    const results = await Promise.all(rows.map(async (khatma) => {
      const { count, error: countError } = await client.from("khatma_members").select("id", { count: "exact", head: true }).eq("khatma_id", khatma.id);
      return countError
        ? { error: countError }
        : { summary: { id: khatma.id, name: khatma.name, type: khatma.khatma_type as KhatmaType, memberCount: count ?? 0 } satisfies KhatmaSummary };
    }));
    const summaries: KhatmaSummary[] = [];
    for (const result of results) {
      if ("error" in result) return failed(result.error);
      summaries.push(result.summary);
    }
    return backendSuccess(summaries);
  } catch (error) {
    return failed(error);
  }
}
