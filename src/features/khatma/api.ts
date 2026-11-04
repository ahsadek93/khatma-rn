import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/data/http";
import { unwrap } from "@/data/results";
import type { CompletedKhatma, KhatmaMember, KhatmaSummary, KhatmaType, PaginatedResponse } from "@/data/contracts";

const idPath = (id: string) => encodeURIComponent(id);

export function useKhatmaMembers(id: string) {
  return useQuery({
    queryKey: ["khatma", id, "members"],
    queryFn: async () => unwrap(await request<PaginatedResponse<KhatmaMember>>(`/khatmas/${idPath(id)}/members`)).data,
  });
}

export function useKhatmaInvite(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["khatma", id, "invite"],
    queryFn: async () => (unwrap(await request<{ joinCode: string | null }>(`/khatmas/${idPath(id)}/invite`))).joinCode,
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
