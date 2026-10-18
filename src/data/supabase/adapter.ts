import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppBackend } from "../contracts";
import { createKhatmaAdapter } from "./adapters/khatma";
import { createQuranAdapter } from "./adapters/quran";
import { createAuthAdapter } from "./adapters/auth";
import { createProfileAdapter } from "./adapters/profile";
import { createRealtimeAdapter } from "./adapters/realtime";

export function createSupabaseBackend(client: SupabaseClient): AppBackend {
  return {
    auth: createAuthAdapter(client),
    profile: createProfileAdapter(client),
    khatma: createKhatmaAdapter(client),
    quran: createQuranAdapter(client),
    realtime: createRealtimeAdapter(client),
  };
}
