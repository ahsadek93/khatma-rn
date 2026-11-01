import { request } from "@/data/http";
import { backendSuccess } from "@/data/results";
import type { UserProfile } from "@/data/contracts";

export async function getCurrentProfile() {
  const result = await request<UserProfile>("/users/me");
  return result.error ? result : backendSuccess({ displayName: result.data.displayName, email: result.data.email });
}

export async function saveCurrentDisplayName(displayName: string) {
  const result = await request<unknown>("/users/me", { method: "PATCH", body: { displayName } });
  return result.error ? result : backendSuccess(null);
}
