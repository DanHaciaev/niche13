import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { formatPrice, type Product } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/content";
import { ProductOrderPanel } from "./ProductOrderPanel";

/** Product page for a catalog item: photo with sale/sold-out badge, code,
 * price, description and the size/quantity/colour order panel. Shared by
 * collection products and by products of categories without collections.
 * `basePath` is the listing the product belongs to. */
export async function ProductDetail({
  product,
  code,
  basePath,
}: {
  product: Product;
  code: string;
  basePath: string;
}) {
  const t = await getTranslations("collections");
  const tProduct = await getTranslations("collections.detail.product");
  const tBadges = await getTranslations("badges");
  // Used when a product leaves its own title/description empty (Admin → Content).
  const { productDefaults } = await getSiteContent(await getLocale());
  const onSale = product.discountPrice !== null;

  return (
    <div className="px-5 pb-16 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-16">
      <div className="flex flex-col items-center gap-10 md:items-start md:flex-row md:gap-7 lg:gap-16">
        <div className="relative w-full shrink-0 md:w-[42%] lg:w-[30%]">
          <div className="relative aspect-392/525 w-full overflow-hidden bg-cream-deep">
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt={`NICHE / ${code}`}
                fill
                sizes="(min-width: 1024px) 36vw, (min-width: 640px) 42vw, 100vw"
                priority
                className="object-cover"
              />
            )}
          </div>
          {onSale && (
            <span className="label-tag absolute -left-1 -top-1 flex w-25 h-7 items-center justify-center font-medium! bg-[#981C1C] text-center text-[14px]! text-white">
              {tBadges("sale")}
            </span>
          )}
          {product.soldOut && (
            <span className="label-tag absolute -left-1 -top-1 flex h-7 w-37 items-center justify-center font-medium! bg-ink-soft text-center text-[13px]! text-white">
              {tBadges("outOfStock")}
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between lg:justify-start lg:gap-20">
            <div className="w-40 md:w-56">
              <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
                {tProduct("nicheNumber")}
              </span>
              <p className="label-tag mt-1 text-[10px]! font-medium! text-ink-faint md:text-[15px]!">NICHE/{code}</p>
              {product.gender && (
                <p className="label-tag mt-1 text-[10px]! font-medium! text-ink-faint md:text-[15px]!">
                  {product.gender === "male" ? t("detail.male") : t("detail.female")}
                </p>
              )}
            </div>

            {product.price !== null && (
              <div className="text-left">
                <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">{tProduct("price")}</span>
                {onSale ? (
                  <p className="mt-1 flex items-center gap-2">
                    <span className="label-tag text-[10px]! font-medium! text-ink-faint line-through decoration-ink-faint md:text-[15px]!">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    <span className="label-tag text-[10px]! font-medium! text-[#981C1C] md:text-[15px]!">
                      {formatPrice(product.discountPrice, product.currency)}
                    </span>
                  </p>
                ) : (
                  <p className="label-tag mt-1 text-[10px]! font-medium! text-ink-faint md:text-[15px]!">
                    {formatPrice(product.price, product.currency)}
                  </p>
                )}
              </div>
            )}
          </div>

          <h1 className="label-tag mt-10 lg:mt-20 text-[13px]! md:text-base! font-medium! text-ink">
            {product.title || productDefaults.title}
          </h1>
          <p className="mt-2 max-w-full font-medium! text-[11px]! md:text-[15px]! leading-relaxed text-ink-soft">
            {product.description || productDefaults.description}
          </p>

          <ProductOrderPanel
            code={code}
            basePath={basePath}
            sizes={product.sizes}
            colors={product.colors}
            stock={product.stock}
            labels={{
              size: tProduct("size"),
              sizeGuide: tProduct("sizeGuide"),
              quantity: tProduct("quantity"),
              quantityPlaceholder: tProduct("quantityPlaceholder"),
              color: tProduct("color"),
              addToOrderRequest: tProduct("addToOrderRequest"),
              addedToOrderRequest: tProduct("addedToOrderRequest"),
              viewYourRequest: tProduct("viewYourRequest"),
              soldOut: tBadges("outOfStock"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
