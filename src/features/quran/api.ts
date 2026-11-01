import { request } from "@/data/http";
import { backendSuccess } from "@/data/results";
import type { KhatmaQuranProgress, QuranJuz } from "@/data/contracts";
export type { KhatmaQuranProgress, QuranJuz } from "@/data/contracts";

const idPath = (id: string) => encodeURIComponent(id);

export async function getKhatmaJuz(khatmaId: string) {
  return request<QuranJuz[]>(`/quran/khatmas/${idPath(khatmaId)}/juz`);
}

export async function getKhatmaQuranProgress(khatmaId: string) {
  return request<KhatmaQuranProgress>(`/quran/khatmas/${idPath(khatmaId)}/progress`);
}

export const claimJuz = (khatmaId: string, juzNumber: number) => action(`/quran/khatmas/${idPath(khatmaId)}/claim`, { juzNumber });
export const releaseJuz = (khatmaId: string, juzNumber: number) => action(`/quran/khatmas/${idPath(khatmaId)}/release`, { juzNumber });
export const completeJuz = (khatmaId: string, juzNumber: number) => action(`/quran/khatmas/${idPath(khatmaId)}/complete`, { juzNumber });

async function action(path: string, body: unknown) {
  const result = await request<unknown>(path, { method: "POST", body });
  return result.error ? result : backendSuccess(null);
}
