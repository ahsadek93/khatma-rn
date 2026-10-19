import type { SupabaseClient } from "@supabase/supabase-js";
import type { KhatmaRealtimeEvent, RealtimeBackend } from "../../contracts";

type Subscription = {
  channel: ReturnType<SupabaseClient["channel"]>;
  listeners: Set<(event: KhatmaRealtimeEvent) => void>;
};

export function createRealtimeAdapter(client: SupabaseClient): RealtimeBackend {
  const subscriptions = new Map<string, Subscription>();

  return {
    subscribeToKhatmaUpdates(khatmaId, listener) {
      let subscription = subscriptions.get(khatmaId);
      if (!subscription) {
        const listeners = new Set<(event: KhatmaRealtimeEvent) => void>([listener]);
        const emit = (event: KhatmaRealtimeEvent) => {
          for (const subscriber of [...listeners]) subscriber(event);
        };
        const channel = client
          .channel(`khatma-updates:${khatmaId}`)
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "quran_khatma_juz",
            filter: `khatma_id=eq.${khatmaId}`,
          }, () => emit("progressChanged"))
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "khatma_members",
            filter: `khatma_id=eq.${khatmaId}`,
          }, () => emit("membersChanged"));
        channel.on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "khatmas",
          filter: `id=eq.${khatmaId}`,
        }, (payload) => {
          if (payload.new.status === "completed") emit("completed");
        });
        subscription = { channel, listeners };
        subscriptions.set(khatmaId, subscription);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") emit("connected");
        });
      } else {
        subscription.listeners.add(listener);
      }
      return () => {
        const current = subscriptions.get(khatmaId);
        if (current !== subscription) return;
        current.listeners.delete(listener);
        if (current.listeners.size === 0) {
          subscriptions.delete(khatmaId);
          void client.removeChannel(current.channel);
        }
      };
    },
  };
}
