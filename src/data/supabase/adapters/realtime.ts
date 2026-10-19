import type { SupabaseClient } from "@supabase/supabase-js";
import type { KhatmaRealtimeEvent, RealtimeBackend } from "../../contracts";

type Subscription = {
  channel: ReturnType<SupabaseClient["channel"]>;
  listeners: Set<(event: KhatmaRealtimeEvent) => void>;
};

export function createRealtimeAdapter(client: SupabaseClient): RealtimeBackend {
  const subscriptions = new Map<string, Subscription>();

  return {
    subscribeToKhatmaUpdates(khatmaId, type, listener) {
      const subscriptionKey = `${type}:${khatmaId}`;
      let subscription = subscriptions.get(subscriptionKey);
      if (!subscription) {
        const listeners = new Set<(event: KhatmaRealtimeEvent) => void>([listener]);
        const emit = (event: KhatmaRealtimeEvent) => {
          for (const subscriber of [...listeners]) subscriber(event);
        };
        let channel = client.channel(`khatma-updates:${type}:${khatmaId}`, {
          config: { postgres_changes_options: { wait: true } },
        });
        if (type === "quran") {
          channel = channel.on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "quran_khatma_juz",
            filter: `khatma_id=eq.${khatmaId}`,
          }, () => emit("progressChanged"));
        } else {
          channel = channel.on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "zikr_khatma_member_progress",
            filter: `khatma_id=eq.${khatmaId}`,
          }, () => emit("progressChanged"))
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "zikr_khatma_settings",
            filter: `khatma_id=eq.${khatmaId}`,
          }, () => emit("progressChanged"));
        }
        channel = channel.on("postgres_changes", {
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
        subscriptions.set(subscriptionKey, subscription);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") emit("connected");
        });
      } else {
        subscription.listeners.add(listener);
      }
      return () => {
        const current = subscriptions.get(subscriptionKey);
        if (current !== subscription) return;
        current.listeners.delete(listener);
        if (current.listeners.size === 0) {
          subscriptions.delete(subscriptionKey);
          void client.removeChannel(current.channel);
        }
      };
    },
  };
}
