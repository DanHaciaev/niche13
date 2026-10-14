import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Product } from "@/components/site/ProductGrid";
import { FilterableProducts } from "@/components/site/FilterableProducts";
import { OrderRequestForm } from "@/components/site/OrderRequestForm";
import { ChooseYourDesignForm } from "@/components/site/ChooseYourDesignForm";
import { OneOfOneForm } from "@/components/site/OneOfOneForm";
import { IllustrationGrid } from "@/components/site/IllustrationGrid";
import { getCollections } from "@/lib/collections-data";
import { renderBreaks } from "@/lib/rich-text";

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

  const priceValue = parseInt(t("detail.price"), 10);
  const discountPriceValue = parseInt(t("detail.discountPrice"), 10);

  const products: Product[] = Array.from({ length: 8 }, (_, i) => {
    const code = String(i + 1).padStart(3, "0");
    const gender = i % 2 === 0 ? "male" : "female";
    const genderLabel = gender === "male" ? t("detail.male") : t("detail.female");
    if (i === 2) {
      return {
        code,
        price: t("detail.price"),
        priceValue,
        outOfStock: true,
        outOfStockLabel: tBadges("outOfStock"),
        gender,
        genderLabel,
      };
    }
    if (i === 3) {
      return {
        code,
        price: t("detail.price"),
        priceValue,
        discountPrice: t("detail.discountPrice"),
        discountPriceValue,
        saleLabel: tBadges("sale"),
        gender,
        genderLabel,
      };
    }
    return { code, price: t("detail.price"), priceValue, gender, genderLabel };
  });

  if (slug === "one-of-one") {
    const tPage = await getTranslations("collections.oneOfOnePage");
    const tPageForm = await getTranslations("collections.oneOfOnePage.form");

    return (
      <>
        <section className="flex flex-col-reverse items-end gap-3 px-5 pb-28 pt-10 md:px-8 md:flex-row md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
          <div className="flex w-full flex-1 justify-center">
            <div className="text-left md:max-w-170">
              <h1 className="label-tag text-ink text-[14px]! md:text-[20px]! lg:text-[24px]!">
                {tPage("heroTitle")}
              </h1>
              <p className="mt-2 text-right font-medium text-[13px] md:text-base lg:text-[18px] leading-relaxed text-ink-soft md:mt-2">
                {tPage("heroDescription")}
              </p>
            </div>
          </div>

          <div className="relative aspect-3/4 w-[55%] shrink-0 overflow-hidden md:w-[38%] lg:w-[32%]">
            <Image
              src="/collection7.png"
              alt={tPage("heroTitle")}
              fill
              sizes="(min-width: 1024px) 32vw, (min-width: 769px) 38vw, 55vw"
              priority
              className="object-cover"
            />
          </div>
        </section>

        <FilterableProducts
          products={products}
          slug={slug}
          labels={{
            filters: t("detail.filters"),
            gender: t("detail.gender"),
            male: t("detail.male"),
            female: t("detail.female"),
            sortBy: t("detail.sortBy"),
            priceLowHigh: t("detail.priceLowHigh"),
            priceHighLow: t("detail.priceHighLow"),
            clearFilters: t("detail.clearFilters"),
          }}
        />

        <div className="flex items-center gap-4 px-5 pt-24 md:px-8 lg:px-12">
          <span className="label-tag text-ink font-medium! text-[11px]! md:text-[13px]! lg:text-base!">{t("detail.orderRequest")}</span>
          <span className="h-px flex-1 bg-black/40" aria-hidden />
        </div>

        <p className="px-5 py-12 text-right text-[13px]! font-medium! leading-relaxed text-ink-faint min md:px-8 md:py-20 md:text-[20px] md:text-right lg:px-12 lg:py-34 ml-auto max-w-200">
          {tPage("orderRequestText")}
        </p>

        <OneOfOneForm t={tPageForm} heading={tPage("findYourOne")} />
      </>
    );
  }

  if (slug === "illustrations") {
    const tPage = await getTranslations("collections.illustrationsPage");
    const tPageForm = await getTranslations("collections.illustrationsPage.form");

    return (
      <>
        <section className="flex flex-col-reverse items-end gap-3 px-5 pb-28 pt-10 md:px-8 md:flex-row md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
          <div className="flex w-full flex-1 justify-center">
            <div className="text-left md:max-w-170">
              <h1 className="label-tag text-ink text-[14px]! md:text-[20px]! lg:text-[24px]!">
                {tPage("heroTitle")}
              </h1>
              <p className="mt-2 text-right font-medium text-[13px] md:text-base lg:text-[18px] leading-relaxed text-ink-soft md:mt-2">
                {tPage("heroDescription")}
              </p>
            </div>
          </div>

          <div className="relative aspect-3/4 w-[55%] shrink-0 overflow-hidden md:w-[38%] lg:w-[32%]">
            <Image
              src="/collection8.jpg"
              alt={tPage("heroTitle")}
              fill
              sizes="(min-width: 1024px) 32vw, (min-width: 769px) 38vw, 55vw"
              priority
              className="object-cover"
            />
          </div>
        </section>

        <div className="px-5 pb-12 md:px-8 lg:px-12">
          <span className="block h-px bg-line" aria-hidden />
        </div>

        <IllustrationGrid
          slug={slug}
          label={tPage("illustrationLabel")}
          saleLabel={tBadges("sale")}
          outOfStockLabel={tBadges("outOfStock")}
        />

        <div className="flex items-center gap-4 px-5 pt-24 md:px-8 lg:px-12">
          <span className="label-tag text-ink font-medium! text-[11px]! md:text-[13px]! lg:text-base!">{t("detail.orderRequest")}</span>
          <span className="h-px flex-1 bg-black/40" aria-hidden />
        </div>

        <p className="px-5 py-12 text-right text-[13px]! font-medium! leading-relaxed text-ink-faint min md:px-8 md:py-20 md:text-[20px] md:text-right lg:px-12 lg:py-34 ml-auto max-w-165">
          {tPage("orderRequestText")}
        </p>

        <ChooseYourDesignForm t={tPageForm} heading={tPage("chooseYourDesign")} />
      </>
    );
  }

  return (
    <>
      <section className="flex flex-col-reverse items-end gap-3 px-5 pb-28 pt-10 md:px-8 md:flex-row md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
        <div className="flex w-full flex-1 justify-center">
          <div className="text-left md:max-w-170">
            <h1 className="label-tag text-ink text-[14px]! md:text-[20px]! lg:text-[24px]!">
              {t("detail.titlePrefix")} {collection.title}
            </h1>
            <p className="mt-2 text-right font-medium text-[13px] md:text-base lg:text-[18px] leading-relaxed text-ink-soft md:mt-2">
              {renderBreaks(t("detail.description"))}
            </p>
          </div>
        </div>

        <div className="relative aspect-3/4 w-[55%] shrink-0 overflow-hidden md:w-[38%] lg:w-[32%]">
          <Image
            src="/collection1.png"
            alt={collection.title}
            fill
            sizes="(min-width: 1024px) 32vw, (min-width: 769px) 38vw, 55vw"
            priority
            className="object-cover"
          />
        </div>
      </section>

      <FilterableProducts
        products={products}
        slug={slug}
        labels={{
          filters: t("detail.filters"),
          gender: t("detail.gender"),
          male: t("detail.male"),
          female: t("detail.female"),
          sortBy: t("detail.sortBy"),
          priceLowHigh: t("detail.priceLowHigh"),
          priceHighLow: t("detail.priceHighLow"),
          clearFilters: t("detail.clearFilters"),
        }}
      />

      <div className="flex items-center gap-4 px-5 pt-24 md:px-8 lg:px-12">
        <span className="label-tag text-ink">{t("detail.orderRequest")}</span>
        <span className="h-px flex-1 bg-black/40" aria-hidden />
      </div>

      <p className="px-5 py-12 text-right text-[13px]! font-medium! leading-relaxed text-ink-faint min md:px-8 md:py-20 md:text-[20px] md:text-right lg:px-12 lg:py-34 ml-auto max-w-340">
        {t("detail.exploreLine1")}
        <br />
        {t("detail.exploreLine2")}
      </p>

      <OrderRequestForm t={tForm} heading={t("detail.findPiece")} />
    </>
  );
}
