import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { getSession, baseUrl } from "@/data/http";
import type { KhatmaRealtimeEvent } from "@/data/contracts";

export function subscribeToKhatmaUpdates(khatmaId: string, listener: (event: KhatmaRealtimeEvent) => void) {
  const xhr = new XMLHttpRequest();
  let cancelled = false;
  void subscribe(khatmaId, listener, xhr, () => cancelled).catch(() => {});
  return () => { cancelled = true; xhr.abort(); };
}

async function subscribe(khatmaId: string, listener: (event: KhatmaRealtimeEvent) => void, xhr: XMLHttpRequest, isCancelled: () => boolean) {
  const session = await getSession();
  if (!session || !baseUrl || isCancelled()) return;
  let offset = 0;
  let pending = "";
  let event = "message";
  let data: string[] = [];
  const emit = () => {
    if (data.length && ["connected", "progressChanged", "membersChanged", "completed"].includes(event)) {
      listener(event as KhatmaRealtimeEvent);
    }
    event = "message";
    data = [];
  };
  xhr.open("GET", `${baseUrl}/realtime/khatmas/${encodeURIComponent(khatmaId)}/events`);
  xhr.setRequestHeader("Accept", "text/event-stream");
  xhr.setRequestHeader("Authorization", `Bearer ${session.accessToken}`);
  xhr.onprogress = () => {
    // shortcut: responseText grows for the stream lifetime; use a streaming SSE client if this becomes material.
    pending += xhr.responseText.slice(offset);
    offset = xhr.responseText.length;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";
    for (const line of lines) {
      if (!line) emit();
      else if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
  };
  xhr.send();
}

export function useKhatmaRealtime(ids: string[]) {
  const queryClient = useQueryClient();
  const key = ids.join(",");
  // shortcut: a stream that drops while the app stays in the foreground (backend restart, network switch) stays dead,
  // and any id-set change reconnects all streams; reconnect in xhr.onloadend when not cancelled if this matters.
  const focusedBefore = useRef(false);
  useFocusEffect(useCallback(() => {
    const keyIds = key ? key.split(",") : [];
    if (!keyIds.length) return;
    let unsubscribes: (() => void)[] = [];
    const close = () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    const catchUp = () => {
      keyIds.forEach((id) => void queryClient.invalidateQueries({ queryKey: ["khatma", id] }));
      void queryClient.invalidateQueries({ queryKey: ["khatmas"] });
    };
    const connect = () => {
      unsubscribes = keyIds.map((id) =>
        subscribeToKhatmaUpdates(id, (event) => {
          if (event === "connected") return;
          void queryClient.invalidateQueries({ queryKey: ["khatma", id] });
          if (event === "completed" || event === "membersChanged") {
            void queryClient.invalidateQueries({ queryKey: ["khatmas"] });
          }
        }),
      );
    };
    // mount already fetches; on refocus catch up on events missed while streams were closed
    if (focusedBefore.current) catchUp();
    focusedBefore.current = true;
    connect();
    // backgrounding kills the streams without blurring the screen, so reopen them on foreground
    const appState = AppState.addEventListener("change", (status) => {
      if (status !== "active") return;
      close();
      catchUp();
      connect();
    });
    return () => {
      appState.remove();
      close();
    };
  }, [key, queryClient]));
}
