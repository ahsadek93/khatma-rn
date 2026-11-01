export type BackendError = {
  code: "unauthenticated" | "conflict" | "unavailable" | "unexpected";
  message: string;
};

export type BackendResult<T> = { data: T; error: null } | { data: null; error: BackendError };
export type PaginatedResponse<T> = {
  data: T[];
  pagination: { currentPage: number; perPage: number; pages: number; from: number; to: number; total: number };
};

export type AuthUser = { id: string; email: string | null };
export type UserProfile = { displayName: string; email: string };
export type KhatmaType = "quran" | "zikr";
export type KhatmaSummary = { id: string; name: string; type: KhatmaType; memberCount: number };
export type CompletedKhatma = { id: string; name: string; type: KhatmaType; completedAt: string };
export type KhatmaMember = { userId: string; displayName: string | null; role: "owner" | "member"; joinedAt: string };
export type QuranJuz = { juzNumber: number; status: "free" | "claimed" | "completed"; claimedBy: string | null; claimedByName: string | null };
export type KhatmaQuranProgress = { completedJuz: number; selectedJuz: number[] };
export type ZikrKhatmaProgress = {
  phrase: string;
  goalCount: number;
  completedCount: number;
  pendingCount: number;
  myPendingCount: number;
};
export type KhatmaRealtimeEvent = "connected" | "progressChanged" | "membersChanged" | "completed";
