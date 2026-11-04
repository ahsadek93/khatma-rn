import { queryOptions, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/data/http";
import { unwrap } from "@/data/results";
import type { BackendResult, ZikrKhatmaProgress } from "@/data/contracts";

const idPath = (id: string) => encodeURIComponent(id);

const zikrProgressQuery = (id: string) =>
  queryOptions({
    queryKey: ["khatma", id, "progress"],
    queryFn: async () => unwrap(await request<ZikrKhatmaProgress>(`/zikr/khatmas/${idPath(id)}/progress`)),
  });

export const useZikrProgress = (id: string) => useQuery(zikrProgressQuery(id));

export function useKhatmasZikrProgress(ids: string[]) {
  const queryClient = useQueryClient();
  const progress = useQueries({
    queries: ids.map(zikrProgressQuery),
    combine: (results) => ({
      data: results.map((r) => r.data),
      isPending: results.some((r) => r.isPending),
      isError: results.some((r) => r.isLoadingError),
    }),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["khatmas", "zikr", "active"] });
    ids.forEach((id) => void queryClient.invalidateQueries({ queryKey: ["khatma", id, "progress"] }));
  };
  return { ...progress, refresh };
}

function useZikrMutation<V>(id: string, run: (vars: V) => Promise<BackendResult<unknown>>, alsoKhatmas = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: V) => unwrap(await run(vars)),
    onSettled: () => {
      if (alsoKhatmas) void queryClient.invalidateQueries({ queryKey: ["khatmas"] });
      return queryClient.invalidateQueries({ queryKey: ["khatma", id] });
    },
  });
}

const send = (id: string, path: string, body?: unknown, method = "POST") =>
  request<unknown>(`/zikr/khatmas/${idPath(id)}/${path}`, { method, body });

export const useSetZikrClaim = (id: string) => useZikrMutation(id, (amount: number) => send(id, "claim", { amount }));
export const useReleaseZikrClaim = (id: string) => useZikrMutation(id, () => send(id, "release"));
export const useCompleteZikrClaim = (id: string) => useZikrMutation(id, () => send(id, "complete"), true);
export const useUpdateZikrSettings = (id: string) =>
  useZikrMutation(id, ({ phrase, goal }: { phrase: string; goal: number }) => send(id, "settings", { phrase, goalCount: goal }, "PATCH"));
