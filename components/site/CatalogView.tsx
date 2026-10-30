import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Product as GridProduct } from "./ProductGrid";
import { FilterableProducts, type FilterLabels } from "./FilterableProducts";
import { OrderRequestForm } from "./OrderRequestForm";
import { formatPrice, type Product } from "@/lib/data/catalog";

/* Building blocks of a product catalog page, shared by regular collections
   and by categories without collections (e.g. Bags). */

export function CatalogHero({
  title,
  description,
  image,
  alt,
}: {
  title: string;
  description: ReactNode;
  image: string;
  alt: string;
}) {
  return (
    <section className="flex flex-col-reverse items-end gap-3 px-5 pb-28 pt-10 md:px-8 md:flex-row md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
      <div className="flex w-full flex-1 justify-center">
        <div className="text-left md:max-w-170">
          <h1 className="label-tag text-ink text-[14px]! md:text-[20px]! lg:text-[24px]!">{title}</h1>
          <p className="mt-2 text-right font-medium text-[13px] md:text-base lg:text-[18px] leading-relaxed text-ink-soft md:mt-2">
            {description}
          </p>
        </div>
      </div>

      <div className="relative aspect-3/4 w-[55%] shrink-0 overflow-hidden md:w-[38%] lg:w-[32%]">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 32vw, (min-width: 769px) 38vw, 55vw"
          priority
          className="object-cover"
        />
      </div>
    </section>
  );
}

/** Products ready for the grid, plus the filter panel's labels. */
export async function catalogGrid(products: Product[]): Promise<{ items: GridProduct[]; labels: FilterLabels }> {
  const t = await getTranslations("collections");
  const tBadges = await getTranslations("badges");

  const items = products.map((p) => ({
    code: p.code,
    image: p.images[0] ?? "/clothes.jpg",
    price: formatPrice(p.price, p.currency),
    priceValue: p.price ?? undefined,
    ...(p.discountPrice !== null && {
      discountPrice: formatPrice(p.discountPrice, p.currency),
      discountPriceValue: p.discountPrice,
      saleLabel: tBadges("sale"),
    }),
    ...(p.soldOut && { outOfStock: true, outOfStockLabel: tBadges("outOfStock") }),
    ...(p.gender && {
      gender: p.gender,
      genderLabel: p.gender === "male" ? t("detail.male") : t("detail.female"),
    }),
  }));

  const labels = {
    filters: t("detail.filters"),
    gender: t("detail.gender"),
    male: t("detail.male"),
    female: t("detail.female"),
    sortBy: t("detail.sortBy"),
    priceLowHigh: t("detail.priceLowHigh"),
    priceHighLow: t("detail.priceHighLow"),
    clearFilters: t("detail.clearFilters"),
  };

  return { items, labels };
}

/** Filterable product grid followed by the order-request form.
 * `basePath` is where product pages live; `requestSlug` tags requests sent
 * from the form with the collection or category they came from. */
export async function CatalogListing({
  products,
  basePath,
  requestSlug,
}: {
  products: Product[];
  basePath: string;
  requestSlug: string;
}) {
  const t = await getTranslations("collections");
  const tForm = await getTranslations("collections.detail.form");
  const { items, labels } = await catalogGrid(products);

  return (
    <>
      <FilterableProducts products={items} basePath={basePath} labels={labels} />

      <div className="flex items-center gap-4 px-5 pt-24 md:px-8 lg:px-12">
        <span className="label-tag text-ink">{t("detail.orderRequest")}</span>
        <span className="h-px flex-1 bg-black/40" aria-hidden />
      </div>

      <p className="px-5 py-12 text-right text-[13px]! font-medium! leading-relaxed text-ink-faint min md:px-8 md:py-20 md:text-right lg:px-12 lg:py-34 ml-auto max-w-340">
        {t("detail.exploreLine1")}
        <br />
        {t("detail.exploreLine2")}
      </p>

      <div id="order-request">
        <OrderRequestForm t={tForm} heading={t("detail.findPiece")} collectionSlug={requestSlug} />
      </div>
    </>
  );
}
