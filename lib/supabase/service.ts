import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/** Service-role client: bypasses Row Level Security. Only for server code that
 * has already validated its input (public form submissions, page-view
 * tracking). Never use it for anything an admin does — admin code goes
 * through the signed-in session so RLS still applies. `server-only` makes the
 * build fail if this file is ever imported into browser code. */
export function serviceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) return null;
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
