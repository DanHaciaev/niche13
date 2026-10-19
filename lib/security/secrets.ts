import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/* Secrets the admin types into Settings (mail password, bot token) are stored
   encrypted with AES-256-GCM. The key lives only on the server, so a leaked
   database dump or a peek at the settings table shows nothing usable. */

function key() {
  const source = process.env.SECRETS_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!source) throw new Error("No server key to encrypt settings with");
  return createHash("sha256").update(`niche-settings:${source}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

/** Null if missing, tampered with, or encrypted with a different key (e.g.
 * after the Supabase service key was rotated — then it must be re-entered). */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const [version, iv, tag, data] = stored.split(":");
  if (version !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
