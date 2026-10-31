import Image from "next/image";
import { getLocale } from "next-intl/server";
import type { Collection } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/content";
import { CollectionsList, type CollectionRow } from "./CollectionsList";

/** Logo screen followed by the zigzag list of collections, ending with the
 * "Customize your Niche" row. Used by a category page, and by /collections
 * itself until categories exist. */
export async function CollectionsListing({
  collections,
  title,
  emptyText,
}: {
  collections: Collection[];
  /** Shown under the logo, e.g. the category name. */
  title?: string;
  emptyText?: string;
}) {
  const { custom } = await getSiteContent(await getLocale());

  const rows: CollectionRow[] = [
    ...collections.map((c) => ({
      href: `/collections/${c.slug}`,
      eyebrow: c.eyebrow || undefined,
      title: c.title,
      reverse: c.layout === "right",
      feature: c.layout === "feature",
      placeholderLabel: "",
      image: c.coverImage ?? undefined,
    })),
    {
      href: "/custom",
      title: custom.tileTitle,
      reverse: true,
      placeholderLabel: "",
      image: custom.tileImage ?? undefined,
    },
  ];

  return (
    <>
      <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-6 px-5">
        <Image src="/logo.png" alt="Niche" width={200} height={148} className="h-16 w-auto md:h-20" />
        {title && <h1 className="text-[13px] font-normal uppercase text-ink">{title}</h1>}
      </div>

      {collections.length === 0 && emptyText && (
        <p className="px-5 pb-20 text-center text-sm text-ink-faint">{emptyText}</p>
      )}

      <CollectionsList rows={rows} />
    </>
  );
}
