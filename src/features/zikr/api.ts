import { queryOptions, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/data/http";
import { backendSuccess, unwrap } from "@/data/results";
import type { BackendResult, ZikrKhatmaProgress } from "@/data/contracts";
export type { ZikrKhatmaProgress } from "@/data/contracts";

const idPath = (id: string) => encodeURIComponent(id);

export async function getKhatmaZikrProgress(khatmaId: string) {
  return request<ZikrKhatmaProgress>(`/zikr/khatmas/${idPath(khatmaId)}/progress`);
}

export const setZikrClaim = (khatmaId: string, amount: number) =>
  action(`/zikr/khatmas/${idPath(khatmaId)}/claim`, { amount });

export const releaseZikrClaim = (khatmaId: string) =>
  action(`/zikr/khatmas/${idPath(khatmaId)}/release`);

export const completeZikrClaim = (khatmaId: string) =>
  action(`/zikr/khatmas/${idPath(khatmaId)}/complete`);

export const updateZikrKhatmaSettings = (khatmaId: string, phrase: string, goalCount: number) =>
  action(`/zikr/khatmas/${idPath(khatmaId)}/settings`, { phrase, goalCount }, "PATCH");

async function action(path: string, body?: unknown, method = "POST") {
  const result = await request<unknown>(path, { method, body });
  return result.error ? result : backendSuccess(null);
}

const zikrProgressQuery = (id: string) =>
  queryOptions({
    queryKey: ["khatma", id, "progress"],
    queryFn: async () => unwrap(await getKhatmaZikrProgress(id)),
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
    void queryClient.invalidateQueries({ queryKey: ["khatma"] });
  };
  return { ...progress, refresh };
}

function useZikrMutation<V>(id: string, run: (vars: V) => Promise<BackendResult<null>>, alsoKhatmas = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: V) => unwrap(await run(vars)),
    onSettled: () => {
      if (alsoKhatmas) void queryClient.invalidateQueries({ queryKey: ["khatmas"] });
      return queryClient.invalidateQueries({ queryKey: ["khatma", id] });
    },
  });
}

export const useSetZikrClaim = (id: string) => useZikrMutation(id, (amount: number) => setZikrClaim(id, amount));
export const useReleaseZikrClaim = (id: string) => useZikrMutation(id, () => releaseZikrClaim(id));
export const useCompleteZikrClaim = (id: string) => useZikrMutation(id, () => completeZikrClaim(id), true);
export const useUpdateZikrSettings = (id: string) =>
  useZikrMutation(id, ({ phrase, goal }: { phrase: string; goal: number }) => updateZikrKhatmaSettings(id, phrase, goal));
