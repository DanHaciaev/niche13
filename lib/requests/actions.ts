"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { serviceClient } from "@/lib/supabase/service";
import { clientIpHash } from "@/lib/security/ip";
import { checkPdf, rebuildImage } from "@/lib/security/files";
import { notifyNewRequest } from "./notify";
import {
  KIND_FIELDS,
  REQUEST_KINDS,
  REQUIRED_FIELDS,
  contactSchema,
  itemsSchema,
  type RequestItem,
  type RequestKind,
} from "./schema";

export type RequestError = "validation" | "contact" | "file" | "rate" | "unavailable" | "server";

export interface RequestState {
  status: "idle" | "success" | "error";
  error?: RequestError;
  /** Bumped on every result so the form can react to repeated submissions. */
  at?: number;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const RATE_LIMIT = { max: 3, windowMinutes: 10 };
// Humans need a few seconds to fill a form; bots post instantly.
const MIN_FILL_MS = 3000;

const FILE_SIGNATURES: { type: string; ext: string; bytes: number[] }[] = [
  { type: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { type: "application/pdf", ext: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

const fail = (error: RequestError): RequestState => ({ status: "error", error, at: Date.now() });

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

/** Checks the file's real content, not the name or the browser-reported
 * type — both are trivially faked. */
async function detectFile(file: File) {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return FILE_SIGNATURES.find((sig) => sig.bytes.every((b, i) => head[i] === b)) ?? null;
}

export async function submitRequest(_prev: RequestState, formData: FormData): Promise<RequestState> {
  // Bots fill every field, including the invisible one. Pretend it worked so
  // they don't learn to avoid it.
  if (str(formData, "website")) return { status: "success", at: Date.now() };
  const startedAt = Number(str(formData, "started_at"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) return { status: "success", at: Date.now() };

  const kind = str(formData, "kind") as RequestKind;
  if (!REQUEST_KINDS.includes(kind)) return fail("validation");

  const contact = contactSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    country: str(formData, "country"),
    comment: str(formData, "comment"),
  });
  if (!contact.success) {
    const issue = contact.error.issues[0];
    return fail(issue?.path[0] === "name" ? "validation" : "contact");
  }

  const fields: Record<string, string> = {};
  for (const key of KIND_FIELDS[kind]) {
    const value = str(formData, key).trim();
    if (value.length > 2000) return fail("validation");
    if (value) fields[key] = value;
  }
  if (REQUIRED_FIELDS[kind]?.some((key) => !fields[key])) return fail("validation");

  let items: RequestItem[] = [];
  if (kind === "collection") {
    try {
      const parsed = itemsSchema.safeParse(JSON.parse(str(formData, "items") || "[]"));
      if (!parsed.success) return fail("validation");
      items = parsed.data;
    } catch {
      return fail("validation");
    }
  }

  const collectionSlug = str(formData, "collection").trim();
  if (collectionSlug && !/^[a-z0-9-]{1,60}$/.test(collectionSlug)) return fail("validation");

  const upload = formData.get("design");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  if (kind === "custom" && !file) return fail("file");
  const signature = file ? await detectFile(file) : null;
  if (file && (file.size > MAX_FILE_BYTES || !signature)) return fail("file");

  const supabase = serviceClient();
  if (!supabase) return fail("unavailable");

  const ipHash = await clientIpHash();
  const since = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60_000).toISOString();
  const { count } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT.max) return fail("rate");

  let attachmentPath: string | null = null;
  if (file && signature) {
    // Images are rebuilt from their pixels so nothing hidden inside survives;
    // PDFs are refused if they carry scripts or attachments. Done after the
    // rate limit, since decoding is the expensive part.
    const clean =
      signature.type === "application/pdf"
        ? await checkPdf(file)
        : await rebuildImage(file, { format: signature.type === "image/png" ? "png" : "jpeg", maxSide: 4000 });
    if (!clean) return fail("file");

    const month = new Date().toISOString().slice(0, 7);
    // Random name: the visitor's file name never reaches storage.
    attachmentPath = `${month}/${randomUUID()}.${clean.ext}`;
    const { error } = await supabase.storage
      .from("custom-orders")
      .upload(attachmentPath, clean.buffer, { contentType: clean.contentType, upsert: false });
    if (error) {
      console.error("[requests] upload failed", error);
      return fail("server");
    }
  }

  const locale = str(formData, "locale") === "en" ? "en" : "ru";
  const { data, error } = await supabase
    .from("requests")
    .insert({
      kind,
      collection_slug: collectionSlug || null,
      locale,
      name: contact.data.name,
      email: contact.data.email,
      phone: contact.data.phone,
      country: contact.data.country ?? null,
      comment: contact.data.comment ?? null,
      items,
      fields,
      attachment_path: attachmentPath,
      ip_hash: ipHash,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[requests] insert failed", error);
    return fail("server");
  }

  // Notify after the response is sent, so the visitor isn't kept waiting on
  // email/Telegram — and a slow provider can't fail their request.
  after(() =>
    notifyNewRequest({
      id: data.id,
      kind,
      collectionSlug: collectionSlug || null,
      name: contact.data.name,
      email: contact.data.email,
      phone: contact.data.phone,
      country: contact.data.country ?? null,
      items,
      fields,
      comment: contact.data.comment ?? null,
      hasAttachment: Boolean(attachmentPath),
    }).catch((err) => console.error("[requests] notify failed", err)),
  );

  return { status: "success", at: Date.now() };
}
