import { request } from "@/data/http";
import { backendSuccess } from "@/data/results";
import type { ZikrKhatmaProgress } from "@/data/contracts";
export type { ZikrKhatmaProgress } from "@/data/contracts";

const idPath = (id: string) => encodeURIComponent(id);

export async function getKhatmaZikrProgress(khatmaId: string) {
  return request<ZikrKhatmaProgress>(`/zikr/khatmas/${idPath(khatmaId)}/progress`);
}

export const setZikrClaim = (khatmaId: string, amount: number) =>
  action(`/zikr/khatmas/${idPath(khatmaId)}/claim`, { amount });

export const releaseZikrClaim = (khatmaId: string) =>
  action(`/zikr/khatmas/${idPath(khatmaId)}/release`);

export const completeZikrClaim = (khatmaId: string) =>
  action(`/zikr/khatmas/${idPath(khatmaId)}/complete`);

export const updateZikrKhatmaSettings = (khatmaId: string, phrase: string, goalCount: number) =>
  action(`/zikr/khatmas/${idPath(khatmaId)}/settings`, { phrase, goalCount }, "PATCH");

async function action(path: string, body?: unknown, method = "POST") {
  const result = await request<unknown>(path, { method, body });
  return result.error ? result : backendSuccess(null);
}
