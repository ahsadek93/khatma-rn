import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppBackend,
  AuthUser,
  BackendError,
  BackendResult,
  CompletedKhatma,
  KhatmaMember,
  KhatmaSummary,
  QuranJuz,
  UserProfile,
} from "../contracts";
import { backendFailure, backendSuccess, unexpectedBackendError } from "../results";

type ProviderError = { code?: string; status?: number; message?: string };

function mapError(error: unknown): BackendError {
  const providerError = error as ProviderError;
  const message = providerError?.message ?? String(error);

  if (providerError?.code === "23505" || providerError?.code === "23503") {
    return { code: "conflict", message };
  }
  if (providerError?.status === 401 || /authsessionmissing|not authenticated|no signed-in user/i.test(message)) {
    return { code: "unauthenticated", message };
  }
  if (providerError?.status && providerError.status >= 500) {
    return { code: "unavailable", message };
  }
  if (/network|fetch failed|timeout/i.test(message)) {
    return { code: "unavailable", message };
  }
  return unexpectedBackendError(error);
}

function failed<T = never>(error: unknown): BackendResult<T> {
  return backendFailure(mapError(error));
}

function currentUser(user: { id: string; email?: string } | null): AuthUser | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

export function createSupabaseBackend(client: SupabaseClient): AppBackend {
  return {
    auth: {
      async getCurrentUser() {
        try {
          const { data, error } = await client.auth.getSession();
          return error ? failed(error) : backendSuccess(currentUser(data.session?.user ?? null));
        } catch (error) {
          return failed(error);
        }
      },
      async sendSignInCode(email) {
        try {
          const { error } = await client.auth.signInWithOtp({ email });
          return error ? failed(error) : backendSuccess(null);
        } catch (error) {
          return failed(error);
        }
      },
      async verifySignInCode(email, token) {
        try {
          const { data, error } = await client.auth.verifyOtp({ email, token, type: "email" });
          if (error) return failed(error);
          const user = currentUser(data.user);
          return user ? backendSuccess(user) : failed(new Error("Verification returned no user"));
        } catch (error) {
          return failed(error);
        }
      },
      async signOut() {
        try {
          const { error } = await client.auth.signOut();
          return error ? failed(error) : backendSuccess(null);
        } catch (error) {
          return failed(error);
        }
      },
    },
    profile: {
      async getCurrentProfile() {
        try {
          const { data: { user }, error: userError } = await client.auth.getUser();
          if (userError) return failed(userError);
          if (!user) return backendFailure({ code: "unauthenticated", message: "No signed-in user" });
          const { data, error } = await client.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
          if (error) return failed(error);
          const profile: UserProfile = { displayName: data?.display_name ?? "", email: user.email ?? "" };
          return backendSuccess(profile);
        } catch (error) {
          return failed(error);
        }
      },
      async saveCurrentDisplayName(displayName) {
        try {
          const { data: { user }, error: userError } = await client.auth.getUser();
          if (userError) return failed(userError);
          if (!user) return backendFailure({ code: "unauthenticated", message: "No signed-in user" });
          const { error } = await client.from("profiles").upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });
          return error ? failed(error) : backendSuccess(null);
        } catch (error) {
          return failed(error);
        }
      },
    },
    khatma: {
      async createKhatma(name) {
        try {
          const { data: { user }, error: userError } = await client.auth.getUser();
          if (userError) return failed(userError);
          if (!user) return backendFailure({ code: "unauthenticated", message: "No signed-in user" });
          const { data, error } = await client.from("khatmas").insert({ name: name.trim(), created_by: user.id }).select("id, name").single();
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
      async getMyActiveKhatma() {
        return getMyKhatma(client, "active");
      },
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
    },
    quran: {
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
          const { data: { user }, error: userError } = await client.auth.getUser();
          if (userError) return failed(userError);
          if (!user) return backendFailure({ code: "unauthenticated", message: "No signed-in user" });
          const { data, error } = await client.from("quran_khatma_juz").select("juz_number, status, claimed_by").eq("khatma_id", khatmaId);
          if (error) return failed(error);
          const rows = data ?? [];
          return backendSuccess({
            completedJuz: rows.filter((item) => item.status === "completed").length,
            selectedJuz: rows.filter((item) => item.status === "claimed" && item.claimed_by === user.id).map((item) => item.juz_number),
          });
        } catch (error) {
          return failed(error);
        }
      },
      claimJuz: (khatmaId, juzNumber) => applyJuzAction(client, "claim", khatmaId, juzNumber),
      releaseJuz: (khatmaId, juzNumber) => applyJuzAction(client, "release", khatmaId, juzNumber),
      completeJuz: (khatmaId, juzNumber) => applyJuzAction(client, "complete", khatmaId, juzNumber),
    },
  };
}

async function getMyKhatmaRows(client: SupabaseClient, status: "active" | "completed") {
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) return { rows: [], error: userError };
  if (!user) return { rows: [], error: new Error("No signed-in user") };
  const { data, error } = await client.from("khatma_members").select("khatmas!inner(id, name, status, completed_at)").eq("user_id", user.id).eq("khatmas.status", status);
  if (error) return { rows: [], error };
  const rows = (data ?? []).map(({ khatmas }) => Array.isArray(khatmas) ? khatmas[0] : khatmas).filter(Boolean);
  return { rows, error: null };
}

async function getMyKhatma(client: SupabaseClient, status: "active" | "completed"): Promise<BackendResult<KhatmaSummary | null>> {
  try {
    const { rows, error } = await getMyKhatmaRows(client, status);
    if (error) return failed(error);
    const active = rows[0];
    if (!active) return backendSuccess(null);
    const { count, error: countError } = await client.from("khatma_members").select("id", { count: "exact", head: true }).eq("khatma_id", active.id);
    if (countError) return failed(countError);
    return backendSuccess({ id: active.id, name: active.name, memberCount: count ?? 0 });
  } catch (error) {
    return failed(error);
  }
}

async function applyJuzAction(client: SupabaseClient, action: "claim" | "release" | "complete", khatmaId: string, juzNumber: number): Promise<BackendResult<null>> {
  try {
    const { error } = await client.rpc(`${action}_quran_juz`, { target_khatma_id: khatmaId, target_juz_number: juzNumber });
    return error ? failed(error) : backendSuccess(null);
  } catch (error) {
    return failed(error);
  }
}
