import Image from "next/image";
import { Link } from "@/i18n/navigation";

export interface IllustrationItem {
  code: string;
  image: string;
  onSale: boolean;
  soldOut: boolean;
}

export function IllustrationGrid({
  slug,
  label,
  items,
  saleLabel,
  outOfStockLabel,
}: {
  slug: string;
  label: string;
  items: IllustrationItem[];
  saleLabel?: string;
  outOfStockLabel?: string;
}) {

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 px-5 md:grid-cols-3 md:gap-x-6 md:px-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14 lg:px-12">
      {items.map(({ code, image, onSale, soldOut }) => (
        <Link key={code} href={`/collections/${slug}/${code}`} className="group flex flex-col">
          <div className="relative">
            <div className="relative aspect-3/4 w-full overflow-hidden">
              <Image
                src={image}
                alt={`${label} / ${code}`}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                className="object-cover transition-opacity duration-500 group-hover:opacity-80"
              />
            </div>
            {onSale && (
              <span className="label-tag absolute -left-1 -top-1 flex w-25 h-7 items-center font-medium! justify-center bg-[#981C1C] text-center text-[14px]! text-white">
                {saleLabel}
              </span>
            )}
            {soldOut && (
              <span className="label-tag absolute -left-1 -top-1 flex h-7 w-37 items-center font-medium! justify-center bg-ink-soft text-center text-[13px]! text-white">
                {outOfStockLabel}
              </span>
            )}
          </div>
          <span className="label-tag mt-4 text-ink font-medium! text-[10px]! md:text-[11px]! lg:text-[12px]!">
            {label} / {code}
          </span>
        </Link>
      ))}
    </div>
  );
}
