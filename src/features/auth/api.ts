import { backend } from "@/data";

export async function getCurrentUser() {
  return backend.auth.getCurrentUser();
}

export async function sendSignInCode(email: string) {
  return backend.auth.sendSignInCode(email);
}

export async function verifySignInCode(email: string, token: string) {
  return backend.auth.verifySignInCode(email, token);
}

export async function signOut() {
  return backend.auth.signOut();
}
