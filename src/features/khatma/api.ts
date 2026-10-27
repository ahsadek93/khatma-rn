import { backend } from "@/data";
import type { KhatmaType } from "@/data/contracts";
export type { CompletedKhatma, KhatmaMember, KhatmaSummary, KhatmaType } from "@/data/contracts";

export async function createKhatma(name: string) {
  return backend.khatma.createKhatma(name);
}

export async function createZikrKhatma(name: string, phrase: string, goalCount: number) {
  return backend.khatma.createZikrKhatma(name, phrase, goalCount);
}

export async function joinKhatmaByCode(code: string) {
  return backend.khatma.joinKhatmaByCode(code);
}

export async function getKhatmaMembers(khatmaId: string) {
  return backend.khatma.getKhatmaMembers(khatmaId);
}

export async function getKhatmaJoinCode(khatmaId: string) {
  return backend.khatma.getKhatmaJoinCode(khatmaId);
}

export async function getMyActiveKhatmas(type: KhatmaType = "quran") {
  return backend.khatma.getMyActiveKhatmas(type);
}

export async function getMyCompletedKhatmas(type: KhatmaType = "quran") {
  return backend.khatma.getMyCompletedKhatmas(type);
}
