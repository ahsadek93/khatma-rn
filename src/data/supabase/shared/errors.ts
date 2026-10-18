import type { BackendError, BackendResult } from "../../contracts";
import { backendFailure } from "../../results";

type ProviderError = { code?: string; status?: number; message?: string };

export function mapSupabaseError(error: unknown): BackendError {
  const providerError = error as ProviderError;
  const message = providerError?.message ?? String(error);

  if (providerError?.code === "23505" || providerError?.code === "23503") {
    return { code: "conflict", message };
  }
  if (providerError?.status === 401 || /authsessionmissing|not authenticated|no signed-in user/i.test(message)) {
    return { code: "unauthenticated", message };
  }
  if (providerError?.status && providerError.status >= 500) {
    return { code: "unavailable", message };
  }
  if (/network|fetch failed|timeout/i.test(message)) {
    return { code: "unavailable", message };
  }
  return {
    code: "unexpected",
    message: error instanceof Error ? error.message : String(error),
  };
}

export function failed<T = never>(error: unknown): BackendResult<T> {
  if (
    typeof error === "object" && error !== null &&
    "code" in error && "message" in error && typeof error.message === "string" &&
    ["unauthenticated", "conflict", "unavailable", "unexpected"].includes(String(error.code))
  ) {
    return backendFailure(error as BackendError);
  }
  return backendFailure(mapSupabaseError(error));
}
