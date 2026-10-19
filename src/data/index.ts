import { backend, isBackendConfigured } from "./supabase/provider";
import type { KhatmaRealtimeEvent, KhatmaType } from "./contracts";

export function subscribeToKhatmaUpdates(
  khatmaId: string,
  type: KhatmaType,
  listener: (event: KhatmaRealtimeEvent) => void,
): () => void {
  return backend?.realtime.subscribeToKhatmaUpdates(khatmaId, type, listener) ?? (() => {});
}

export { backend, isBackendConfigured };
