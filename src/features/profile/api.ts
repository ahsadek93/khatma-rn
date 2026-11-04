import { useQuery } from "@tanstack/react-query";
import { getSession, request } from "@/data/http";
import { backendSuccess, unwrap } from "@/data/results";
import type { UserProfile } from "@/data/contracts";

type Me = UserProfile;

// null = no session (index.tsx redirects to welcome).
export function useMe<T = Me | null>(select?: (me: Me | null) => T) {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await getSession()) ? unwrap(await request<Me>("/users/me")) : null,
    select,
  });
}

export async function saveCurrentDisplayName(displayName: string) {
  const result = await request<unknown>("/users/me", { method: "PATCH", body: { displayName } });
  return result.error ? result : backendSuccess(null);
}
