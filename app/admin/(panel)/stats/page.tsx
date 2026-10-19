import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { dailyViews, daysAgo, topPages, viewsSummary } from "@/lib/admin/stats";
import { KIND_LABELS } from "@/lib/admin/labels";
import { REQUEST_KINDS } from "@/lib/requests/schema";
import { BarChart, RankList, StatTile } from "@/components/admin/charts";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Статистика" };

const RANGES = [7, 30, 90] as const;

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const admin = await requireAdmin();
  const { range } = await searchParams;
  const days = RANGES.find((r) => String(r) === range) ?? 30;
  const since = daysAgo(days);

  const [daily, summary, pages, requestCounts] = await Promise.all([
    dailyViews(admin, days),
    viewsSummary(admin, days),
    topPages(admin, days, 8),
    Promise.all(
      REQUEST_KINDS.map(async (kind) => {
        const { count } = await admin.supabase
          .from("requests")
          .select("id", { count: "exact", head: true })
          .eq("kind", kind)
          .gte("created_at", since);
        return { label: KIND_LABELS[kind], value: count ?? 0 };
      }),
    ),
  ]);

  const totalRequests = requestCounts.reduce((sum, r) => sum + r.value, 0);
  const conversion = summary.visitors ? ((totalRequests / summary.visitors) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`За последние ${days} дней`}
        title="Статистика"
        actions={
          <nav className="flex border border-line bg-white">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/stats?range=${r}`}
                className={`label-tag px-4 py-2.5 text-[10px]! font-medium! transition-colors ${
                  r === days ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                {r} дней
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatTile label="Просмотры" value={summary.views} note={`≈ ${Math.round(summary.views / days)} в день`} accent />
        <StatTile label="Посетители" value={summary.visitors} note="уникальных за день, суммарно" />
        <StatTile label="Заявки" value={totalRequests} note={`${conversion}% посетителей`} />
        <StatTile label="На английском" value={summary.en} note={`и ${summary.ru} на русском`} />
      </div>

      <Card title="Просмотры по дням" description="Наведите на столбец, чтобы увидеть детали.">
        {summary.views === 0 ? (
          <EmptyState
            title="Пока нет данных"
            text="Просмотры считаются на опубликованном сайте (в режиме npm run dev — нет). Боты и админка не учитываются."
          />
        ) : (
          <BarChart data={daily} unit="просм." title={`Просмотры по дням за ${days} дней`} height={240} />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Популярные страницы">
          {pages.length === 0 ? (
            <p className="text-sm text-ink-faint">Нет данных за этот период.</p>
          ) : (
            <RankList rows={pages} unit="просм." />
          )}
        </Card>
        <Card title="Заявки по типам">
          {totalRequests === 0 ? (
            <p className="text-sm text-ink-faint">Заявок за этот период не было.</p>
          ) : (
            <RankList rows={[...requestCounts].sort((a, b) => b.value - a.value)} unit="шт." />
          )}
        </Card>
      </div>

      <p className="text-xs leading-relaxed text-ink-faint">
        Статистика не использует cookies и не хранит IP-адреса: посетитель учитывается по обезличенному отпечатку,
        который меняется каждый день.
      </p>
    </div>
  );
}
