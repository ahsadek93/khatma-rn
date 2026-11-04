import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession, request } from "@/data/http";
import { unwrap } from "@/data/results";
import type { UserProfile } from "@/data/contracts";

// null = no session (index.tsx redirects to welcome).
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await getSession()) ? unwrap(await request<UserProfile>("/users/me")) : null,
    retry: false,
  });
}

export function useSaveDisplayName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      unwrap(await request<unknown>("/users/me", { method: "PATCH", body: { displayName } }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}
