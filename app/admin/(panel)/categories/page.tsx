import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import type { CategoryRecord } from "@/components/admin/CategoryEditor";
import { ButtonLink, EmptyState, PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Категории" };

export default async function CategoriesPage() {
  const admin = await requireAdmin();
  const [{ data, error }, { data: links }] = await Promise.all([
    admin.supabase
      .from("categories")
      .select("id, slug, title_ru, image, is_active, sort_order")
      .order("sort_order")
      .order("created_at"),
    admin.supabase.from("collection_categories").select("category_id"),
  ]);

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader eyebrow="Каталог" title="Категории" />
        <EmptyState
          title="Таблиц категорий ещё нет"
          text="Выполните заново supabase/schema.sql в SQL Editor Supabase — он создаст категории «Футболки», «Худи» и «Сумки»."
        />
      </div>
    );
  }

  const rows = (data ?? []) as (CategoryRecord & { id: string })[];
  const counts = new Map<string, number>();
  for (const l of links ?? []) counts.set(l.category_id, (counts.get(l.category_id) ?? 0) + 1);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Страница «Коллекции» на сайте"
        title="Категории"
        actions={<ButtonLink href="/admin/categories/new">+ Новая категория</ButtonLink>}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Категорий нет"
          text="Пока их нет, на странице «Коллекции» показывается общий список коллекций."
          action={<ButtonLink href="/admin/categories/new">+ Создать категорию</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/categories/${c.id}`}
                className={`group flex flex-col border border-line bg-white transition-opacity ${c.is_active ? "" : "opacity-55"}`}
              >
                <span className="relative block aspect-394/261 overflow-hidden bg-cream">
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img
                      src={c.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  )}
                </span>
                <span className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block truncate text-base font-medium uppercase text-ink">{c.title_ru}</span>
                    <span className="block text-xs text-ink-faint">
                      {counts.get(c.id) ?? 0} коллекций · /category/{c.slug}
                    </span>
                  </span>
                  <span
                    className={`label-tag shrink-0 px-2 py-1 text-[8px]! font-semibold! ${
                      c.is_active ? "bg-ink text-white" : "border border-line text-ink-faint"
                    }`}
                  >
                    {c.is_active ? "На сайте" : "Скрыта"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
