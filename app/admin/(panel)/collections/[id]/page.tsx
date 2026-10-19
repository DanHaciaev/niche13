import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteCollection } from "@/lib/admin/actions/catalog";
import { ConfirmAction } from "@/components/admin/forms";
import { CollectionEditor, type CollectionRecord } from "@/components/admin/CollectionEditor";
import { CreatedToast } from "@/components/admin/CreatedToast";
import { ButtonLink, PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Коллекция" };

export default async function EditCollectionPage({
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

  const { data } = await admin.supabase.from("collections").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const collection = data as CollectionRecord & { id: string };

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/collections" className="label-tag w-fit text-[10px]! font-medium! text-ink-faint hover:text-ink">
        ← Все коллекции
      </Link>
      <PageHeader
        eyebrow={`/collections/${collection.slug}`}
        title={collection.title_ru}
        actions={
          <>
            {collection.is_active && (
              <a
                href={`/collections/${collection.slug}`}
                target="_blank"
                rel="noopener"
                className="label-tag link-underline mr-3 text-[10px]! font-medium! text-ink"
              >
                Открыть на сайте ↗
              </a>
            )}
            <ButtonLink href={`/admin/products?collection=${collection.id}`} variant="ghost">
              Товары коллекции
            </ButtonLink>
          </>
        }
      />
      <CollectionEditor collection={collection} />
      <div className="flex justify-end border-t border-line pt-6">
        <ConfirmAction
          action={deleteCollection}
          fields={{ id }}
          label="Удалить коллекцию"
          confirmText="Удалить коллекцию? Это возможно, только если в ней нет товаров."
        />
      </div>
      {created && <CreatedToast message="Коллекция создана" />}
    </div>
  );
}
