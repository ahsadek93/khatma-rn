import { backend } from "@/backend";
import { backendNotConfigured } from "@/backend/results";
export type { KhatmaQuranProgress, QuranJuz } from "@/backend/contracts";

export async function getKhatmaJuz(khatmaId: string) {
  return backend ? backend.quran.getKhatmaJuz(khatmaId) : backendNotConfigured();
}

export async function getKhatmaQuranProgress(khatmaId: string) {
  return backend ? backend.quran.getKhatmaQuranProgress(khatmaId) : backendNotConfigured();
}

export const claimJuz = (khatmaId: string, juzNumber: number) => backend ? backend.quran.claimJuz(khatmaId, juzNumber) : backendNotConfigured();
export const releaseJuz = (khatmaId: string, juzNumber: number) => backend ? backend.quran.releaseJuz(khatmaId, juzNumber) : backendNotConfigured();
export const completeJuz = (khatmaId: string, juzNumber: number) => backend ? backend.quran.completeJuz(khatmaId, juzNumber) : backendNotConfigured();
