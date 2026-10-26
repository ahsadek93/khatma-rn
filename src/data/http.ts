import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BackendError, BackendResult } from "./contracts";
import { backendFailure, backendSuccess, unexpectedBackendError } from "./results";

type Session = { accessToken: string; refreshToken: string };
type RequestOptions = { method?: string; body?: unknown; auth?: boolean; retry?: boolean };

const sessionKey = "khatma.be.session";
const baseUrl = process.env.EXPO_PUBLIC_KHATMA_BE_URL?.replace(/\/$/, "");
let refreshing: Promise<BackendResult<Session>> | null = null;

export const isBackendConfigured = Boolean(baseUrl);

export async function getSession(): Promise<Session | null> {
  try {
    const value = await AsyncStorage.getItem(sessionKey);
    return value ? JSON.parse(value) as Session : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session) {
  await AsyncStorage.setItem(sessionKey, JSON.stringify(session));
}

export async function clearSession() {
  await AsyncStorage.removeItem(sessionKey);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<BackendResult<T>> {
  if (!baseUrl) return backendFailure({ code: "unavailable", message: "Backend is not configured" });
  try {
    const session = options.auth === false ? null : await getSession();
    if (options.auth !== false && !session) return backendFailure({ code: "unauthenticated", message: "No signed-in user" });
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    if (response.status === 401 && session && options.retry !== false) {
      const latest = await getSession();
      if (latest && latest.accessToken !== session.accessToken) return request(path, { ...options, retry: false });
      const refreshed = await refreshSession(session.refreshToken);
      if (!refreshed.error) return request(path, { ...options, retry: false });
      return backendFailure(refreshed.error);
    }
    if (!response.ok) return backendFailure(await responseError(response));
    if (response.status === 204) return backendSuccess(null as T);
    const text = await response.text();
    return backendSuccess((text ? JSON.parse(text) : null) as T);
  } catch (error) {
    return backendFailure({ ...unexpectedBackendError(error), code: "unavailable" });
  }
}

async function refreshSession(refreshToken: string): Promise<BackendResult<Session>> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const result = await request<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST", body: { refreshToken }, auth: false,
    });
    if (result.error) {
      const latest = await getSession();
      if (result.error.code === "unauthenticated" && latest?.refreshToken === refreshToken) await clearSession();
      return result;
    }
    const session = { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken };
    await saveSession(session);
    return backendSuccess(session);
  })().finally(() => { refreshing = null; });
  return refreshing;
}

async function responseError(response: Response): Promise<BackendError> {
  let message = response.statusText || `Request failed (${response.status})`;
  try {
    const body = await response.json() as { message?: string | string[] };
    if (Array.isArray(body.message)) message = body.message.join(", ");
    else if (body.message) message = body.message;
  } catch { /* Keep the status text when the response has no JSON body. */ }
  return {
    code: response.status === 401 ? "unauthenticated"
      : response.status === 409 ? "conflict"
        : response.status >= 500 ? "unavailable" : "unexpected",
    message,
  };
}

export function unavailable(error: unknown) {
  return backendFailure({ ...unexpectedBackendError(error), code: "unavailable" });
}
