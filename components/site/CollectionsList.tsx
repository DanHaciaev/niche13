import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Placeholder } from "./Placeholder";

export interface CollectionRow {
  href: string;
  eyebrow?: string;
  title: string;
  sub?: string;
  /** Desktop/tablet only: image sits on the right with the label on the
   * left, instead of the default image-left / label-right. */
  reverse?: boolean;
  /** Full-bleed, centered divider-style row (e.g. "Niche Feelings") instead
   * of the regular image+text zigzag pair. */
  feature?: boolean;
  placeholderLabel: string;
  /** Real photo to use instead of the gradient placeholder, once available. */
  image?: string;
}

function CollectionMedia({
  row,
  className,
  sizes,
}: {
  row: CollectionRow;
  className: string;
  sizes: string;
}) {
  if (!row.image) {
    return (
      <Placeholder
        label={row.placeholderLabel}
        className={`transition-opacity duration-500 group-hover:opacity-80 ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden transition-opacity duration-500 group-hover:opacity-80 ${className}`}
    >
      <Image
        src={row.image}
        alt={row.title}
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}

export function CollectionsList({ rows }: { rows: CollectionRow[] }) {
  return (
    <div className="flex flex-col gap-20 px-5 pb-28 md:gap-24 md:px-8 lg:gap-32 lg:px-12">
      {rows.map((row, i) =>
        row.feature ? (
          <Link
            key={i}
            href={row.href}
            className="group flex w-full flex-col items-center text-center"
          >
            <CollectionMedia row={row} className="aspect-7/3 w-full" sizes="100vw" />
            <span className="label-tag mt-6 text-ink">{row.title}</span>
          </Link>
        ) : (
          <Link
            key={i}
            href={row.href}
            className={`group flex flex-col gap-6 lg:items-start ${
              row.reverse ? "lg:flex-row-reverse" : "lg:flex-row"
            }`}
          >
            <CollectionMedia
              row={row}
              className="aspect-3/4 w-full lg:w-[22%]"
              sizes="(min-width: 1024px) 22vw, 100vw"
            />
            <div
              className={`flex shrink-0 flex-col lg:w-[18%] lg:pt-2 ${
                row.reverse ? "lg:items-end lg:text-right" : "lg:items-start lg:text-left"
              }`}
            >
              {row.eyebrow && (
                <span className="label-tag text-ink-faint">{row.eyebrow}</span>
              )}
              <span className="label-tag mt-1 text-ink">{row.title}</span>
              {row.sub && (
                <span className="label-tag mt-1 text-ink-faint">{row.sub}</span>
              )}
            </div>
          </Link>
        ),
      )}
    </div>
  );
}
