import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteCategory } from "@/lib/admin/actions/catalog";
import { ConfirmAction } from "@/components/admin/forms";
import { CategoryEditor, type CategoryRecord } from "@/components/admin/CategoryEditor";
import { CreatedToast } from "@/components/admin/CreatedToast";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Категория" };

export default async function EditCategoryPage({
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

  const [{ data }, { data: collections }, { data: links }] = await Promise.all([
    admin.supabase.from("categories").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("collections").select("id, title_ru, slug").order("sort_order").order("created_at"),
    admin.supabase.from("collection_categories").select("collection_id").eq("category_id", id),
  ]);
  if (!data) notFound();
  const category = data as CategoryRecord & { id: string };

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/categories" className="label-tag w-fit text-[10px]! font-medium! text-ink-faint hover:text-ink">
        ← Все категории
      </Link>
      <PageHeader
        eyebrow={`/category/${category.slug}`}
        title={category.title_ru}
        actions={
          category.is_active ? (
            <a
              href={`/category/${category.slug}`}
              target="_blank"
              rel="noopener"
              className="label-tag link-underline text-[10px]! font-medium! text-ink"
            >
              Открыть на сайте ↗
            </a>
          ) : null
        }
      />
      <CategoryEditor
        category={category}
        collections={collections ?? []}
        linked={(links ?? []).map((l) => l.collection_id as string)}
      />
      <div className="flex justify-end border-t border-line pt-6">
        <ConfirmAction
          action={deleteCategory}
          fields={{ id }}
          label="Удалить категорию"
          confirmText="Удалить категорию? Сами коллекции и товары останутся."
        />
      </div>
      {created && <CreatedToast message="Категория создана" />}
    </div>
  );
}
