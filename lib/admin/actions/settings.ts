"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { refreshSite } from "@/lib/admin/revalidate";
import { done, failed, type ActionState } from "@/lib/admin/types";
import { CONTENT_TAG, EMAIL_PATTERN, type StoredContent } from "@/lib/data/content";
import { sizeTablesSchema } from "@/lib/size-tables";
import {
  SECRETS_KEY,
  TELEGRAM_TOKEN_PATTERN,
  emailProvider,
  latestTelegramChat,
  loadDeliveryConfig,
  sendEmail,
  sendTelegram,
  type NotificationSettings,
  type StoredSecrets,
} from "@/lib/requests/notify";
import { encryptSecret } from "@/lib/security/secrets";

async function saveSetting(admin: Awaited<ReturnType<typeof requireAdmin>>, key: string, value: unknown) {
  const { error } = await admin.supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) console.error("[admin] save settings failed", error);
  return !error;
}

export async function saveContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  if (email && !EMAIL_PATTERN.test(email)) return failed("Проверьте email");

  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  if (instagramUrl && !z.url({ protocol: /^https$/ }).safeParse(instagramUrl).success) {
    return failed("Ссылка на Instagram должна начинаться с https://");
  }

  let sizeTables;
  try {
    const parsed = sizeTablesSchema.safeParse(JSON.parse(String(formData.get("size_tables") ?? "[]")));
    if (!parsed.success) return failed("Проверьте таблицы размеров: слишком длинный текст или много колонок");
    sizeTables = parsed.data;
  } catch {
    return failed("Не удалось прочитать таблицы размеров");
  }

  const content: StoredContent = {
    aboutRu: String(formData.get("aboutRu") ?? "").slice(0, 8000),
    aboutEn: String(formData.get("aboutEn") ?? "").slice(0, 8000),
    email,
    instagramUrl,
    sizeTables,
  };

  if (!(await saveSetting(admin, "content", content))) return failed("Не удалось сохранить");
  refreshSite(CONTENT_TAG);
  return done("Тексты обновлены на сайте");
}

const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

async function loadSecrets(admin: Awaited<ReturnType<typeof requireAdmin>>): Promise<StoredSecrets> {
  const { data } = await admin.supabase.from("settings").select("value").eq("key", SECRETS_KEY).maybeSingle();
  return (data?.value as StoredSecrets | null) ?? {};
}

export async function saveNotifications(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const field = (key: string) => String(formData.get(key) ?? "").trim();
  const section = field("section");
  if (section !== "email" && section !== "telegram") return failed("Неверный запрос");

  const [{ data: current }, previous] = await Promise.all([
    admin.supabase.from("settings").select("value").eq("key", "notifications").maybeSingle(),
    loadSecrets(admin),
  ]);
  const settings: NotificationSettings = {
    emailEnabled: false,
    notifyEmail: "",
    telegramEnabled: false,
    telegramChatId: "",
    ...((current?.value ?? {}) as Partial<NotificationSettings>),
  };
  const secrets: StoredSecrets = { ...previous };

  // Saved passwords/tokens are never sent back to the browser, so an empty
  // field means "keep what's saved".
  if (section === "email") {
    const notifyEmail = field("notifyEmail");
    if (notifyEmail && !EMAIL_PATTERN.test(notifyEmail)) return failed("Проверьте email для уведомлений");
    const smtpUser = field("smtpUser");
    if (smtpUser && !EMAIL_PATTERN.test(smtpUser)) return failed("Проверьте адрес почты, с которой отправлять");
    const smtpPassword = field("smtpPassword").replace(/\s+/g, "");
    if (smtpPassword.length > 200) return failed("Слишком длинный пароль приложения");
    const smtpHost = field("smtpHost").toLowerCase();
    if (smtpHost && !HOST_PATTERN.test(smtpHost)) return failed("Проверьте адрес SMTP-сервера");
    const smtpPort = Number(field("smtpPort")) || 0;
    if (smtpPort && ![25, 465, 587, 2525].includes(smtpPort)) return failed("Порт SMTP: 465 или 587");

    settings.emailEnabled = formData.get("emailEnabled") === "on";
    settings.notifyEmail = notifyEmail;
    secrets.smtpUser = smtpUser;
    secrets.smtpHost = smtpHost && smtpHost !== "smtp.gmail.com" ? smtpHost : undefined;
    secrets.smtpPort = smtpPort && smtpPort !== 465 ? smtpPort : undefined;
    if (smtpPassword) secrets.smtpPassword = encryptSecret(smtpPassword);
  } else {
    const telegramChatId = field("telegramChatId");
    if (telegramChatId && !/^-?\d{1,20}$|^@[A-Za-z0-9_]{4,32}$/.test(telegramChatId)) {
      return failed("Chat ID — число (например 123456789) или @канал");
    }
    const telegramToken = field("telegramToken");
    if (telegramToken && !TELEGRAM_TOKEN_PATTERN.test(telegramToken)) {
      return failed("Токен бота выглядит иначе: 123456789:AAH… — скопируйте его из @BotFather целиком");
    }

    settings.telegramEnabled = formData.get("telegramEnabled") === "on";
    settings.telegramChatId = telegramChatId;
    if (telegramToken) secrets.telegramToken = encryptSecret(telegramToken);
  }

  const saved = (await saveSetting(admin, "notifications", settings)) && (await saveSetting(admin, SECRETS_KEY, secrets));
  if (!saved) return failed("Не удалось сохранить");
  revalidatePath("/admin/settings");
  return done(section === "email" ? "Настройки почты сохранены" : "Настройки Telegram сохранены");
}

/** Forget a saved mail password or bot token. */
export async function clearSecret(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const name = formData.get("name");
  if (name !== "smtpPassword" && name !== "telegramToken") return failed("Неверный запрос");

  const secrets = await loadSecrets(admin);
  delete secrets[name];
  if (!(await saveSetting(admin, SECRETS_KEY, secrets))) return failed("Не удалось удалить");
  revalidatePath("/admin/settings");
  return done(name === "smtpPassword" ? "Пароль почты удалён" : "Токен бота удалён");
}

/** After the admin presses Start in their bot, find the chat and save it. */
export async function findTelegramChat(): Promise<ActionState> {
  const admin = await requireAdmin();
  const config = await loadDeliveryConfig();
  if (!config.telegramToken) return failed("Сначала вставьте токен бота и сохраните");

  const chat = await latestTelegramChat(config.telegramToken);
  if (!chat) return failed("Бот пока не получил сообщений. Откройте бота в Telegram, нажмите Start и попробуйте снова");

  const { data } = await admin.supabase.from("settings").select("value").eq("key", "notifications").maybeSingle();
  const current = (data?.value ?? {}) as Partial<NotificationSettings>;
  const next: NotificationSettings = {
    emailEnabled: current.emailEnabled ?? false,
    notifyEmail: current.notifyEmail ?? "",
    telegramEnabled: true,
    telegramChatId: chat.id,
  };
  if (!(await saveSetting(admin, "notifications", next))) return failed("Не удалось сохранить Chat ID");
  revalidatePath("/admin/settings");
  return done(`Найден чат${chat.name ? ` «${chat.name}»` : ""} — уведомления в Telegram включены`);
}

export async function sendTestNotification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const channel = formData.get("channel");
  const message = "Тестовое уведомление из админки Niche. Если вы это видите — всё работает.";
  const config = await loadDeliveryConfig();

  if (channel === "email") {
    const to = String(formData.get("notifyEmail") ?? "").trim();
    if (!EMAIL_PATTERN.test(to)) return failed("Сначала укажите, куда присылать письма, и сохраните");
    const provider = emailProvider(config);
    if (!provider) return failed("Почта не подключена: укажите адрес Gmail и пароль приложения");
    return (await sendEmail(to, "Niche — тестовое уведомление", message, config))
      ? done(`Письмо отправлено на ${to}`)
      : failed(
          provider === "smtp"
            ? "Почта не приняла вход — проверьте адрес и пароль приложения"
            : "Resend отклонил письмо — проверьте ключ и адрес отправителя",
        );
  }

  const chatId = String(formData.get("telegramChatId") ?? "").trim();
  if (!config.telegramToken) return failed("Сначала вставьте токен бота и сохраните");
  if (!chatId) return failed("Сначала найдите или укажите Chat ID");
  return (await sendTelegram(chatId, message, config))
    ? done("Сообщение отправлено в Telegram")
    : failed("Telegram не принял сообщение — нажмите Start у бота и проверьте Chat ID");
}
