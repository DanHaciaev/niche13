import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { plainCategories } from "@/lib/admin/catalog-queries";
import { deleteProduct } from "@/lib/admin/actions/catalog";
import { ConfirmAction } from "@/components/admin/forms";
import { ProductEditor, type ProductRecord } from "@/components/admin/ProductEditor";
import { PageHeader } from "@/components/admin/ui";
import { CreatedToast } from "@/components/admin/CreatedToast";

export const metadata: Metadata = { title: "Товар" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const [{ data: product }, { data: collections }, categories] = await Promise.all([
    admin.supabase.from("products").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("collections").select("id, title_ru, slug").order("sort_order").order("created_at"),
    plainCategories(admin),
  ]);
  if (!product) notFound();

  const record = product as ProductRecord;
  const collectionSlug = collections?.find((c) => c.id === record.collection_id)?.slug;
  const categorySlug = categories.find((c) => c.id === record.category_id)?.slug;
  const sitePath = collectionSlug
    ? `/collections/${collectionSlug}`
    : categorySlug
      ? `/category/${categorySlug}`
      : null;

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/products" className="label-tag w-fit text-[10px]! font-medium! text-ink-faint hover:text-ink">
        ← Все товары
      </Link>
      <PageHeader
        eyebrow={record.title_ru || "Товар"}
        title={`NICHE / ${record.code ?? "—"}`}
        actions={
          sitePath && record.code && !record.is_hidden ? (
            <a
              href={`${sitePath}/${record.code}`}
              target="_blank"
              rel="noopener"
              className="label-tag link-underline text-[10px]! font-medium! text-ink"
            >
              Открыть на сайте ↗
            </a>
          ) : null
        }
      />
      <ProductEditor
        product={{
          ...record,
          price: record.price === null ? null : Number(record.price),
          discount_price: record.discount_price === null ? null : Number(record.discount_price),
        }}
        collections={collections ?? []}
        categories={categories}
      />
      <div className="flex justify-end border-t border-line pt-6">
        <ConfirmAction
          action={deleteProduct}
          fields={{ id }}
          label="Удалить товар"
          confirmText="Удалить товар и его фотографии навсегда?"
        />
      </div>
      {created && <CreatedToast message="Товар создан" />}
    </div>
  );
}
