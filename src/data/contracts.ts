export type BackendError = {
  code: "unauthenticated" | "conflict" | "unavailable" | "unexpected";
  message: string;
};

export type BackendResult<T> = { data: T; error: null } | { data: null; error: BackendError };

export type AuthUser = { id: string; email: string | null };
export type UserProfile = { displayName: string; email: string };
export type KhatmaSummary = { id: string; name: string; memberCount: number };
export type CompletedKhatma = { id: string; name: string; completedAt: string };
export type KhatmaMember = { userId: string; role: "owner" | "member"; joinedAt: string };
export type QuranJuz = { juzNumber: number; status: "free" | "claimed" | "completed"; claimedBy: string | null; claimedByName: string | null };
export type KhatmaQuranProgress = { completedJuz: number; selectedJuz: number[] };

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
  joinKhatmaByCode(code: string): Promise<BackendResult<string>>;
  getKhatmaMembers(khatmaId: string): Promise<BackendResult<KhatmaMember[]>>;
  getKhatmaJoinCode(khatmaId: string): Promise<BackendResult<string | null>>;
  getMyActiveKhatma(): Promise<BackendResult<KhatmaSummary | null>>;
  getMyCompletedKhatmas(): Promise<BackendResult<CompletedKhatma[]>>;
}

export interface QuranBackend {
  getKhatmaJuz(khatmaId: string): Promise<BackendResult<QuranJuz[]>>;
  getKhatmaQuranProgress(khatmaId: string): Promise<BackendResult<KhatmaQuranProgress>>;
  claimJuz(khatmaId: string, juzNumber: number): Promise<BackendResult<null>>;
  releaseJuz(khatmaId: string, juzNumber: number): Promise<BackendResult<null>>;
  completeJuz(khatmaId: string, juzNumber: number): Promise<BackendResult<null>>;
}

export interface AppBackend {
  auth: AuthBackend;
  profile: ProfileBackend;
  khatma: KhatmaBackend;
  quran: QuranBackend;
}
