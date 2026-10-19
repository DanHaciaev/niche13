"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sessionClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { getAuthState, requireAdmin } from "@/lib/admin/auth";
import { clearFailures, isThrottled, recordFailure, throttleKey } from "@/lib/admin/throttle";
import { done, failed, type ActionState } from "@/lib/admin/types";

const TOO_MANY = "Слишком много попыток. Подождите 15 минут.";

const credentials = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

const totpCode = z.string().trim().regex(/^\d{6}$/);

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!supabaseConfigured) return failed("Supabase не подключён");

  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  // One message for every failure: don't tell an attacker which emails exist.
  if (!parsed.success) return failed("Неверный email или пароль");

  const key = await throttleKey(parsed.data.email);
  if (await isThrottled(key)) return failed(TOO_MANY);

  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // The real reason goes to the server log only; the visitor always sees
    // the same message so it can't be used to probe accounts.
    console.warn("[admin] sign-in failed:", error.code ?? error.status, error.message);
    await recordFailure(key);
    return failed(error.status === 429 ? TOO_MANY : "Неверный email или пароль");
  }
  await clearFailures(key);

  const state = await getAuthState();
  if (state.status === "needs-mfa") redirect("/admin/login/mfa");
  if (state.status !== "admin") {
    await supabase.auth.signOut();
    return failed("У этого аккаунта нет доступа к админке");
  }

  redirect("/admin");
}

/** Second step of sign-in: the 6-digit code from the authenticator app. */
export async function verifyMfa(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const state = await getAuthState();
  if (state.status === "admin") redirect("/admin");
  if (state.status !== "needs-mfa") redirect("/admin/login");

  const { data: userData } = await state.supabase.auth.getUser();
  const key = await throttleKey(userData.user?.email ?? "");
  if (await isThrottled(key)) return failed(TOO_MANY);

  const code = totpCode.safeParse(formData.get("code"));
  if (!code.success) return failed("Введите 6 цифр из приложения");

  const { data: factors } = await state.supabase.auth.mfa.listFactors();
  const factor = factors?.totp[0];
  if (!factor) redirect("/admin/login");

  const { error } = await state.supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.data });
  if (error) {
    await recordFailure(key);
    return failed("Неверный код. Проверьте время на телефоне и попробуйте ещё раз.");
  }
  await clearFailures(key);
  redirect("/admin");
}

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const password = String(formData.get("password") ?? "");
  const repeat = String(formData.get("repeat") ?? "");

  if (password.length < 10) return failed("Пароль — минимум 10 символов");
  if (password !== repeat) return failed("Пароли не совпадают");

  const { error } = await admin.supabase.auth.updateUser({ password });
  if (error) return failed("Не удалось сменить пароль");
  return done("Пароль обновлён");
}

// ---------------------------------------------------------------------------
// Two-factor enrollment (from Settings)
// ---------------------------------------------------------------------------

export interface MfaEnrollState extends ActionState {
  factorId?: string;
  qr?: string;
  secret?: string;
}

/** Step 1: create an authenticator factor and return its QR code. */
export async function startMfaEnroll(): Promise<MfaEnrollState> {
  const admin = await requireAdmin();

  // Drop half-finished attempts so a new one doesn't collide with them.
  const { data: factors } = await admin.supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.status === "unverified") await admin.supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await admin.supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Niche admin ${new Date().toISOString().slice(0, 10)}`,
    issuer: "Niche",
  });
  if (error || !data) {
    console.error("[admin] mfa enroll failed", error);
    return failed("Не удалось начать подключение. Проверьте, что в Supabase включён MFA (TOTP).");
  }

  const qr = data.totp.qr_code.startsWith("data:")
    ? data.totp.qr_code
    : `data:image/svg+xml;utf-8,${encodeURIComponent(data.totp.qr_code)}`;
  return { ok: true, factorId: data.id, qr, secret: data.totp.secret, at: Date.now() };
}

/** Step 2: confirm with the first code from the app. */
export async function confirmMfaEnroll(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const factorId = z.uuid().safeParse(formData.get("factorId"));
  const code = totpCode.safeParse(formData.get("code"));
  if (!factorId.success) return failed("Начните подключение заново");
  if (!code.success) return failed("Введите 6 цифр из приложения");

  const { error } = await admin.supabase.auth.mfa.challengeAndVerify({ factorId: factorId.data, code: code.data });
  if (error) return failed("Неверный код. Попробуйте ещё раз.");
  redirect("/admin/settings?mfa=on");
}

export async function disableMfa(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const code = totpCode.safeParse(formData.get("code"));
  if (!code.success) return failed("Для отключения введите текущий код из приложения");

  const { data: factors } = await admin.supabase.auth.mfa.listFactors();
  const factor = factors?.totp[0];
  if (!factor) return failed("Двухфакторный вход и так выключен");

  // Ask for a fresh code: an unattended open session shouldn't be enough to
  // remove the second factor.
  const { error: verifyError } = await admin.supabase.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: code.data,
  });
  if (verifyError) return failed("Неверный код");

  const { error } = await admin.supabase.auth.mfa.unenroll({ factorId: factor.id });
  if (error) return failed("Не удалось отключить");
  redirect("/admin/settings?mfa=off");
}
