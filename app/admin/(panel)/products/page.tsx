import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { plainCategories } from "@/lib/admin/catalog-queries";
import { toggleProductFlag } from "@/lib/admin/actions/catalog";
import { formatPrice } from "@/lib/data/catalog";
import { AdminForm } from "@/components/admin/forms";
import { ButtonLink, EmptyState, PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Товары" };

interface Row {
  id: string;
  code: string | null;
  title_ru: string;
  price: number | null;
  discount_price: number | null;
  currency: string;
  images: string[];
  is_hidden: boolean;
  is_sold_out: boolean;
  collection_id: string | null;
  category_id?: string | null;
  sizes: string[];
  track_stock: boolean;
  stock_by_size: Record<string, number>;
}

/** "S 3 · M 0 · L 5" plus the total, or null when stock isn't tracked. */
function stockSummary(p: Row) {
  if (!p.track_stock) return null;
  const entries = (p.sizes ?? []).map((size) => [size, Number(p.stock_by_size?.[size]) || 0] as const);
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  return { entries, total };
}

function QuickToggle({ id, flag, value, label }: { id: string; flag: string; value: boolean; label: string }) {
  return (
    <AdminForm action={toggleProductFlag}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="flag" value={flag} />
      <input type="hidden" name="value" value={String(!value)} />
      <button
        type="submit"
        className={`label-tag px-2 py-1.5 text-[8px]! font-semibold! transition-colors ${
          value ? "bg-ink text-white hover:bg-ink-soft" : "border border-line bg-white text-ink-faint hover:border-ink hover:text-ink"
        }`}
      >
        {label}
      </button>
    </AdminForm>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string; category?: string }>;
}) {
  const admin = await requireAdmin();
  const { collection, category } = await searchParams;
  const filter = z.uuid().safeParse(collection).success ? collection! : null;
  const categoryFilter = !filter && z.uuid().safeParse(category).success ? category! : null;

  const [{ data: collections }, categories, productsResult] = await Promise.all([
    admin.supabase.from("collections").select("id, title_ru, slug").order("sort_order").order("created_at"),
    plainCategories(admin),
    (() => {
      // "*": keeps working before schema.sql adds products.category_id.
      let q = admin.supabase.from("products").select("*").order("sort_order").order("code");
      if (filter) q = q.eq("collection_id", filter);
      if (categoryFilter) q = q.eq("category_id", categoryFilter);
      return q;
    })(),
  ]);

  const rows = (productsResult.data ?? []) as Row[];
  const byId = new Map((collections ?? []).map((c) => [c.id as string, c as { id: string; title_ru: string; slug: string }]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const newHref = filter
    ? `/admin/products/new?collection=${filter}`
    : categoryFilter
      ? `/admin/products/new?category=${categoryFilter}`
      : "/admin/products/new";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`${rows.length} ${filter ? "в коллекции" : categoryFilter ? "в категории" : "всего"}`}
        title="Товары"
        actions={<ButtonLink href={newHref}>+ Новый товар</ButtonLink>}
      />

      {(collections?.length ?? 0) > 0 && (
        <nav className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          {[
            { id: null, title_ru: "Все", param: "" },
            ...(collections ?? []).map((c) => ({ id: c.id as string, title_ru: c.title_ru as string, param: "collection" })),
            ...categories.map((c) => ({ id: c.id, title_ru: c.title_ru, param: "category" })),
          ].map((c) => {
            const active = c.id === null ? !filter && !categoryFilter : c.id === (filter ?? categoryFilter);
            return (
              <Link
                key={c.id ?? "all"}
                href={c.id ? `/admin/products?${c.param}=${c.id}` : "/admin/products"}
                className={`label-tag shrink-0 px-4 py-2.5 text-[10px]! font-medium! transition-colors ${
                  active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {c.title_ru}
              </Link>
            );
          })}
        </nav>
      )}

      {(collections?.length ?? 0) === 0 ? (
        <EmptyState
          title="Сначала коллекция"
          text="Каждый товар принадлежит коллекции. Создайте хотя бы одну — или выполните schema.sql, там есть стартовые."
          action={<ButtonLink href="/admin/collections/new">+ Новая коллекция</ButtonLink>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Товаров пока нет"
          text="Пока в базе нет товаров, сайт показывает демонстрационный каталог. Добавьте первый товар — и сайт переключится на реальные данные."
          action={<ButtonLink href="/admin/products/new">+ Добавить товар</ButtonLink>}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {rows.map((p) => {
            const col = p.collection_id ? byId.get(p.collection_id) : null;
            const stock = stockSummary(p);
            return (
              <li key={p.id} className={`group flex flex-col border border-line bg-white transition-opacity ${p.is_hidden ? "opacity-60" : ""}`}>
                <Link href={`/admin/products/${p.id}`} className="relative block aspect-3/4 overflow-hidden bg-cream">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails
                    <img
                      src={p.images[0]}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="label-tag absolute inset-0 flex items-center justify-center text-[10px]! text-ink-faint">
                      Нет фото
                    </span>
                  )}
                  {p.discount_price !== null && (
                    <span className="label-tag absolute left-0 top-0 bg-[#981C1C] px-2 py-1 text-[8px]! text-white">Скидка</span>
                  )}
                  {stock && stock.total === 0 && (
                    <span className="label-tag absolute bottom-0 left-0 right-0 bg-ink-soft/90 py-1 text-center text-[8px]! text-white">
                      Закончился
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-3 p-3.5">
                  <Link href={`/admin/products/${p.id}`} className="min-w-0">
                    <span className="label-tag block text-[11px]! font-semibold! text-ink">NICHE / {p.code ?? "—"}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-faint">
                      {col?.title_ru ?? (p.category_id ? categoryById.get(p.category_id)?.title_ru : null) ?? "Без коллекции"}
                      {p.title_ru ? ` · ${p.title_ru}` : ""}
                    </span>
                    <span className="mt-1.5 flex items-baseline gap-2 text-sm">
                      {p.discount_price !== null ? (
                        <>
                          <span className="text-ink-faint line-through">{formatPrice(Number(p.price), p.currency)}</span>
                          <span className="font-medium text-[#981C1C]">{formatPrice(Number(p.discount_price), p.currency)}</span>
                        </>
                      ) : (
                        <span className="font-medium text-ink">{p.price !== null ? formatPrice(Number(p.price), p.currency) : "Цена не указана"}</span>
                      )}
                    </span>
                  </Link>
                  {stock && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] tabular-nums">
                      {stock.entries.map(([size, n]) => (
                        <span key={size} className={n === 0 ? "text-[#981C1C] line-through" : n <= 3 ? "text-[#981C1C]" : "text-ink-soft"}>
                          {size} {n}
                        </span>
                      ))}
                      <span className="font-semibold text-ink">· {stock.total} шт.</span>
                    </div>
                  )}
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    <QuickToggle id={p.id} flag="is_hidden" value={p.is_hidden} label={p.is_hidden ? "Скрыт" : "Скрыть"} />
                    <QuickToggle id={p.id} flag="is_sold_out" value={p.is_sold_out} label="Нет в наличии" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
