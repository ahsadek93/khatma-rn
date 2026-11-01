import { request } from "@/data/http";
import { backendSuccess } from "@/data/results";
import type { CompletedKhatma, KhatmaMember, KhatmaSummary, KhatmaType } from "@/data/contracts";
export type { CompletedKhatma, KhatmaMember, KhatmaSummary, KhatmaType } from "@/data/contracts";

const idPath = (id: string) => encodeURIComponent(id);

export async function createKhatma(name: string) {
  return request<{ id: string; name: string }>("/khatmas", { method: "POST", body: { name } });
}

export async function createZikrKhatma(name: string, phrase: string, goalCount: number) {
  return request<{ id: string; name: string }>("/zikr/khatmas", { method: "POST", body: { name, phrase, goalCount } });
}

export async function joinKhatmaByCode(code: string) {
  return request<{ id: string; type: KhatmaType }>("/khatmas/join", { method: "POST", body: { code } });
}

export async function getKhatmaMembers(khatmaId: string) {
  return request<KhatmaMember[]>(`/khatmas/${idPath(khatmaId)}/members`);
}

export async function getKhatmaJoinCode(khatmaId: string) {
  const result = await request<{ joinCode: string | null }>(`/khatmas/${idPath(khatmaId)}/invite`);
  return result.error ? result : backendSuccess(result.data.joinCode);
}

export async function getMyActiveKhatmas(type: KhatmaType = "quran") {
  return request<KhatmaSummary[]>(`/khatmas?status=active&type=${type}`);
}

export async function getMyCompletedKhatmas(type: KhatmaType = "quran") {
  return request<CompletedKhatma[]>(`/khatmas?status=completed&type=${type}`);
}
