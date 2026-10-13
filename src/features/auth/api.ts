import { backend } from "@/backend";
import { backendNotConfigured } from "@/backend/results";

export async function sendSignInCode(email: string) {
  return backend ? backend.auth.sendSignInCode(email) : backendNotConfigured();
}

export async function verifySignInCode(email: string, token: string) {
  return backend ? backend.auth.verifySignInCode(email, token) : backendNotConfigured();
}

export async function signOut() {
  return backend ? backend.auth.signOut() : backendNotConfigured();
}
