import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Placeholder } from "@/components/site/Placeholder";
import { ProductGrid, type Product } from "@/components/site/ProductGrid";
import { OrderRequestForm } from "@/components/site/OrderRequestForm";
import { getCollections } from "@/lib/collections-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });
  const collection = getCollections(t).find((c) => c.slug === slug);
  if (!collection) return {};
  return { title: `${t("detail.titlePrefix")} ${collection.title}` };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("collections");
  const tForm = await getTranslations("collections.detail.form");
  const tBadges = await getTranslations("badges");

  const collection = getCollections(t).find((c) => c.slug === slug);
  if (!collection) notFound();

  const products: Product[] = Array.from({ length: 8 }, (_, i) => {
    const code = String(i + 1).padStart(3, "0");
    if (i === 3) {
      return {
        code,
        price: t("detail.price"),
        discountPrice: t("detail.discountPrice"),
        saleLabel: tBadges("sale"),
      };
    }
    return { code, price: t("detail.price") };
  });

  return (
    <>
      <section className="flex flex-col-reverse items-center gap-10 px-5 pb-28 pt-10 sm:flex-row sm:items-center sm:gap-10 sm:px-8 sm:pb-20 sm:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
        <div className="w-full text-left sm:w-[40%] lg:w-[36%]">
          <h1 className="label-tag text-ink">
            {t("detail.titlePrefix")} {collection.title}
          </h1>
          <p className="mt-4 text-center text-sm leading-relaxed text-ink-soft">
            {t("detail.description")}
          </p>
        </div>

        <Placeholder
          label={collection.placeholderLabel}
          className="ml-auto aspect-3/4 w-[62%] sm:ml-0 sm:w-[60%] lg:w-[64%]"
        />
      </section>

      <div className="flex items-center gap-4 px-5 pb-12 sm:px-8 lg:px-12">
        <span className="h-px flex-1 bg-line" aria-hidden />
        <span className="label-tag text-ink">{t("detail.filters")}</span>
      </div>

      <ProductGrid products={products} />

      <div className="flex items-center gap-4 px-5 pb-10 pt-24 sm:px-8 lg:px-12">
        <span className="h-px flex-1 bg-line" aria-hidden />
        <span className="label-tag text-ink">{t("detail.orderRequest")}</span>
      </div>

      <p className="px-5 pb-16 text-center text-sm leading-relaxed text-ink-faint sm:px-8 sm:text-right lg:px-12 lg:text-[24px]">
        {t("detail.exploreLine1")}
        <br />
        {t("detail.exploreLine2")}
      </p>

      <OrderRequestForm t={tForm} heading={t("detail.findPiece")} />
    </>
  );
}
