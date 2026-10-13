import { backend } from "@/data";
import { backendNotConfigured, backendSuccess } from "@/data/results";

export async function getCurrentProfile() {
  if (!backend) return backendNotConfigured();
  const result = await backend.profile.getCurrentProfile();
  return result.error ? result : backendSuccess({ displayName: result.data.displayName, email: result.data.email });
}

export async function saveCurrentDisplayName(displayName: string) {
  return backend ? backend.profile.saveCurrentDisplayName(displayName) : backendNotConfigured();
}
