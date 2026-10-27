import { backend } from "@/data";
export type { KhatmaQuranProgress, QuranJuz } from "@/data/contracts";

export async function getKhatmaJuz(khatmaId: string) {
  return backend.quran.getKhatmaJuz(khatmaId);
}

export async function getKhatmaQuranProgress(khatmaId: string) {
  return backend.quran.getKhatmaQuranProgress(khatmaId);
}

export const claimJuz = (khatmaId: string, juzNumber: number) => backend.quran.claimJuz(khatmaId, juzNumber);
export const releaseJuz = (khatmaId: string, juzNumber: number) => backend.quran.releaseJuz(khatmaId, juzNumber);
export const completeJuz = (khatmaId: string, juzNumber: number) => backend.quran.completeJuz(khatmaId, juzNumber);
