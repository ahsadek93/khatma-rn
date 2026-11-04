import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/features/profile/api";
import { request } from "@/data/http";
import { unwrap } from "@/data/results";
import type { KhatmaQuranProgress, PaginatedResponse, QuranJuz } from "@/data/contracts";

const idPath = (id: string) => encodeURIComponent(id);

export function useKhatmaJuz(id: string) {
  return useQuery({
    queryKey: ["khatma", id, "juz"],
    queryFn: async () => unwrap(await request<PaginatedResponse<QuranJuz>>(`/quran/khatmas/${idPath(id)}/juz`)).data,
  });
}

export function useKhatmasQuranProgress(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ["khatma", id, "progress"],
      queryFn: async () => unwrap(await request<KhatmaQuranProgress>(`/quran/khatmas/${idPath(id)}/progress`)),
    })),
    combine: (results) => ({
      data: results.map((r) => r.data),
      isPending: results.some((r) => r.isPending),
      isError: results.some((r) => r.isLoadingError),
    }),
  });
}

function useJuzMutation(id: string, action: "claim" | "complete") {
  const queryClient = useQueryClient();
  const currentUserId = useMe().data?.id ?? null;
  const key = ["khatma", id, "juz"];
  return useMutation({
    mutationFn: async (juzNumber: number) => unwrap(await request<unknown>(`/quran/khatmas/${idPath(id)}/${action}`, { method: "POST", body: { juzNumber } })),
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
