import type { AppBackend, AuthUser, KhatmaRealtimeEvent, KhatmaType } from "./contracts";
import { backendFailure, backendSuccess } from "./results";
import { clearSession, getSession, isBackendConfigured, request, saveSession, unavailable } from "./http";

const idPath = (id: string) => encodeURIComponent(id);

export const backend: AppBackend = {
  auth: {
    async getCurrentUser() {
      if (!await getSession()) return backendSuccess(null);
      const result = await request<{ id: string; email: string }>("/users/me");
      return result.error ? result : backendSuccess({ id: result.data.id, email: result.data.email } satisfies AuthUser);
    },
    async sendSignInCode(email) {
      const result = await request<null>("/auth/otp/request", { method: "POST", body: { email }, auth: false });
      return result.error ? result : backendSuccess(null);
    },
    async verifySignInCode(email, token) {
      const result = await request<{ accessToken: string; refreshToken: string; user: AuthUser }>("/auth/otp/verify", {
        method: "POST", body: { email, token }, auth: false,
      });
      if (result.error) return result;
      try {
        await saveSession({ accessToken: result.data.accessToken, refreshToken: result.data.refreshToken });
        return backendSuccess({ id: result.data.user.id, email: result.data.user.email ?? null });
      } catch (error) {
        return unavailable(error);
      }
    },
    async signOut() {
      const session = await getSession();
      if (!session) return backendSuccess(null);
      const result = await request<null>("/auth/sign-out", { method: "POST", body: { refreshToken: session.refreshToken }, auth: false });
      try {
        await clearSession();
      } catch (error) {
        return unavailable(error);
      }
      return result.error ? result : backendSuccess(null);
    },
  },
  profile: {
    getCurrentProfile: () => request("/users/me"),
    async saveCurrentDisplayName(displayName) {
      const result = await request<unknown>("/users/me", { method: "PATCH", body: { displayName } });
      return result.error ? result : backendSuccess(null);
    },
  },
  khatma: {
    createKhatma: (name) => request("/khatmas", { method: "POST", body: { name } }),
    createZikrKhatma: (name, phrase, goalCount) => request("/zikr/khatmas", { method: "POST", body: { name, phrase, goalCount } }),
    joinKhatmaByCode: (code) => request("/khatmas/join", { method: "POST", body: { code } }),
    getKhatmaMembers: (id) => request(`/khatmas/${idPath(id)}/members`),
    async getKhatmaJoinCode(id) {
      const result = await request<{ joinCode: string }>(`/khatmas/${idPath(id)}/invite`);
      return result.error ? result : backendSuccess(result.data.joinCode);
    },
    getMyActiveKhatmas: (type: KhatmaType = "quran") => request(`/khatmas?status=active&type=${type}`),
    getMyCompletedKhatmas: (type: KhatmaType = "quran") => request(`/khatmas?status=completed&type=${type}`),
  },
  quran: {
    getKhatmaJuz: (id) => request(`/quran/khatmas/${idPath(id)}/juz`),
    getKhatmaQuranProgress: (id) => request(`/quran/khatmas/${idPath(id)}/progress`),
    claimJuz: (id, juzNumber) => action(`/quran/khatmas/${idPath(id)}/claim`, { juzNumber }),
    releaseJuz: (id, juzNumber) => action(`/quran/khatmas/${idPath(id)}/release`, { juzNumber }),
    completeJuz: (id, juzNumber) => action(`/quran/khatmas/${idPath(id)}/complete`, { juzNumber }),
  },
  zikr: {
    getKhatmaProgress: (id) => request(`/zikr/khatmas/${idPath(id)}/progress`),
    setClaim: (id, amount) => action(`/zikr/khatmas/${idPath(id)}/claim`, { amount }),
    releaseClaim: (id) => action(`/zikr/khatmas/${idPath(id)}/release`),
    completeClaim: (id) => action(`/zikr/khatmas/${idPath(id)}/complete`),
    updateSettings: (id, phrase, goalCount) => action(`/zikr/khatmas/${idPath(id)}/settings`, { phrase, goalCount }, "PATCH"),
  },
  realtime: {
    subscribeToKhatmaUpdates(id, _type, listener) {
      const xhr = new XMLHttpRequest();
      let cancelled = false;
      void subscribe(id, listener, xhr, () => cancelled).catch(() => {});
      return () => { cancelled = true; xhr.abort(); };
    },
  },
};

export { isBackendConfigured };

async function action(path: string, body?: unknown, method = "POST") {
  const result = await request<unknown>(path, { method, body });
  return result.error ? result : backendSuccess(null);
}

async function subscribe(id: string, listener: (event: KhatmaRealtimeEvent) => void, xhr: XMLHttpRequest, isCancelled: () => boolean) {
  const session = await getSession();
  if (!session || !isBackendConfigured || isCancelled()) return;
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
  xhr.open("GET", `${process.env.EXPO_PUBLIC_KHATMA_BE_URL?.replace(/\/$/, "")}/realtime/khatmas/${idPath(id)}/events`);
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
