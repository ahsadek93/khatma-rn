import { createSupabaseBackend } from "./supabase/adapter";
import { isSupabaseConfigured, supabase } from "./supabase/client";

export const isBackendConfigured = isSupabaseConfigured;
export const backend = supabase ? createSupabaseBackend(supabase) : null;
