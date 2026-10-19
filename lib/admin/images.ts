import "server-only";
import { randomUUID } from "node:crypto";
import { supabaseUrl } from "@/lib/supabase/env";
import { rebuildImage } from "@/lib/security/files";
import type { AdminSession } from "./auth";

export const BUCKET = "product-images";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 12;

const PUBLIC_PREFIX = () => `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;

const SIGNATURES: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    type: "image/webp",
    ext: "webp",
    test: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
  { type: "image/avif", ext: "avif", test: (b) => String.fromCharCode(...b.slice(4, 12)) === "ftypavif" },
];

/** An image reference is either a file shipped in /public or one uploaded to
 * our own bucket. Anything else (other hosts, javascript:, //evil) is
 * dropped, so a tampered form can't point the site at foreign content. */
export function isAllowedImage(url: string) {
  if (/^\/(?!\/)[A-Za-z0-9._/-]{1,200}$/.test(url)) return true;
  return Boolean(supabaseUrl) && url.startsWith(PUBLIC_PREFIX()) && !url.includes("..");
}

export function readImageList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(isAllowedImage);
}

export function newFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((v): v is File => v instanceof File && v.size > 0)
    .slice(0, MAX_FILES);
}

/** Uploads after checking real file content and size; returns public URLs,
 * or an error message for the admin. Every photo is rebuilt from its pixels
 * as WebP (nothing hidden in the original survives, GPS/EXIF is stripped)
 * and capped at 2560px — plenty for a full-screen product shot. */
export async function uploadImages(
  admin: AdminSession,
  files: File[],
  folder: string,
): Promise<{ urls: string[] } | { error: string }> {
  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) return { error: `Файл «${file.name}» больше 10 МБ` };
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const sig = SIGNATURES.find((s) => s.test(head));
    if (!sig) return { error: `«${file.name}» — не JPG, PNG, WebP или AVIF` };
    const clean = await rebuildImage(file, { format: "webp", maxSide: 2560 });
    if (!clean) return { error: `«${file.name}» повреждён или слишком большой по размеру в пикселях` };

    const path = `${folder}/${randomUUID()}.${clean.ext}`;
    const { error } = await admin.supabase.storage
      .from(BUCKET)
      .upload(path, clean.buffer, { contentType: clean.contentType, cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("[admin] upload failed", error);
      return { error: "Не удалось загрузить фото. Проверьте, что выполнен schema.sql." };
    }
    urls.push(admin.supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return { urls };
}

/** Removes uploaded files that are no longer used. Local /public images are
 * left alone. Failures are logged, not surfaced: the content is saved either
 * way and an orphaned file is harmless. */
export async function removeImages(admin: AdminSession, urls: string[]) {
  const prefix = PUBLIC_PREFIX();
  const paths = urls.filter((u) => u.startsWith(prefix)).map((u) => u.slice(prefix.length));
  if (paths.length === 0) return;
  const { error } = await admin.supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error("[admin] remove images failed", error);
}
