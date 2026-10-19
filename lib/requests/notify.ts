import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { serviceClient } from "@/lib/supabase/service";
import { decryptSecret } from "@/lib/security/secrets";
import { siteUrl } from "@/lib/site-url";
import { FIELD_LABELS, type RequestItem, type RequestKind } from "./schema";

export interface NotificationSettings {
  emailEnabled: boolean;
  notifyEmail: string;
  telegramEnabled: boolean;
  telegramChatId: string;
}

export const KIND_LABELS: Record<RequestKind, string> = {
  collection: "Заказ из коллекции",
  custom: "Свой дизайн",
  one_of_one: "One-of-one",
  illustrations: "Иллюстрации",
};

interface NewRequest {
  id: string;
  kind: RequestKind;
  collectionSlug: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  items: RequestItem[];
  fields: Record<string, string>;
  comment: string | null;
  hasAttachment: boolean;
}

/** Plain text on purpose: neither email nor Telegram is asked to render
 * HTML, so nothing a visitor types can inject markup into the message. */
function formatMessage(request: NewRequest) {
  const lines = [
    `Новая заявка — ${KIND_LABELS[request.kind]}${request.collectionSlug ? ` (${request.collectionSlug})` : ""}`,
    "",
    `Имя: ${request.name}`,
    request.email && `Email: ${request.email}`,
    request.phone && `Телефон: ${request.phone}`,
    request.country && `Страна: ${request.country}`,
    "",
    ...request.items.map(
      (i) => `• ${i.code}${i.size ? `, размер ${i.size}` : ""}${i.quantity ? `, ${i.quantity} шт.` : ""}${i.color ? `, ${i.color}` : ""}`,
    ),
    ...Object.entries(request.fields).map(([key, value]) => `${FIELD_LABELS[key] ?? key}: ${value}`),
    request.comment && `Комментарий: ${request.comment}`,
    request.hasAttachment && "Прикреплён файл — откройте заявку в админке.",
    "",
    `${siteUrl}/admin/requests/${request.id}`,
  ];
  return lines.filter((l) => l !== null && l !== false && l !== undefined).join("\n");
}

export async function loadNotificationSettings(): Promise<NotificationSettings | null> {
  const supabase = serviceClient();
  if (!supabase) return null;
  const { data } = await supabase.from("settings").select("value").eq("key", "notifications").maybeSingle();
  return (data?.value as NotificationSettings | null) ?? null;
}

// ---------------------------------------------------------------------------
// Delivery credentials: entered in Admin → Settings (stored encrypted in the
// `notification_secrets` settings row), with .env.local as a fallback.
// ---------------------------------------------------------------------------

export const SECRETS_KEY = "notification_secrets";

/** As stored in the database. Passwords/tokens are AES-GCM ciphertext. */
export interface StoredSecrets {
  smtpUser?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpPassword?: string;
  telegramToken?: string;
}

export const TELEGRAM_TOKEN_PATTERN = /^\d{5,15}:[A-Za-z0-9_-]{30,60}$/;

interface DeliveryConfig {
  smtp: { host: string; port: number; user: string; password: string; from: string } | null;
  resend: { key: string; from: string } | null;
  telegramToken: string | null;
  /** True when a saved secret exists but can't be decrypted (server key changed). */
  undecryptable: boolean;
}

export async function loadStoredSecrets(): Promise<StoredSecrets> {
  const supabase = serviceClient();
  if (!supabase) return {};
  const { data } = await supabase.from("settings").select("value").eq("key", SECRETS_KEY).maybeSingle();
  return (data?.value as StoredSecrets | null) ?? {};
}

export async function loadDeliveryConfig(): Promise<DeliveryConfig> {
  const stored = await loadStoredSecrets();
  const smtpPassword = decryptSecret(stored.smtpPassword);
  const telegramToken = decryptSecret(stored.telegramToken);
  const undecryptable =
    Boolean(stored.smtpPassword && !smtpPassword) || Boolean(stored.telegramToken && !telegramToken);

  const smtpUser = stored.smtpUser || process.env.SMTP_USER || "";
  const smtpPass = smtpPassword || process.env.SMTP_PASSWORD || "";
  const port = stored.smtpPort || Number(process.env.SMTP_PORT) || 465;

  const token = telegramToken || process.env.TELEGRAM_BOT_TOKEN || "";

  return {
    smtp:
      smtpUser && smtpPass
        ? {
            host: stored.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
            port,
            user: smtpUser,
            password: smtpPass,
            // Gmail only sends as the signed-in account, so that's the sender.
            from: process.env.SMTP_FROM || `Niche <${smtpUser}>`,
          }
        : null,
    resend: process.env.RESEND_API_KEY
      ? { key: process.env.RESEND_API_KEY, from: process.env.RESEND_FROM_EMAIL || "Niche <onboarding@resend.dev>" }
      : null,
    telegramToken: TELEGRAM_TOKEN_PATTERN.test(token) ? token : null,
    undecryptable,
  };
}

/** Which mail service will be used: SMTP (e.g. Gmail) wins over Resend. */
export function emailProvider(config: DeliveryConfig): "smtp" | "resend" | null {
  return config.smtp ? "smtp" : config.resend ? "resend" : null;
}

async function sendViaSmtp(smtp: NonNullable<DeliveryConfig["smtp"]>, to: string, subject: string, body: string) {
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.password },
  });
  try {
    await transport.sendMail({ from: smtp.from, to, subject, text: body });
    return true;
  } catch (error) {
    console.error("[notify] smtp email failed", error instanceof Error ? error.message : error);
    return false;
  }
}

async function sendViaResend(resendConfig: NonNullable<DeliveryConfig["resend"]>, to: string, subject: string, body: string) {
  const resend = new Resend(resendConfig.key);
  const { error } = await resend.emails.send({ from: resendConfig.from, to, subject, text: body });
  if (error) console.error("[notify] resend email failed", error);
  return !error;
}

export async function sendEmail(to: string, subject: string, body: string, config?: DeliveryConfig) {
  const delivery = config ?? (await loadDeliveryConfig());
  // Visitor-typed text ends up in the subject: strip line breaks so it can
  // never smuggle in extra mail headers.
  const safeSubject = subject.replace(/[\r\n]+/g, " ").slice(0, 200);
  if (delivery.smtp) return sendViaSmtp(delivery.smtp, to, safeSubject, body);
  if (delivery.resend) return sendViaResend(delivery.resend, to, safeSubject, body);
  return false;
}

export async function sendTelegram(chatId: string, body: string, config?: DeliveryConfig) {
  const token = (config ?? (await loadDeliveryConfig())).telegramToken;
  if (!token) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: body, disable_web_page_preview: true }),
  });
  if (!res.ok) console.error("[notify] telegram failed", res.status, await res.text());
  return res.ok;
}

/** The chat that most recently wrote to the bot — so the admin can press
 * Start in Telegram and let the site pick up their Chat ID. */
export async function latestTelegramChat(token: string): Promise<{ id: string; name: string } | null> {
  if (!TELEGRAM_TOKEN_PATTERN.test(token)) return null;
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    result?: { message?: { chat?: { id: number; first_name?: string; title?: string; username?: string } }; my_chat_member?: { chat?: { id: number; title?: string } } }[];
  };
  const chats = (json.result ?? []).map((u) => u.message?.chat ?? u.my_chat_member?.chat).filter(Boolean);
  const chat = chats.at(-1) as { id: number; first_name?: string; title?: string; username?: string } | undefined;
  if (!chat) return null;
  return { id: String(chat.id), name: chat.title || chat.first_name || chat.username || "" };
}

export async function notifyNewRequest(request: NewRequest) {
  const [settings, config] = await Promise.all([loadNotificationSettings(), loadDeliveryConfig()]);
  if (!settings) return;

  const body = formatMessage(request);
  await Promise.allSettled([
    settings.emailEnabled && settings.notifyEmail
      ? sendEmail(settings.notifyEmail, `Новая заявка от ${request.name}`, body, config)
      : null,
    settings.telegramEnabled && settings.telegramChatId
      ? sendTelegram(settings.telegramChatId, body, config)
      : null,
  ]);
}
