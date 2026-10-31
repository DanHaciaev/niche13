import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/data/catalog";

const COLUMNS = 3;
/** The design always shows two full rows: real categories first, then plain
 * placeholder photos (no title, no link) until the grid is complete. */
const MIN_TILES = 6;

/** /collections: categories three to a row, portrait photo with the name
 * under it. Figma: 375×504 on a 1280px screen and 221×296 on 800px (44px
 * side padding both), 313×419 in one column on a 375px phone, where the
 * placeholders are left out. Sizes are in vw so in-between widths scale. */
export function CategoryGrid({
  categories,
  placeholderImage,
}: {
  categories: Category[];
  /** From Admin → Content; without it the grid isn't padded with placeholders. */
  placeholderImage: string | null;
}) {
  const missing = !placeholderImage ? 0 : Math.max(MIN_TILES - categories.length, (COLUMNS - (categories.length % COLUMNS)) % COLUMNS);

  return (
    <div className="mx-auto grid w-[83.47vw] grid-cols-1 gap-y-[66px] pb-24 pt-8 md:w-auto md:grid-cols-3 md:gap-x-[3.06vw] md:gap-y-6 lg:gap-y-[59px] md:px-[5.5vw] md:pb-[5vw] md:pt-[4.5vw] lg:gap-x-[2.62vw] lg:px-[3.44vw]">
      {categories.map((category, i) => (
        <Link key={category.slug} href={`/category/${category.slug}`} className="group flex flex-col items-center">
          <span className="relative block aspect-313/419 w-full overflow-hidden bg-cream-deep md:aspect-221/296 lg:aspect-375/504">
            {category.image && (
              <Image
                src={category.image}
                alt={category.title}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 768px) 28vw, 84vw"
                priority={i < COLUMNS}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            )}
          </span>
          {/* Photo → name / photo → next row, per Figma: phone 20 / 100px,
              tablet 12 / 50px, desktop 17 / 90px (name line is 14px; the
              grid's row gap makes up the rest). */}
          <span className="mt-5 text-center md:mt-3 lg:mt-[17px] text-[14px] font-semibold uppercase leading-none text-ink transition-colors group-hover:text-ink-soft">
            {category.title}
          </span>
        </Link>
      ))}

      {Array.from({ length: missing }, (_, i) => (
        <span key={`placeholder-${i}`} aria-hidden className="relative hidden overflow-hidden md:block md:aspect-221/296 lg:aspect-375/504">
          <Image src={placeholderImage!} alt="" fill sizes="30vw" className="object-cover" />
        </span>
      ))}
    </div>
  );
}
