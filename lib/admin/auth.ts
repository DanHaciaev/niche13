import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export interface AdminSession {
  supabase: Awaited<ReturnType<typeof sessionClient>>;
  userId: string;
  email: string;
}

export type AuthState =
  | { status: "signed-out" }
  /** Password is right, but the authenticator code is still missing. */
  | { status: "needs-mfa"; supabase: AdminSession["supabase"] }
  /** Signed in, but not listed in the admins table. */
  | { status: "forbidden" }
  | { status: "admin"; admin: AdminSession };

/** Where the current visitor stands. `getUser()` validates the token with
 * Supabase Auth (cookies alone could be forged); the assurance level tells
 * whether a second factor is owed; the admins table decides access.
 * Cached per request. */
export const getAuthState = cache(async (): Promise<AuthState> => {
  if (!supabaseConfigured) return { status: "signed-out" };

  const supabase = await sessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed-out" };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    return { status: "needs-mfa", supabase };
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return { status: "forbidden" };

  return { status: "admin", admin: { supabase, userId: user.id, email: user.email ?? "" } };
});

export async function getAdmin(): Promise<AdminSession | null> {
  const state = await getAuthState();
  return state.status === "admin" ? state.admin : null;
}

/** Use at the top of every admin page AND every admin Server Action. Server
 * Actions are public HTTP endpoints, so the layout's check alone is not
 * enough. */
export async function requireAdmin(): Promise<AdminSession> {
  const state = await getAuthState();
  if (state.status === "admin") return state.admin;
  redirect(state.status === "needs-mfa" ? "/admin/login/mfa" : "/admin/login");
}
