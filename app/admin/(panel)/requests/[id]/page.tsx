import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteRequest, updateRequest } from "@/lib/admin/actions/requests";
import { KIND_LABELS, STATUS_LABELS } from "@/lib/admin/labels";
import { FIELD_LABELS, REQUEST_STATUSES, type RequestItem, type RequestKind, type RequestStatus } from "@/lib/requests/schema";
import { AdminForm, ConfirmAction, SubmitButton } from "@/components/admin/forms";
import { Card, PageHeader, StatusBadge, formatDate, inputClass } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Заявка" };

interface RequestRow {
  id: string;
  created_at: string;
  updated_at: string;
  status: RequestStatus;
  kind: RequestKind;
  collection_slug: string | null;
  locale: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  items: RequestItem[];
  fields: Record<string, string>;
  comment: string | null;
  attachment_path: string | null;
  admin_note: string;
}

function ContactLine({ label, value, href }: { label: string; value: string | null; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-line py-3 last:border-0">
      <span className="label-tag text-[9px]! text-ink-faint">{label}</span>
      {href ? (
        <a href={href} className="text-sm text-ink underline-offset-4 hover:underline">
          {value}
        </a>
      ) : (
        <span className="text-sm text-ink">{value}</span>
      )}
    </div>
  );
}

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { data } = await admin.supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const request = data as RequestRow;

  // Customer uploads live in a private bucket; the admin gets a link that
  // expires in 10 minutes instead of a permanent public URL.
  let attachmentUrl: string | null = null;
  if (request.attachment_path) {
    const { data: signed } = await admin.supabase.storage
      .from("custom-orders")
      .createSignedUrl(request.attachment_path, 600);
    attachmentUrl = signed?.signedUrl ?? null;
  }
  const isPdf = request.attachment_path?.endsWith(".pdf");
  const phoneDigits = request.phone?.replace(/[^\d+]/g, "");

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/requests" className="label-tag w-fit text-[10px]! font-medium! text-ink-faint hover:text-ink">
        ← Все заявки
      </Link>

      <PageHeader
        eyebrow={`${KIND_LABELS[request.kind]}${request.collection_slug ? ` · ${request.collection_slug}` : ""} · ${formatDate(request.created_at)}`}
        title={request.name}
        actions={<StatusBadge status={request.status} />}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {request.items.length > 0 && (
            <Card title="Выбранные товары">
              <div className="overflow-x-auto">
                <table className="w-full min-w-110 text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      {["Код", "Размер", "Кол-во", "Цвет"].map((h) => (
                        <th key={h} className="label-tag pb-3 text-[9px]! font-semibold! text-ink-faint">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {request.items.map((item, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        <td className="py-3 font-medium">
                          {request.collection_slug ? (
                            <a
                              href={`/collections/${request.collection_slug}/${item.code}`}
                              target="_blank"
                              rel="noopener"
                              className="underline-offset-4 hover:underline"
                            >
                              NICHE / {item.code}
                            </a>
                          ) : (
                            `NICHE / ${item.code}`
                          )}
                        </td>
                        <td className="py-3">{item.size || "—"}</td>
                        <td className="py-3">{item.quantity || "1"}</td>
                        <td className="py-3">
                          {/^#[0-9a-f]{6}$/i.test(item.color) ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="h-4 w-4 rounded-full border border-line" style={{ backgroundColor: item.color }} />
                              <span className="text-xs text-ink-faint">{item.color}</span>
                            </span>
                          ) : (
                            item.color || "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card title="Ответы из формы">
            <dl className="flex flex-col">
              {Object.entries(request.fields).map(([key, value]) => (
                <div key={key} className="grid gap-1 border-b border-line py-3 first:pt-0 md:grid-cols-[180px_1fr] md:gap-6">
                  <dt className="label-tag text-[9px]! text-ink-faint">{FIELD_LABELS[key] ?? key}</dt>
                  <dd className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{value}</dd>
                </div>
              ))}
              <div className="grid gap-1 py-3 last:pb-0 md:grid-cols-[180px_1fr] md:gap-6">
                <dt className="label-tag text-[9px]! text-ink-faint">Комментарий</dt>
                <dd className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{request.comment || "—"}</dd>
              </div>
            </dl>
          </Card>

          {request.attachment_path && (
            <Card title="Файл от клиента" description="Ссылка действует 10 минут — обновите страницу, если истекла.">
              {attachmentUrl ? (
                isPdf ? (
                  <a href={attachmentUrl} target="_blank" rel="noopener" className="label-tag text-[11px]! text-ink underline">
                    Открыть PDF ↗
                  </a>
                ) : (
                  <a href={attachmentUrl} target="_blank" rel="noopener" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived URL */}
                    <img src={attachmentUrl} alt="Дизайн клиента" className="max-h-130 w-auto border border-line" />
                  </a>
                )
              ) : (
                <p className="text-sm text-ink-faint">Не удалось получить файл.</p>
              )}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Контакты">
            <div className="-my-3">
              <ContactLine label="Email" value={request.email} href={request.email ? `mailto:${request.email}` : undefined} />
              <ContactLine label="Телефон" value={request.phone} href={phoneDigits ? `tel:${phoneDigits}` : undefined} />
              <ContactLine label="Страна" value={request.country} />
              <ContactLine label="Язык сайта" value={request.locale === "en" ? "English" : "Русский"} />
            </div>
            {phoneDigits && (
              <div className="mt-5 flex gap-2">
                <a
                  href={`https://wa.me/${phoneDigits.replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-tag flex-1 border border-line py-2.5 text-center text-[10px]! font-medium! hover:border-ink"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://t.me/${phoneDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-tag flex-1 border border-line py-2.5 text-center text-[10px]! font-medium! hover:border-ink"
                >
                  Telegram
                </a>
              </div>
            )}
          </Card>

          <Card title="Статус">
            <div className="grid grid-cols-2 gap-2">
              {REQUEST_STATUSES.map((s) => (
                <AdminForm key={s} action={updateRequest}>
                  <input type="hidden" name="id" value={request.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    disabled={s === request.status}
                    className={`label-tag w-full px-3 py-3 text-[10px]! font-medium! transition-colors ${
                      s === request.status
                        ? "bg-ink text-white"
                        : "border border-line bg-white text-ink-soft hover:border-ink hover:text-ink"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                </AdminForm>
              ))}
            </div>
          </Card>

          <Card title="Заметка" description="Видна только в админке.">
            <AdminForm action={updateRequest} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={request.id} />
              <textarea
                name="admin_note"
                rows={4}
                defaultValue={request.admin_note}
                placeholder="Например: созвонились, ждём оплату"
                className={`${inputClass} resize-y`}
              />
              <div className="flex justify-end">
                <SubmitButton variant="ghost">Сохранить заметку</SubmitButton>
              </div>
            </AdminForm>
          </Card>

          <div className="flex justify-end">
            <ConfirmAction
              action={deleteRequest}
              fields={{ id: request.id }}
              label="Удалить заявку"
              confirmText="Удалить заявку и прикреплённый файл навсегда?"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
