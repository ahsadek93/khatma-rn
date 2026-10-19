import { backend } from "@/data";
import type { KhatmaType } from "@/data/contracts";
import { backendNotConfigured } from "@/data/results";
export type { CompletedKhatma, KhatmaMember, KhatmaSummary, KhatmaType } from "@/data/contracts";

export async function createKhatma(name: string) {
  return backend ? backend.khatma.createKhatma(name) : backendNotConfigured();
}

export async function createZikrKhatma(name: string, phrase: string, goalCount: number) {
  return backend ? backend.khatma.createZikrKhatma(name, phrase, goalCount) : backendNotConfigured();
}

export async function joinKhatmaByCode(code: string) {
  return backend ? backend.khatma.joinKhatmaByCode(code) : backendNotConfigured();
}

export async function getKhatmaMembers(khatmaId: string) {
  return backend ? backend.khatma.getKhatmaMembers(khatmaId) : backendNotConfigured();
}

export async function getKhatmaJoinCode(khatmaId: string) {
  return backend ? backend.khatma.getKhatmaJoinCode(khatmaId) : backendNotConfigured();
}

export async function getMyActiveKhatma(type: KhatmaType = "quran") {
  return backend ? backend.khatma.getMyActiveKhatma(type) : backendNotConfigured();
}

export async function getMyCompletedKhatmas(type: KhatmaType = "quran") {
  return backend ? backend.khatma.getMyCompletedKhatmas(type) : backendNotConfigured();
}
