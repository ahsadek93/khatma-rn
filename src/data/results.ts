import type { BackendError, BackendResult } from "./contracts";

export function backendSuccess<T>(data: T): BackendResult<T> {
  return { data, error: null };
}

export function backendFailure<T = never>(error: BackendError): BackendResult<T> {
  return { data: null, error };
}

export function unexpectedBackendError(error: unknown): BackendError {
  return {
    code: "unexpected",
    message: error instanceof Error ? error.message : String(error),
  };
}

export function backendNotConfigured<T = never>(): BackendResult<T> {
  return backendFailure({ code: "unavailable", message: "Backend is not configured" });
}
