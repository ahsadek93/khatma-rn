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
