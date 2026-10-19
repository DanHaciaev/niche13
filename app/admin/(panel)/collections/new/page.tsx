import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { CollectionEditor, EMPTY_COLLECTION } from "@/components/admin/CollectionEditor";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Новая коллекция" };

export default async function NewCollectionPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/collections" className="label-tag w-fit text-[10px]! font-medium! text-ink-faint hover:text-ink">
        ← Все коллекции
      </Link>
      <PageHeader eyebrow="Каталог" title="Новая коллекция" />
      <CollectionEditor collection={EMPTY_COLLECTION} />
    </div>
  );
}
