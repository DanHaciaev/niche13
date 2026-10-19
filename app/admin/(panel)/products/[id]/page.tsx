import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
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

  const [{ data: product }, { data: collections }] = await Promise.all([
    admin.supabase.from("products").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("collections").select("id, title_ru, slug").order("sort_order").order("created_at"),
  ]);
  if (!product) notFound();

  const record = product as ProductRecord;
  const slug = collections?.find((c) => c.id === record.collection_id)?.slug;

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/products" className="label-tag w-fit text-[10px]! font-medium! text-ink-faint hover:text-ink">
        ← Все товары
      </Link>
      <PageHeader
        eyebrow={record.title_ru || "Товар"}
        title={`NICHE / ${record.code ?? "—"}`}
        actions={
          slug && record.code && !record.is_hidden ? (
            <a
              href={`/collections/${slug}/${record.code}`}
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
