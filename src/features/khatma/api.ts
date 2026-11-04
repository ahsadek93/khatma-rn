import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/data/http";
import { backendSuccess, unwrap } from "@/data/results";
import type { CompletedKhatma, KhatmaMember, KhatmaSummary, KhatmaType, PaginatedResponse } from "@/data/contracts";
export type { CompletedKhatma, KhatmaMember, KhatmaSummary, KhatmaType, PaginatedResponse } from "@/data/contracts";

const idPath = (id: string) => encodeURIComponent(id);

export async function getKhatmaMembers(khatmaId: string) {
  return request<PaginatedResponse<KhatmaMember>>(`/khatmas/${idPath(khatmaId)}/members`);
}

export async function getKhatmaJoinCode(khatmaId: string) {
  const result = await request<{ joinCode: string | null }>(`/khatmas/${idPath(khatmaId)}/invite`);
  return result.error ? result : backendSuccess(result.data.joinCode);
}

export function useKhatmaMembers(id: string) {
  return useQuery({
    queryKey: ["khatma", id, "members"],
    queryFn: async () => unwrap(await getKhatmaMembers(id)).data,
  });
}

export function useKhatmaInvite(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["khatma", id, "invite"],
    queryFn: async () => unwrap(await getKhatmaJoinCode(id)),
    enabled,
  });
}

export function useMyKhatmas<S extends "active" | "completed">(type: KhatmaType, status: S) {
  return useQuery({
    queryKey: ["khatmas", type, status],
    queryFn: async () =>
      unwrap(await request<PaginatedResponse<S extends "active" ? KhatmaSummary : CompletedKhatma>>(`/khatmas?status=${status}&type=${type}`)),
  });
}

type CreateVars = { name: string } | { name: string; phrase: string; goalCount: number };

export function useCreateKhatma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: CreateVars) =>
      unwrap(
        await request<{ id: string; name: string }>("phrase" in vars ? "/zikr/khatmas" : "/khatmas", {
          method: "POST",
          body: vars,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["khatmas"] }),
  });
}

export function useJoinKhatma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) =>
      unwrap(await request<{ id: string; type: KhatmaType }>("/khatmas/join", { method: "POST", body: { code } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["khatmas"] }),
  });
}
