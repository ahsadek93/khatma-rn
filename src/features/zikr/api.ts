import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useZikrProgress(id: string) {
  return useQuery({
    queryKey: ["khatma", id, "progress"],
    queryFn: async () => unwrap(await getKhatmaZikrProgress(id)),
  });
}

function useZikrMutation<V>(id: string, run: (vars: V) => Promise<BackendResult<null>>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: V) => unwrap(await run(vars)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["khatma", id] }),
  });
}

export const useSetZikrClaim = (id: string) => useZikrMutation(id, (amount: number) => setZikrClaim(id, amount));
export const useReleaseZikrClaim = (id: string) => useZikrMutation(id, () => releaseZikrClaim(id));
export const useCompleteZikrClaim = (id: string) => useZikrMutation(id, () => completeZikrClaim(id));
export const useUpdateZikrSettings = (id: string) =>
  useZikrMutation(id, ({ phrase, goal }: { phrase: string; goal: number }) => updateZikrKhatmaSettings(id, phrase, goal));
