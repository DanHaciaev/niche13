import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { COLLECTION_KIND_LABELS, LAYOUT_LABELS } from "@/lib/admin/labels";
import type { CollectionRecord } from "@/components/admin/CollectionEditor";
import { ButtonLink, EmptyState, PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Коллекции" };

export default async function CollectionsPage() {
  const admin = await requireAdmin();
  const [{ data }, { data: products }] = await Promise.all([
    admin.supabase
      .from("collections")
      .select("id, slug, title_ru, eyebrow_ru, cover_image, kind, layout, is_active, sort_order")
      .order("sort_order")
      .order("created_at"),
    admin.supabase.from("products").select("collection_id"),
  ]);

  const rows = (data ?? []) as (CollectionRecord & { id: string })[];
  const counts = new Map<string, number>();
  for (const p of products ?? []) {
    if (p.collection_id) counts.set(p.collection_id, (counts.get(p.collection_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`${rows.length} на сайте и в черновиках`}
        title="Коллекции"
        actions={<ButtonLink href="/admin/collections/new">+ Новая коллекция</ButtonLink>}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Коллекций нет"
          text="Выполните supabase/schema.sql — он создаст все коллекции, которые сейчас есть на сайте."
          action={<ButtonLink href="/admin/collections/new">+ Создать вручную</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col border border-line bg-white">
          {rows.map((c, i) => (
            <li key={c.id} className="border-b border-line last:border-0">
              <Link
                href={`/admin/collections/${c.id}`}
                className={`group grid grid-cols-[64px_1fr_auto] items-center gap-5 px-4 py-3.5 transition-colors hover:bg-cream md:grid-cols-[72px_1fr_180px_120px_auto] md:px-5 ${
                  c.is_active ? "" : "opacity-55"
                }`}
              >
                <span className="relative block aspect-3/4 overflow-hidden bg-cream">
                  {c.cover_image && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img src={c.cover_image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="label-tag block text-[9px]! text-ink-faint">
                    {String(i + 1).padStart(2, "0")} · {c.eyebrow_ru || "—"}
                  </span>
                  <span className="mt-0.5 block truncate text-lg font-medium uppercase tracking-[-0.01em] text-ink">{c.title_ru}</span>
                  <span className="block truncate text-xs text-ink-faint">/collections/{c.slug}</span>
                </span>
                <span className="hidden text-xs text-ink-soft md:block">
                  {COLLECTION_KIND_LABELS[c.kind]}
                  <span className="block text-ink-faint">{LAYOUT_LABELS[c.layout]}</span>
                </span>
                <span className="hidden text-xs text-ink-soft md:block">
                  <span className="text-lg font-medium tabular-nums text-ink">{counts.get(c.id) ?? 0}</span> товаров
                </span>
                <span
                  className={`label-tag px-2 py-1 text-[8px]! font-semibold! ${
                    c.is_active ? "bg-ink text-white" : "border border-line text-ink-faint"
                  }`}
                >
                  {c.is_active ? "На сайте" : "Скрыта"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
