import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/features/profile/api";
import { request } from "@/data/http";
import { backendSuccess, unwrap } from "@/data/results";
import type { KhatmaQuranProgress, PaginatedResponse, QuranJuz } from "@/data/contracts";
export type { KhatmaQuranProgress, PaginatedResponse, QuranJuz } from "@/data/contracts";

const idPath = (id: string) => encodeURIComponent(id);

export async function getKhatmaJuz(khatmaId: string) {
  return request<PaginatedResponse<QuranJuz>>(`/quran/khatmas/${idPath(khatmaId)}/juz`);
}

export async function getKhatmaQuranProgress(khatmaId: string) {
  return request<KhatmaQuranProgress>(`/quran/khatmas/${idPath(khatmaId)}/progress`);
}

export const claimJuz = (khatmaId: string, juzNumber: number) => action(`/quran/khatmas/${idPath(khatmaId)}/claim`, { juzNumber });
export const releaseJuz = (khatmaId: string, juzNumber: number) => action(`/quran/khatmas/${idPath(khatmaId)}/release`, { juzNumber });
export const completeJuz = (khatmaId: string, juzNumber: number) => action(`/quran/khatmas/${idPath(khatmaId)}/complete`, { juzNumber });

async function action(path: string, body: unknown) {
  const result = await request<unknown>(path, { method: "POST", body });
  return result.error ? result : backendSuccess(null);
}

export function useKhatmaJuz(id: string) {
  return useQuery({
    queryKey: ["khatma", id, "juz"],
    queryFn: async () => unwrap(await getKhatmaJuz(id)).data,
  });
}

export function useKhatmasQuranProgress(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ["khatma", id, "progress"],
      queryFn: async () => unwrap(await getKhatmaQuranProgress(id)),
    })),
    combine: (results) => ({
      data: results.map((r) => r.data),
      isPending: results.some((r) => r.isPending),
      isError: results.some((r) => r.isError),
    }),
  });
}

function useJuzMutation(id: string, action: "claim" | "complete") {
  const queryClient = useQueryClient();
  const currentUserId = useMe((me) => me?.id ?? null).data ?? null;
  const key = ["khatma", id, "juz"];
  return useMutation({
    mutationFn: async (juzNumber: number) => unwrap(await (action === "claim" ? claimJuz : completeJuz)(id, juzNumber)),
    onMutate: async (juzNumber) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<QuranJuz[]>(key);
      queryClient.setQueryData<QuranJuz[]>(key, (items) => items?.map((item) => item.juzNumber === juzNumber
        ? { ...item, status: action === "claim" ? "claimed" : "completed", claimedBy: currentUserId }
        : item));
      return { previous };
    },
    onError: (_error, _juzNumber, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => {
      if (action === "complete") void queryClient.invalidateQueries({ queryKey: ["khatmas"] });
      void queryClient.invalidateQueries({ queryKey: ["khatma", id] });
    },
  });
}

export const useClaimJuz = (id: string) => useJuzMutation(id, "claim");
export const useCompleteJuz = (id: string) => useJuzMutation(id, "complete");
