import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/data/catalog";

const COLUMNS = 3;
/** The design always shows two full rows: real categories first, then plain
 * placeholder photos (no title, no link) until the grid is complete. */
const MIN_TILES = 6;
const PLACEHOLDER_IMAGE = "/top2.jpg";

/** /collections: categories three to a row, name under the photo. Figma at
 * 1280px: 33px side padding, 394×261 photos, 16px apart — all in vw so the
 * proportions hold on every desktop width. One column on phones, where the
 * placeholders are left out. */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  const missing = Math.max(MIN_TILES - categories.length, (COLUMNS - (categories.length % COLUMNS)) % COLUMNS);

  return (
    <div className="grid grid-cols-1 gap-y-8 px-5 pb-24 pt-8 md:grid-cols-3 md:gap-x-[1.25vw] md:gap-y-0 md:px-[2.58vw] md:pb-[5vw] md:pt-[4.5vw]">
      {categories.map((category, i) => (
        <Link key={category.slug} href={`/category/${category.slug}`} className="group flex flex-col items-center">
          <span className="relative block aspect-394/261 w-full overflow-hidden bg-cream-deep">
            {category.image && (
              <Image
                src={category.image}
                alt={category.title}
                fill
                sizes="(min-width: 768px) 31vw, 100vw"
                priority={i < COLUMNS}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            )}
          </span>
          {/* Equal space above and below, so the name sits midway between rows. */}
          <span className="py-[18px] text-center text-[14px] font-semibold uppercase leading-none text-ink transition-colors group-hover:text-ink-soft">
            {category.title}
          </span>
        </Link>
      ))}

      {Array.from({ length: missing }, (_, i) => (
        <span key={`placeholder-${i}`} aria-hidden className="relative hidden aspect-394/261 overflow-hidden md:block">
          <Image src={PLACEHOLDER_IMAGE} alt="" fill sizes="31vw" className="object-cover" />
        </span>
      ))}
    </div>
  );
}
