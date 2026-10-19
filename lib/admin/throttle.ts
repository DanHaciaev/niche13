import "server-only";
import { serviceClient } from "@/lib/supabase/service";
import { clientIpHash, hashValue } from "@/lib/security/ip";

const WINDOW_MINUTES = 15;
/** Failed attempts allowed per IP, and per account from all IPs combined
 * (the second stops a botnet from guessing one admin's password slowly). */
const MAX_PER_IP = 5;
const MAX_PER_ACCOUNT = 10;

export interface ThrottleKey {
  ipHash: string;
  emailHash: string;
}

export async function throttleKey(email: string): Promise<ThrottleKey> {
  return { ipHash: await clientIpHash(), emailHash: hashValue(email.trim().toLowerCase()) };
}

/** True when this IP or this account has failed too often recently. Fails
 * open (allows the attempt) if the database is unreachable — Supabase's own
 * auth rate limits still apply in that case. */
export async function isThrottled(key: ThrottleKey) {
  const supabase = serviceClient();
  if (!supabase) return false;
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const [byIp, byEmail] = await Promise.all([
    supabase
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", key.ipHash)
      .gte("created_at", since),
    supabase
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("email_hash", key.emailHash)
      .gte("created_at", since),
  ]);
  if (byIp.error || byEmail.error) {
    console.error("[throttle] check failed", byIp.error ?? byEmail.error);
    return false;
  }
  return (byIp.count ?? 0) >= MAX_PER_IP || (byEmail.count ?? 0) >= MAX_PER_ACCOUNT;
}

export async function recordFailure(key: ThrottleKey) {
  const supabase = serviceClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("admin_login_attempts")
    .insert({ ip_hash: key.ipHash, email_hash: key.emailHash });
  if (error) console.error("[throttle] record failed", error);
  // Keep the table small: attempts older than a day are irrelevant.
  await supabase
    .from("admin_login_attempts")
    .delete()
    .lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
}

/** A successful sign-in clears that account's failures from this IP. */
export async function clearFailures(key: ThrottleKey) {
  const supabase = serviceClient();
  if (!supabase) return;
  await supabase.from("admin_login_attempts").delete().eq("ip_hash", key.ipHash).eq("email_hash", key.emailHash);
}
