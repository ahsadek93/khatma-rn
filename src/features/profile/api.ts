import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession, request } from "@/data/http";
import { unwrap } from "@/data/results";
import type { UserProfile } from "@/data/contracts";

type Me = UserProfile;

// null = no session (index.tsx redirects to welcome).
export function useMe<T = Me | null>(select?: (me: Me | null) => T) {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await getSession()) ? unwrap(await request<Me>("/users/me")) : null,
    select,
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
