"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { done, failed, type ActionState } from "@/lib/admin/types";
import { REQUEST_STATUSES } from "@/lib/requests/schema";
import { STATUS_LABELS } from "@/lib/admin/labels";

const uuid = z.uuid();

export async function updateRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!uuid.safeParse(id).success) return failed("Неверный идентификатор");

  const update: { status?: string; admin_note?: string } = {};
  const status = formData.get("status");
  if (status !== null) {
    const parsed = z.enum(REQUEST_STATUSES).safeParse(status);
    if (!parsed.success) return failed("Неизвестный статус");
    update.status = parsed.data;
  }
  const note = formData.get("admin_note");
  if (note !== null) update.admin_note = String(note).slice(0, 5000);

  const { error } = await admin.supabase.from("requests").update(update).eq("id", id);
  if (error) {
    console.error("[admin] update request failed", error);
    return failed("Не удалось сохранить");
  }

  revalidatePath("/admin", "layout");
  return done(update.status ? `Статус: ${STATUS_LABELS[update.status as keyof typeof STATUS_LABELS]}` : "Заметка сохранена");
}

export async function deleteRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!uuid.safeParse(id).success) return failed("Неверный идентификатор");

  const { data } = await admin.supabase.from("requests").select("attachment_path").eq("id", id).single();
  const { error } = await admin.supabase.from("requests").delete().eq("id", id);
  if (error) {
    console.error("[admin] delete request failed", error);
    return failed("Не удалось удалить");
  }
  // The customer's uploaded design is personal data — don't keep it once the
  // request is gone.
  if (data?.attachment_path) {
    await admin.supabase.storage.from("custom-orders").remove([data.attachment_path]);
  }

  revalidatePath("/admin", "layout");
  redirect("/admin/requests");
}
