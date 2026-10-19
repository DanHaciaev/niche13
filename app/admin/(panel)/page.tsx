import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { dailyViews, daysAgo, viewsSummary } from "@/lib/admin/stats";
import { KIND_LABELS } from "@/lib/admin/labels";
import type { RequestKind, RequestStatus } from "@/lib/requests/schema";
import { BarChart, StatTile } from "@/components/admin/charts";
import { ButtonLink, Card, EmptyState, PageHeader, StatusBadge, formatDate } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Обзор" };

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("ru-RU", { hour: "numeric", hour12: false, timeZone: "Europe/Chisinau" }).format(new Date()),
  );
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const monthAgo = daysAgo(30);

  const [fresh, month, products, recent, views, summary] = await Promise.all([
    admin.supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin.supabase.from("requests").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
    admin.supabase.from("products").select("id", { count: "exact", head: true }).eq("is_hidden", false),
    admin.supabase
      .from("requests")
      .select("id, created_at, status, kind, name, collection_slug")
      .order("created_at", { ascending: false })
      .limit(6),
    dailyViews(admin, 14),
    viewsSummary(admin, 7),
  ]);

  const requests = (recent.data ?? []) as {
    id: string;
    created_at: string;
    status: RequestStatus;
    kind: RequestKind;
    name: string;
    collection_slug: string | null;
  }[];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow={greeting()}
        title="Обзор"
        actions={<ButtonLink href="/admin/products/new">+ Новый товар</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatTile label="Новые заявки" value={fresh.count ?? 0} note="ждут ответа" accent={(fresh.count ?? 0) > 0} />
        <StatTile label="Заявок за 30 дней" value={month.count ?? 0} />
        <StatTile label="Товаров на сайте" value={products.count ?? 0} />
        <StatTile label="Просмотров за 7 дней" value={summary.views} note={`${summary.visitors} посетителей`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Посещаемость" description="Просмотры страниц за последние 14 дней">
          <BarChart data={views} unit="просм." title="Просмотры по дням за 14 дней" />
          <div className="mt-5 flex justify-end">
            <Link href="/admin/stats" className="label-tag link-underline text-[10px]! font-medium! text-ink">
              Подробная статистика →
            </Link>
          </div>
        </Card>

        <Card title="Последние заявки">
          {requests.length === 0 ? (
            <EmptyState title="Пока пусто" text="Заявки с форм сайта появятся здесь сразу после отправки." />
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/requests/${r.id}`} className="group flex items-center justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink group-hover:underline">{r.name}</span>
                      <span className="block truncate text-xs text-ink-faint">
                        {KIND_LABELS[r.kind]}
                        {r.collection_slug ? ` · ${r.collection_slug}` : ""} · {formatDate(r.created_at)}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex justify-end">
            <Link href="/admin/requests" className="label-tag link-underline text-[10px]! font-medium! text-ink">
              Все заявки →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
