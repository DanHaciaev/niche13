import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/admin/auth";
import { supabaseConfigured } from "@/lib/supabase/env";
import { LoginView } from "@/components/admin/LoginView";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage() {
  const state = await getAuthState();
  if (state.status === "admin") redirect("/admin");
  if (state.status === "needs-mfa") redirect("/admin/login/mfa");
  return <LoginView configured={supabaseConfigured} />;
}
