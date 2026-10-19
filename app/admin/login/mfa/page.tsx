import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/admin/auth";
import { MfaView } from "@/components/admin/MfaView";

export const metadata: Metadata = { title: "Код подтверждения" };

export default async function MfaPage() {
  const state = await getAuthState();
  if (state.status === "admin") redirect("/admin");
  if (state.status !== "needs-mfa") redirect("/admin/login");
  return <MfaView />;
}
