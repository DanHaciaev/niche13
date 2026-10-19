import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { KIND_LABELS, STATUS_LABELS } from "@/lib/admin/labels";
import { REQUEST_STATUSES, type RequestKind, type RequestStatus } from "@/lib/requests/schema";
import { EmptyState, PageHeader, StatusBadge, formatDate, inputClass } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Заявки" };

const PAGE_SIZE = 25;

interface Row {
  id: string;
  created_at: string;
  status: RequestStatus;
  kind: RequestKind;
  name: string;
  email: string | null;
  phone: string | null;
  collection_slug: string | null;
  items: unknown[];
  attachment_path: string | null;
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const status = REQUEST_STATUSES.includes(params.status as RequestStatus) ? (params.status as RequestStatus) : null;
  // Only letters, digits and a few safe symbols reach the filter string, so
  // a search can never change the query's structure.
  const q = (params.q ?? "").replace(/[^\p{L}\p{N}@.+\-\s]/gu, "").trim().slice(0, 60);
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));

  let query = admin.supabase
    .from("requests")
    .select("id, created_at, status, kind, name, email, phone, collection_slug, items, attachment_path", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`name.ilike."*${q}*",email.ilike."*${q}*",phone.ilike."*${q}*"`);

  const { data, count, error } = await query;
  if (error) console.error("[admin] requests list", error);
  const rows = (data ?? []) as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const href = (next: { status?: string | null; page?: number }) => {
    const sp = new URLSearchParams();
    const s = next.status === undefined ? status : next.status;
    if (s) sp.set("status", s);
    if (q) sp.set("q", q);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    const str = sp.toString();
    return `/admin/requests${str ? `?${str}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={`${count ?? 0} всего`} title="Заявки" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
          {[null, ...REQUEST_STATUSES].map((s) => {
            const active = s === status;
            return (
              <Link
                key={s ?? "all"}
                href={href({ status: s, page: 1 })}
                className={`label-tag shrink-0 px-4 py-2.5 text-[10px]! font-medium! transition-colors ${
                  active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {s ? STATUS_LABELS[s] : "Все"}
              </Link>
            );
          })}
        </nav>

        <form className="flex gap-2 md:w-80" action="/admin/requests">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Поиск: имя, email, телефон" className={inputClass} />
          <button type="submit" className="label-tag shrink-0 bg-ink px-4 text-[10px]! font-medium! text-white hover:bg-ink-soft">
            Найти
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={q || status ? "Ничего не найдено" : "Заявок пока нет"}
          text={q || status ? "Попробуйте другой фильтр или запрос." : "Как только посетитель отправит форму на сайте, заявка появится здесь."}
        />
      ) : (
        <div className="overflow-hidden border border-line bg-white">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-6 border-b border-line px-6 py-3 md:grid">
            {["Клиент", "Тип", "Дата", "Статус"].map((h) => (
              <span key={h} className="label-tag text-[9px]! font-semibold! text-ink-faint">
                {h}
              </span>
            ))}
          </div>
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/requests/${r.id}`}
                  className={`group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-cream md:grid-cols-[1.4fr_1fr_1fr_auto] md:px-6 ${
                    r.status === "new" ? "bg-[#981C1C]/3" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      {r.status === "new" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#981C1C]" />}
                      <span className="truncate text-sm font-medium text-ink">{r.name}</span>
                    </span>
                    <span className="block truncate text-xs text-ink-faint">{r.email ?? r.phone}</span>
                  </span>
                  <span className="order-3 col-span-2 text-xs text-ink-soft md:order-0 md:col-span-1">
                    {KIND_LABELS[r.kind]}
                    {r.collection_slug && <span className="text-ink-faint"> · {r.collection_slug}</span>}
                    {r.items?.length > 0 && <span className="text-ink-faint"> · {r.items.length} поз.</span>}
                    {r.attachment_path && <span className="text-ink-faint"> · 📎</span>}
                  </span>
                  <span className="order-4 col-span-2 text-xs text-ink-faint md:order-0 md:col-span-1">
                    {formatDate(r.created_at)}
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between">
          <span className="text-xs text-ink-faint">
            Страница {page} из {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ page: page - 1 })} className="label-tag border border-line bg-white px-4 py-2.5 text-[10px]! hover:border-ink">
                ← Назад
              </Link>
            )}
            {page < pages && (
              <Link href={href({ page: page + 1 })} className="label-tag border border-line bg-white px-4 py-2.5 text-[10px]! hover:border-ink">
                Дальше →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
