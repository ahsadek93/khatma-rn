import type { BackendError, BackendResult } from "./contracts";

export function backendSuccess<T>(data: T): BackendResult<T> {
  return { data, error: null };
}

export function backendFailure<T = never>(error: BackendError): BackendResult<T> {
  return { data: null, error };
}

// Throws the BackendError itself (not an Error) so `query.error.code` works.
export function unwrap<T>(result: BackendResult<T>): T {
  if (result.error) throw result.error;
  return result.data;
}

export function unexpectedBackendError(error: unknown): BackendError {
  return {
    code: "unexpected",
    message: error instanceof Error ? error.message : String(error),
  };
}
