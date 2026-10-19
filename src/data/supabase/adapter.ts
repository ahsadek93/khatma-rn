import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppBackend } from "../contracts";
import { createKhatmaAdapter } from "./adapters/khatma";
import { createQuranAdapter } from "./adapters/quran";
import { createAuthAdapter } from "./adapters/auth";
import { createProfileAdapter } from "./adapters/profile";
import { createRealtimeAdapter } from "./adapters/realtime";
import { createZikrAdapter } from "./adapters/zikr";

export function createSupabaseBackend(client: SupabaseClient): AppBackend {
  return {
    auth: createAuthAdapter(client),
    profile: createProfileAdapter(client),
    khatma: createKhatmaAdapter(client),
    quran: createQuranAdapter(client),
    zikr: createZikrAdapter(client),
    realtime: createRealtimeAdapter(client),
  };
}
