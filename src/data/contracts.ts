export type BackendError = {
  code: "unauthenticated" | "conflict" | "unavailable" | "unexpected";
  message: string;
};

export type BackendResult<T> = { data: T; error: null } | { data: null; error: BackendError };

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

export interface AuthBackend {
  getCurrentUser(): Promise<BackendResult<AuthUser | null>>;
  sendSignInCode(email: string): Promise<BackendResult<null>>;
  verifySignInCode(email: string, token: string): Promise<BackendResult<AuthUser>>;
  signOut(): Promise<BackendResult<null>>;
}

export interface ProfileBackend {
  getCurrentProfile(): Promise<BackendResult<UserProfile>>;
  saveCurrentDisplayName(displayName: string): Promise<BackendResult<null>>;
}

export interface KhatmaBackend {
  createKhatma(name: string): Promise<BackendResult<{ id: string; name: string }>>;
  createZikrKhatma(name: string, phrase: string, goalCount: number): Promise<BackendResult<{ id: string; name: string }>>;
  joinKhatmaByCode(code: string): Promise<BackendResult<{ id: string; type: KhatmaType }>>;
  getKhatmaMembers(khatmaId: string): Promise<BackendResult<KhatmaMember[]>>;
  getKhatmaJoinCode(khatmaId: string): Promise<BackendResult<string | null>>;
  getMyActiveKhatma(type?: KhatmaType): Promise<BackendResult<KhatmaSummary | null>>;
  getMyCompletedKhatmas(type?: KhatmaType): Promise<BackendResult<CompletedKhatma[]>>;
}

export interface QuranBackend {
  getKhatmaJuz(khatmaId: string): Promise<BackendResult<QuranJuz[]>>;
  getKhatmaQuranProgress(khatmaId: string): Promise<BackendResult<KhatmaQuranProgress>>;
  claimJuz(khatmaId: string, juzNumber: number): Promise<BackendResult<null>>;
  releaseJuz(khatmaId: string, juzNumber: number): Promise<BackendResult<null>>;
  completeJuz(khatmaId: string, juzNumber: number): Promise<BackendResult<null>>;
}

export interface ZikrBackend {
  getKhatmaProgress(khatmaId: string): Promise<BackendResult<ZikrKhatmaProgress>>;
  setClaim(khatmaId: string, amount: number): Promise<BackendResult<null>>;
  releaseClaim(khatmaId: string): Promise<BackendResult<null>>;
  completeClaim(khatmaId: string): Promise<BackendResult<null>>;
  updateSettings(khatmaId: string, phrase: string, goalCount: number): Promise<BackendResult<null>>;
}

export interface RealtimeBackend {
  subscribeToKhatmaUpdates(khatmaId: string, type: KhatmaType, listener: (event: KhatmaRealtimeEvent) => void): () => void;
}

export interface AppBackend {
  auth: AuthBackend;
  profile: ProfileBackend;
  khatma: KhatmaBackend;
  quran: QuranBackend;
  zikr: ZikrBackend;
  realtime: RealtimeBackend;
}
