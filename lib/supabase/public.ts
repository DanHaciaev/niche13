import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseConfigured, supabaseUrl } from "./env";

let client: SupabaseClient | null = null;

/** Anonymous, cookie-less client for reading public catalog data. Because it
 * never touches request cookies, pages using it can stay statically cached.
 * Row Level Security limits it to what visitors are allowed to see. */
export function publicClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  client ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
