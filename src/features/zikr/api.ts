import { backend } from "@/data";
import { backendNotConfigured } from "@/data/results";
export type { ZikrKhatmaProgress } from "@/data/contracts";

export async function getKhatmaZikrProgress(khatmaId: string) {
  return backend ? backend.zikr.getKhatmaProgress(khatmaId) : backendNotConfigured();
}

export const setZikrClaim = (khatmaId: string, amount: number) =>
  backend ? backend.zikr.setClaim(khatmaId, amount) : backendNotConfigured();

export const releaseZikrClaim = (khatmaId: string) =>
  backend ? backend.zikr.releaseClaim(khatmaId) : backendNotConfigured();

export const completeZikrClaim = (khatmaId: string) =>
  backend ? backend.zikr.completeClaim(khatmaId) : backendNotConfigured();

export const updateZikrKhatmaSettings = (khatmaId: string, phrase: string, goalCount: number) =>
  backend ? backend.zikr.updateSettings(khatmaId, phrase, goalCount) : backendNotConfigured();
