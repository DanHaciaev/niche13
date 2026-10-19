import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { EMPTY_PRODUCT, ProductEditor } from "@/components/admin/ProductEditor";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Новый товар" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const admin = await requireAdmin();
  const { collection } = await searchParams;
  const { data: collections } = await admin.supabase
    .from("collections")
    .select("id, title_ru")
    .order("sort_order")
    .order("created_at");

  const list = collections ?? [];
  const preselected = list.some((c) => c.id === collection) ? collection! : (list[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/products" className="label-tag w-fit text-[10px]! font-medium! text-ink-faint hover:text-ink">
        ← Все товары
      </Link>
      <PageHeader eyebrow="Каталог" title="Новый товар" />
      <ProductEditor product={{ ...EMPTY_PRODUCT, collection_id: preselected }} collections={list} />
    </div>
  );
}
