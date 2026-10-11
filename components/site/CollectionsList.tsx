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
}

export function CollectionsList({ rows }: { rows: CollectionRow[] }) {
  return (
    <div className="flex flex-col gap-20 px-5 pb-28 sm:gap-24 sm:px-8 lg:gap-32 lg:px-12">
      {rows.map((row, i) =>
        row.feature ? (
          <Link
            key={i}
            href={row.href}
            className="group mx-auto flex w-full max-w-4xl flex-col items-center text-center"
          >
            <Placeholder
              label={row.placeholderLabel}
              className="aspect-video w-full transition-opacity duration-500 group-hover:opacity-80"
            />
            <span className="label-tag mt-6 text-ink">{row.title}</span>
          </Link>
        ) : (
          <Link
            key={i}
            href={row.href}
            className={`group flex flex-col gap-6 lg:items-start lg:justify-between ${
              row.reverse ? "lg:flex-row-reverse" : "lg:flex-row"
            }`}
          >
            <Placeholder
              label={row.placeholderLabel}
              className="aspect-3/4 w-full transition-opacity duration-500 group-hover:opacity-80 lg:w-[46%]"
            />
            <div className="flex shrink-0 flex-col lg:w-[18%] lg:pt-2">
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
