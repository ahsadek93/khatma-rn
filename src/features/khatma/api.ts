import { backend } from "@/data";
import { backendNotConfigured } from "@/data/results";
export type { CompletedKhatma, KhatmaMember, KhatmaSummary } from "@/data/contracts";

export async function createKhatma(name: string) {
  return backend ? backend.khatma.createKhatma(name) : backendNotConfigured();
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

export async function getMyActiveKhatma() {
  return backend ? backend.khatma.getMyActiveKhatma() : backendNotConfigured();
}

export async function getMyCompletedKhatmas() {
  return backend ? backend.khatma.getMyCompletedKhatmas() : backendNotConfigured();
}
