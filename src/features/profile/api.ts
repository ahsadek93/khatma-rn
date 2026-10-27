import { backend } from "@/data";
import { backendSuccess } from "@/data/results";

export async function getCurrentProfile() {
  const result = await backend.profile.getCurrentProfile();
  return result.error ? result : backendSuccess({ displayName: result.data.displayName, email: result.data.email });
}

export async function saveCurrentDisplayName(displayName: string) {
  return backend.profile.saveCurrentDisplayName(displayName);
}
