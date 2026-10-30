import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Collection } from "@/lib/data/catalog";

/** A category's collections as a grid of portrait photos, name underneath,
 * ending with the "Customize your Niche" tile. Sizes follow Figma and are in
 * vw so each breakpoint keeps its proportions:
 * - phones: one column, 314×417 photo on a 375px screen;
 * - tablets: three columns, 5.5% side padding, 2% gaps;
 * - from lg: three columns, 374×501 photos with 44px sides and 35px gaps
 *   on a 1280px screen. */
export async function CollectionGrid({
  collections,
  emptyText,
}: {
  collections: Collection[];
  emptyText?: string;
}) {
  const t = await getTranslations("collections");

  const tiles = [
    ...collections.map((c) => ({ href: `/collections/${c.slug}`, title: c.title, image: c.coverImage })),
    { href: "/custom", title: t("customize"), image: "/collection9.jpg" },
  ];

  return (
    <>
      {collections.length === 0 && emptyText && (
        <p className="px-5 pt-16 text-center text-sm text-ink-faint">{emptyText}</p>
      )}

      <div className="mx-auto grid w-[83.7vw] grid-cols-1 gap-y-[58px] pb-24 pt-7 md:w-auto md:grid-cols-3 md:gap-x-[2vw] md:gap-y-12 md:px-[5.5vw] md:pt-[6vw] lg:gap-x-[2.73vw] lg:px-[3.44vw] lg:pt-[60px]">
        {tiles.map((tile, i) => (
          <Link key={tile.href} href={tile.href} className="group flex flex-col items-center">
            <span className="relative block aspect-374/501 w-full overflow-hidden bg-cream-deep">
              {tile.image && (
                <Image
                  src={tile.image}
                  alt={tile.title}
                  fill
                  sizes="(min-width: 768px) 30vw, 84vw"
                  priority={i < 3}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              )}
            </span>
            <span className="mt-[38px] text-center text-[11px] font-semibold uppercase leading-none text-ink transition-colors group-hover:text-ink-soft md:mt-[14px] lg:mt-[22px] lg:text-[14px]">
              {tile.title}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
