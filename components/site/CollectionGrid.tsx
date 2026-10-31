import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Collection } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/content";

/** A category's collections as a grid of portrait photos, name underneath,
 * ending with the "Customize your Niche" tile. Sizes follow Figma and are in
 * vw so each breakpoint keeps its proportions:
 * - phones: one column, 313×419 photo on a 375px screen;
 * - tablets: three columns, 221×296 photos on an 800px screen (44px sides);
 * - from lg: three columns, 375×504 photos on a 1280px screen (44px sides). */
export async function CollectionGrid({
  collections,
  emptyText,
}: {
  collections: Collection[];
  emptyText?: string;
}) {
  const { custom } = await getSiteContent(await getLocale());

  const tiles = [
    ...collections.map((c) => ({ href: `/collections/${c.slug}`, title: c.title, image: c.coverImage })),
    { href: "/custom", title: custom.tileTitle, image: custom.tileImage },
  ];

  return (
    <>
      {collections.length === 0 && emptyText && (
        <p className="px-5 pt-16 text-center text-sm text-ink-faint">{emptyText}</p>
      )}

      <div className="mx-auto grid w-[83.47vw] grid-cols-1 gap-y-[58px] pb-24 pt-7 md:w-auto md:grid-cols-3 md:gap-x-[3.06vw] md:gap-y-12 md:px-[5.5vw] md:pt-[6vw] lg:gap-x-[2.62vw] lg:px-[3.44vw] lg:pt-[60px]">
        {tiles.map((tile, i) => (
          <Link key={tile.href} href={tile.href} className="group flex flex-col items-center">
            <span className="relative block aspect-313/419 w-full overflow-hidden bg-cream-deep md:aspect-221/296 lg:aspect-375/504">
              {tile.image && (
                <Image
                  src={tile.image}
                  alt={tile.title}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 28vw, 84vw"
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
