import { createSupabaseBackend } from "./adapter";
import { isSupabaseConfigured, supabase } from "./client";

export const isBackendConfigured = isSupabaseConfigured;
export const backend = supabase ? createSupabaseBackend(supabase) : null;
