import Image from "next/image";
import { Link } from "@/i18n/navigation";

export function IllustrationGrid({
  slug,
  label,
  count = 8,
  saleLabel,
  outOfStockLabel,
}: {
  slug: string;
  label: string;
  count?: number;
  saleLabel?: string;
  outOfStockLabel?: string;
}) {
  const items = Array.from({ length: count }, (_, i) => String(i + 1).padStart(3, "0"));

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 px-5 md:grid-cols-3 md:gap-x-6 md:px-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14 lg:px-12">
      {items.map((code, i) => (
        <Link key={code} href={`/collections/${slug}/${code}`} className="group flex flex-col">
          <div className="relative">
            <div className="relative aspect-3/4 w-full overflow-hidden">
              <Image
                src="/collection9.jpg"
                alt={`${label} / ${code}`}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                className="object-cover transition-opacity duration-500 group-hover:opacity-80"
              />
            </div>
            {i === 3 && (
              <span className="label-tag absolute -left-1 -top-1 flex w-25 h-7 items-center justify-center bg-[#981C1C] text-center text-[18px]! text-white">
                {saleLabel}
              </span>
            )}
            {i === 2 && (
              <span className="label-tag absolute -left-1 -top-1 flex h-7 w-37 items-center justify-center bg-ink-soft text-center text-[18px]! text-white">
                {outOfStockLabel}
              </span>
            )}
          </div>
          <span className="label-tag mt-4 text-ink">
            {label} / {code}
          </span>
        </Link>
      ))}
    </div>
  );
}
