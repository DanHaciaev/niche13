import Image from "next/image";

export interface Product {
  code: string;
  price: string;
  discountPrice?: string;
  saleLabel?: string;
  outOfStock?: boolean;
  outOfStockLabel?: string;
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 px-5 sm:grid-cols-3 sm:gap-x-6 sm:px-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14 lg:px-12">
      {products.map((product) => (
        <div key={product.code} className="flex flex-col">
          <div className="relative">
            <div className="relative aspect-3/4 w-full overflow-hidden">
              <Image
                src="/clothes.jpg"
                alt={`NICHE / ${product.code}`}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                className="object-cover"
              />
            </div>
            {product.discountPrice && (
              <span className="label-tag absolute -left-1 -top-1 flex w-25 h-7 items-center justify-center bg-[#981C1C] text-center text-[22px]! text-white">
                {product.saleLabel}
              </span>
            )}
            {product.outOfStock && (
              <span className="label-tag absolute -left-1 -top-1 flex h-7 w-37 items-center justify-center bg-ink-soft text-center text-[11px]! text-white">
                {product.outOfStockLabel}
              </span>
            )}
          </div>
          <span className="label-tag mt-4 text-ink">NICHE / {product.code}</span>
          {product.discountPrice ? (
            <span className="mt-1 flex items-center gap-2">
              <span className="label-tag relative text-ink-faint">
                {product.price}
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink-faint" aria-hidden />
              </span>
              <span className="label-tag text-[#981C1C]">{product.discountPrice}</span>
            </span>
          ) : (
            <span className="label-tag mt-1 text-ink-faint">{product.price}</span>
          )}
        </div>
      ))}
    </div>
  );
}
