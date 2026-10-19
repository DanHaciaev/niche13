import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { changePassword } from "@/lib/admin/actions/auth";
import { clearSecret, findTelegramChat, saveNotifications, sendTestNotification } from "@/lib/admin/actions/settings";
import {
  emailProvider,
  loadDeliveryConfig,
  loadStoredSecrets,
  type NotificationSettings,
} from "@/lib/requests/notify";
import { AdminForm, ConfirmAction, SubmitButton, Toggle } from "@/components/admin/forms";
import { Card, Field, Guide, GuideSteps, PageHeader, inputClass } from "@/components/admin/ui";
import { MfaSettings } from "@/components/admin/MfaSettings";
import { CreatedToast } from "@/components/admin/CreatedToast";

export const metadata: Metadata = { title: "Настройки" };

function Status({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs ${ok ? "text-ink-soft" : "text-[#981C1C]"}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ok ? "bg-emerald-600" : "bg-[#981C1C]"}`} />
      {text}
    </span>
  );
}

/** A saved secret is never shown again — only that it exists. Typing a new
 * value replaces it; removing it is a separate form (see SecretRemove), so
 * pressing Enter in this form can never delete it by accident. */
function SecretField({
  label,
  name,
  saved,
  fromEnv,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  saved: boolean;
  fromEnv: boolean;
  placeholder: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        name={name}
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder={saved ? "•••••••• сохранён — введите новый, чтобы заменить" : placeholder}
        className={inputClass}
      />
      {saved ? (
        <Status ok text="Сохранён в зашифрованном виде" />
      ) : (
        fromEnv && <Status ok text="Взят из .env.local сервера" />
      )}
    </Field>
  );
}

function SecretRemove({ name, label }: { name: "smtpPassword" | "telegramToken"; label: string }) {
  return (
    <ConfirmAction
      action={clearSecret}
      fields={{ name }}
      label={label}
      confirmText="Удалить сохранённые данные? Уведомления этого типа перестанут отправляться."
    />
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ mfa?: string }> }) {
  const admin = await requireAdmin();
  const { mfa } = await searchParams;

  const [{ data: factors }, { data }, stored, config] = await Promise.all([
    admin.supabase.auth.mfa.listFactors(),
    admin.supabase.from("settings").select("value").eq("key", "notifications").maybeSingle(),
    loadStoredSecrets(),
    loadDeliveryConfig(),
  ]);
  const mfaEnabled = (factors?.totp.length ?? 0) > 0;
  const settings: NotificationSettings = {
    emailEnabled: false,
    notifyEmail: "",
    telegramEnabled: false,
    telegramChatId: "",
    ...((data?.value ?? {}) as Partial<NotificationSettings>),
  };

  // Only facts about the secrets reach the page — never the secrets.
  const mail = emailProvider(config);
  const hasTelegram = Boolean(config.telegramToken);
  const smtpUser = stored.smtpUser || process.env.SMTP_USER || "";
  const smtpHost = stored.smtpHost || process.env.SMTP_HOST || "";
  const smtpPort = stored.smtpPort || Number(process.env.SMTP_PORT) || "";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Аккаунт и уведомления" title="Настройки" />

      <Card
        title="Двухфакторный вход"
        description="Код из приложения на телефоне при каждом входе — главная защита админки."
      >
        <MfaSettings enabled={mfaEnabled} />
      </Card>

      {config.undecryptable && (
        <div className="border border-[#981C1C]/30 bg-[#981C1C]/5 px-5 py-4 text-sm text-ink-soft">
          <span className="font-semibold text-[#981C1C]">Сохранённый пароль почты или токен бота не читается.</span>{" "}
          Скорее всего, на сервере сменился ключ Supabase. Введите их заново ниже.
        </div>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        {/* ------------------------------------------------------------ Email */}
        <Card title="Уведомления на почту" description="Письмо о каждой новой заявке.">
          <div className="flex flex-col gap-5">
            <AdminForm action={saveNotifications} className="flex flex-col gap-5">
              <input type="hidden" name="section" value="email" />
              <Toggle
                key={`email-${settings.emailEnabled}`}
                name="emailEnabled"
                label="Отправлять письма"
                defaultChecked={settings.emailEnabled}
              />
              <Field label="Куда присылать уведомления">
                <input
                  key={settings.notifyEmail}
                  name="notifyEmail"
                  type="email"
                  defaultValue={settings.notifyEmail}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </Field>

              <div className="flex flex-col gap-5 border-t border-line pt-5">
                <span className="label-tag text-[10px]! font-semibold! text-ink">С какой почты отправлять</span>
                <Field label="Адрес Gmail">
                  <input
                    key={smtpUser}
                    name="smtpUser"
                    type="email"
                    defaultValue={smtpUser}
                    placeholder="niche.shop@gmail.com"
                    className={inputClass}
                  />
                </Field>
                <SecretField
                  label="Пароль приложения Google"
                  name="smtpPassword"
                  saved={Boolean(stored.smtpPassword)}
                  fromEnv={!stored.smtpPassword && Boolean(process.env.SMTP_PASSWORD)}
                  placeholder="16 букв, например abcd efgh ijkl mnop"
                  hint="Не основной пароль от Google — как его получить, см. инструкцию ниже."
                />
                <details className="group text-sm">
                  <summary className="label-tag cursor-pointer list-none text-[9px]! text-ink-faint hover:text-ink [&::-webkit-details-marker]:hidden">
                    Не Gmail? Другой почтовый сервер ▾
                  </summary>
                  <div className="mt-4 grid grid-cols-[1fr_96px] gap-3">
                    <Field label="SMTP-сервер" hint="Например smtp.yandex.ru">
                      <input name="smtpHost" defaultValue={smtpHost} placeholder="smtp.gmail.com" className={inputClass} />
                    </Field>
                    <Field label="Порт">
                      <input name="smtpPort" inputMode="numeric" defaultValue={smtpPort} placeholder="465" className={inputClass} />
                    </Field>
                  </div>
                </details>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
                <Status
                  ok={mail !== null}
                  text={
                    mail === "smtp"
                      ? `Почта подключена: ${config.smtp?.user}`
                      : mail === "resend"
                        ? "Почта подключена через Resend"
                        : "Почта ещё не подключена"
                  }
                />
                <SubmitButton>Сохранить</SubmitButton>
              </div>
            </AdminForm>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <AdminForm action={sendTestNotification}>
                <input type="hidden" name="channel" value="email" />
                <input type="hidden" name="notifyEmail" value={settings.notifyEmail} />
                <SubmitButton variant="ghost">Отправить тестовое письмо</SubmitButton>
              </AdminForm>
              {stored.smtpPassword && <SecretRemove name="smtpPassword" label="Удалить пароль почты" />}
            </div>

            <Guide title="Как подключить почту Gmail — по шагам" defaultOpen={mail === null}>
              <p>
                Письма будут уходить с вашего Gmail. Нужен «пароль приложения» — отдельный пароль только для сайта.
                Основной пароль от Google сюда вводить не нужно и нельзя.
              </p>
              <GuideSteps>
                <li>
                  Включите{" "}
                  <a href="https://myaccount.google.com/signinoptions/twosv" target="_blank" rel="noopener noreferrer">
                    двухэтапную аутентификацию Google
                  </a>
                  , если она ещё не включена. Без неё Google не даст создать пароль приложения.
                </li>
                <li>
                  Откройте{" "}
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">
                    пароли приложений
                  </a>
                  , введите название, например «Niche сайт», и нажмите «Создать».
                </li>
                <li>Google покажет пароль из 16 букв. Скопируйте его — он показывается только один раз.</li>
                <li>
                  Вставьте выше: <b>Адрес Gmail</b> — ваша почта, <b>Пароль приложения</b> — эти 16 букв. В поле{" "}
                  <b>Куда присылать уведомления</b> — адрес, на который хотите получать заявки (можно тот же).
                </li>
                <li>
                  Включите «Отправлять письма», нажмите <b>Сохранить</b>, затем <b>Отправить тестовое письмо</b>.
                </li>
              </GuideSteps>
              <p className="text-xs text-ink-faint">
                Пароль хранится зашифрованным и больше нигде не показывается. Его можно в любой момент отозвать на
                странице паролей приложений Google — сайт просто перестанет отправлять письма. Лимит Gmail — около
                500 писем в день.
              </p>
            </Guide>
          </div>
        </Card>

        {/* --------------------------------------------------------- Telegram */}
        <Card title="Уведомления в Telegram" description="Сообщение от вашего бота о каждой новой заявке.">
          <div className="flex flex-col gap-5">
            <AdminForm action={saveNotifications} className="flex flex-col gap-5">
              <input type="hidden" name="section" value="telegram" />
              <Toggle
                key={`tg-${settings.telegramEnabled}`}
                name="telegramEnabled"
                label="Отправлять в Telegram"
                defaultChecked={settings.telegramEnabled}
              />
              <SecretField
                label="Токен бота"
                name="telegramToken"
                saved={Boolean(stored.telegramToken)}
                fromEnv={!stored.telegramToken && Boolean(process.env.TELEGRAM_BOT_TOKEN)}
                placeholder="123456789:AAH…"
                hint="Выдаёт @BotFather при создании бота."
              />
              <Field label="Chat ID" hint="Заполнится сам — кнопка «Найти мой Chat ID» ниже.">
                <input
                  key={settings.telegramChatId}
                  name="telegramChatId"
                  defaultValue={settings.telegramChatId}
                  placeholder="123456789"
                  className={inputClass}
                />
              </Field>
              <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
                <Status
                  ok={hasTelegram && Boolean(settings.telegramChatId)}
                  text={
                    !hasTelegram
                      ? "Бот ещё не подключён"
                      : settings.telegramChatId
                        ? "Бот подключён"
                        : "Бот есть — осталось найти Chat ID"
                  }
                />
                <SubmitButton>Сохранить</SubmitButton>
              </div>
            </AdminForm>

            <div className="flex flex-wrap items-center gap-3">
              <AdminForm action={findTelegramChat}>
                <SubmitButton variant="ghost">Найти мой Chat ID</SubmitButton>
              </AdminForm>
              <AdminForm action={sendTestNotification}>
                <input type="hidden" name="channel" value="telegram" />
                <input type="hidden" name="telegramChatId" value={settings.telegramChatId} />
                <SubmitButton variant="ghost">Отправить тест</SubmitButton>
              </AdminForm>
              {stored.telegramToken && (
                <span className="ml-auto">
                  <SecretRemove name="telegramToken" label="Удалить токен" />
                </span>
              )}
            </div>

            <Guide title="Как подключить Telegram — по шагам" defaultOpen={!hasTelegram || !settings.telegramChatId}>
              <p>Уведомления придут сообщением от вашего собственного бота. Бесплатно, около 3 минут.</p>
              <GuideSteps>
                <li>
                  В Telegram откройте{" "}
                  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">
                    @BotFather
                  </a>{" "}
                  и отправьте <b>/newbot</b>.
                </li>
                <li>
                  Придумайте имя (например, «Niche Заявки») и адрес, который заканчивается на bot (например,
                  niche_orders_bot).
                </li>
                <li>
                  BotFather пришлёт <b>токен</b> вида 123456789:AAH… Вставьте его в поле «Токен бота» выше и нажмите{" "}
                  <b>Сохранить</b>.
                </li>
                <li>
                  Откройте своего нового бота в Telegram (ссылка есть в сообщении BotFather) и нажмите <b>Start</b>.
                </li>
                <li>
                  Вернитесь сюда и нажмите <b>Найти мой Chat ID</b> — сайт сам найдёт ваш чат и включит уведомления.
                </li>
                <li>
                  Нажмите <b>Отправить тест</b> — в Telegram придёт проверочное сообщение.
                </li>
              </GuideSteps>
              <p className="text-xs text-ink-faint">
                Хотите получать заявки в общий чат с коллегами? Добавьте бота в группу, напишите в ней любое
                сообщение и нажмите «Найти мой Chat ID». Токен хранится зашифрованным — никому его не пересылайте.
              </p>
            </Guide>
          </div>
        </Card>
      </div>

      <Card title="Пароль" description={`Аккаунт ${admin.email}`}>
        <AdminForm action={changePassword} resetOnSuccess className="flex flex-col gap-3">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Field label="Новый пароль">
              <input name="password" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
            </Field>
            <Field label="Ещё раз">
              <input name="repeat" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
            </Field>
            <SubmitButton>Сменить</SubmitButton>
          </div>
          <span className="text-xs text-ink-faint">Минимум 10 символов.</span>
        </AdminForm>
      </Card>
      {mfa === "on" && <CreatedToast message="Двухфакторный вход включён" />}
      {mfa === "off" && <CreatedToast message="Двухфакторный вход отключён" />}
    </div>
  );
}
