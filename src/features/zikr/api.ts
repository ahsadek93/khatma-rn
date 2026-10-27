import { backend } from "@/data";
export type { ZikrKhatmaProgress } from "@/data/contracts";

export async function getKhatmaZikrProgress(khatmaId: string) {
  return backend.zikr.getKhatmaProgress(khatmaId);
}

export const setZikrClaim = (khatmaId: string, amount: number) =>
  backend.zikr.setClaim(khatmaId, amount);

export const releaseZikrClaim = (khatmaId: string) =>
  backend.zikr.releaseClaim(khatmaId);

export const completeZikrClaim = (khatmaId: string) =>
  backend.zikr.completeClaim(khatmaId);

export const updateZikrKhatmaSettings = (khatmaId: string, phrase: string, goalCount: number) =>
  backend.zikr.updateSettings(khatmaId, phrase, goalCount);
