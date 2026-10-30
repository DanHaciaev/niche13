import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { CategoryEditor, EMPTY_CATEGORY } from "@/components/admin/CategoryEditor";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Новая категория" };

export default async function NewCategoryPage() {
  const admin = await requireAdmin();
  const { data: collections } = await admin.supabase
    .from("collections")
    .select("id, title_ru, slug")
    .order("sort_order")
    .order("created_at");

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/categories" className="label-tag w-fit text-[10px]! font-medium! text-ink-faint hover:text-ink">
        ← Все категории
      </Link>
      <PageHeader eyebrow="Каталог" title="Новая категория" />
      <CategoryEditor category={EMPTY_CATEGORY} collections={collections ?? []} linked={[]} />
    </div>
  );
}
