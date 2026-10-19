import "server-only";
import type { AdminSession } from "./auth";
import type { BarDatum } from "@/components/admin/charts";

/** ISO timestamp `days` ago, for "created in the last N days" filters. */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

const dayLabel = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone: "UTC" });

export async function dailyViews(admin: AdminSession, days: number): Promise<BarDatum[]> {
  const { data, error } = await admin.supabase.rpc("admin_views_daily", { days });
  if (error) console.error("[stats] daily", error);
  return ((data ?? []) as { day: string; views: number; visitors: number }[]).map((row) => ({
    label: dayLabel.format(new Date(`${row.day}T00:00:00Z`)).replace(".", ""),
    value: Number(row.views),
    detail: `${Number(row.visitors)} посетит.`,
  }));
}

export async function viewsSummary(admin: AdminSession, days: number) {
  const { data, error } = await admin.supabase.rpc("admin_views_summary", { days }).single();
  if (error) console.error("[stats] summary", error);
  const row = (data ?? {}) as Partial<Record<"views" | "visitors" | "views_ru" | "views_en", number>>;
  return {
    views: Number(row.views ?? 0),
    visitors: Number(row.visitors ?? 0),
    ru: Number(row.views_ru ?? 0),
    en: Number(row.views_en ?? 0),
  };
}

export async function topPages(admin: AdminSession, days: number, limit = 10) {
  const { data, error } = await admin.supabase.rpc("admin_top_pages", { days, max_rows: limit });
  if (error) console.error("[stats] top pages", error);
  return ((data ?? []) as { path: string; views: number; visitors: number }[]).map((row) => ({
    label: row.path === "/" ? "Главная" : row.path,
    value: Number(row.views),
    detail: `${Number(row.visitors)} уникальных посетителей`,
  }));
}
