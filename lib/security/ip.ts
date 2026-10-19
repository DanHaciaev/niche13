import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

function salt() {
  return process.env.IP_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

/** Salted one-way hash: lets us count requests per visitor without storing
 * anything that identifies them. */
export function hashValue(value: string) {
  return createHash("sha256").update(`${value}:${salt()}`).digest("hex");
}

/** The visitor's IP as reported by the hosting proxy. On Vercel and similar
 * platforms the first x-forwarded-for entry is set by the platform itself. */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function clientIpHash() {
  return hashValue(await clientIp());
}
