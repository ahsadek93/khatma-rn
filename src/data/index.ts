import { backend, isBackendConfigured } from "./supabase/provider";
import type { KhatmaRealtimeEvent } from "./contracts";

export function subscribeToKhatmaUpdates(
  khatmaId: string,
  listener: (event: KhatmaRealtimeEvent) => void,
): () => void {
  return backend?.realtime.subscribeToKhatmaUpdates(khatmaId, listener) ?? (() => {});
}

export { backend, isBackendConfigured };
