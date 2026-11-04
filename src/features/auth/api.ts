import { backendSuccess } from "@/data/results";
import { clearSession, getSession, request, saveSession, unavailable } from "@/data/http";
import { queryClient } from "@/data/query";
import type { AuthUser } from "@/data/contracts";

export async function sendSignInCode(email: string) {
  const result = await request<null>("/auth/otp/request", { method: "POST", body: { email }, auth: false });
  return result.error ? result : backendSuccess(null);
}

export async function verifySignInCode(email: string, token: string) {
  const result = await request<{ accessToken: string; refreshToken: string; user: AuthUser }>("/auth/otp/verify", {
    method: "POST", body: { email, token }, auth: false,
  });
  if (result.error) return result;
  try {
    await saveSession({ accessToken: result.data.accessToken, refreshToken: result.data.refreshToken });
    queryClient.clear(); // /auth/otp/verify has no displayName, so ["me"] refetches
    return backendSuccess({ id: result.data.user.id, email: result.data.user.email ?? null });
  } catch (error) {
    return unavailable(error);
  }
}

export async function signOut() {
  const session = await getSession();
  if (!session) {
    queryClient.clear();
    return backendSuccess(null);
  }
  const result = await request<null>("/auth/sign-out", { method: "POST", body: { refreshToken: session.refreshToken }, auth: false });
  try {
    await clearSession();
    queryClient.clear();
  } catch (error) {
    return unavailable(error);
  }
  return result.error ? result : backendSuccess(null);
}
