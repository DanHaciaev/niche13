import Image from "next/image";
import { Link } from "@/i18n/navigation";

export interface Product {
  code: string;
  image: string;
  price: string;
  priceValue?: number;
  discountPrice?: string;
  discountPriceValue?: number;
  saleLabel?: string;
  outOfStock?: boolean;
  outOfStockLabel?: string;
  gender?: "male" | "female";
  genderLabel?: string;
}

export function ProductGrid({ products, slug }: { products: Product[]; slug: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 px-5 md:grid-cols-3 md:gap-x-6 md:px-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14 lg:px-12">
      {products.map((product) => (
        <Link key={product.code} href={`/collections/${slug}/${product.code}`} className="group flex flex-col">
          <div className="relative">
            <div className="relative aspect-3/4 w-full overflow-hidden">
              <Image
                src={product.image}
                alt={`NICHE / ${product.code}`}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                className="object-cover transition-opacity duration-500 group-hover:opacity-80"
              />
            </div>
            {product.discountPrice && (
              <span className="label-tag absolute -left-1 -top-1 flex w-25 h-7 items-center justify-center font-medium! bg-[#981C1C] text-center text-[14px]! text-white">
                {product.saleLabel}
              </span>
            )}
            {product.outOfStock && (
              <span className="label-tag absolute -left-1 -top-1 flex h-7 w-37 items-center justify-center font-medium! bg-ink-soft text-center text-[13px]! text-white">
                {product.outOfStockLabel}
              </span>
            )}
          </div>
          <span className="label-tag mt-4 text-ink font-medium! text-[10px]! md:text-[11px]! lg:text-[12px]!">NICHE / {product.code}</span>
          {product.genderLabel && (
            <span className="label-tag mt-1 text-ink-faint font-medium! text-[10px]! md:text-[11px]! lg:text-[12px]!">{product.genderLabel}</span>
          )}
          {product.discountPrice ? (
            <span className="mt-1 flex items-center gap-2">
              <span className="label-tag text-ink-faint line-through decoration-ink-faint font-medium! text-[10px]! md:text-[11px]! lg:text-[12px]!">
                {product.price}
              </span>
              <span className="label-tag text-[#981C1C] font-medium! text-[10px]! md:text-[11px]! lg:text-[12px]!">{product.discountPrice}</span>
            </span>
          ) : (
            <span className="label-tag mt-1 text-ink-faint font-medium! text-[10px]! md:text-[11px]! lg:text-[12px]!">{product.price}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
