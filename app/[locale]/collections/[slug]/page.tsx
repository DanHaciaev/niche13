import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Product as GridProduct } from "@/components/site/ProductGrid";
import { FilterableProducts } from "@/components/site/FilterableProducts";
import { OrderRequestForm } from "@/components/site/OrderRequestForm";
import { ChooseYourDesignForm } from "@/components/site/ChooseYourDesignForm";
import { OneOfOneForm } from "@/components/site/OneOfOneForm";
import { IllustrationGrid } from "@/components/site/IllustrationGrid";
import { formatPrice, getCollection, getCollections, type Collection } from "@/lib/data/catalog";
import { renderBreaks } from "@/lib/rich-text";

/** Build every collection page ahead of time; new ones added in the admin
 * are rendered on first visit and cached from then on. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return (await getCollections(params.locale)).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });
  const data = await getCollection(slug, locale);
  if (!data) return {};
  return { title: `${t("detail.titlePrefix")} ${data.collection.title}` };
}

function Hero({
  title,
  description,
  image,
  alt,
}: {
  title: string;
  description: React.ReactNode;
  image: string;
  alt: string;
}) {
  return (
    <section className="flex flex-col-reverse items-end gap-3 px-5 pb-28 pt-10 md:px-8 md:flex-row md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
      <div className="flex w-full flex-1 justify-center">
        <div className="text-left md:max-w-170">
          <h1 className="label-tag text-ink text-[14px]! md:text-[20px]! lg:text-[24px]!">
            {title}
          </h1>
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

function heroImage(collection: Collection, fallback: string) {
  return collection.heroImage || collection.coverImage || fallback;
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

  const data = await getCollection(slug, locale);
  if (!data) notFound();
  const { collection, products } = data;

  const gridProducts: GridProduct[] = products.map((p) => ({
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

  const filterLabels = {
    filters: t("detail.filters"),
    gender: t("detail.gender"),
    male: t("detail.male"),
    female: t("detail.female"),
    sortBy: t("detail.sortBy"),
    priceLowHigh: t("detail.priceLowHigh"),
    priceHighLow: t("detail.priceHighLow"),
    clearFilters: t("detail.clearFilters"),
  };

  if (collection.kind === "one_of_one") {
    const tPage = await getTranslations("collections.oneOfOnePage");
    const tPageForm = await getTranslations("collections.oneOfOnePage.form");

    return (
      <>
        <Hero
          title={tPage("heroTitle")}
          description={collection.description ? renderBreaks(collection.description) : tPage("heroDescription")}
          image={heroImage(collection, "/collection7.png")}
          alt={tPage("heroTitle")}
        />

        <FilterableProducts products={gridProducts} slug={slug} labels={filterLabels} />

        <div className="flex items-center gap-4 px-5 pt-24 md:px-8 lg:px-12">
          <span className="label-tag text-ink font-medium! text-[11px]! md:text-[13px]! lg:text-base!">{t("detail.orderRequest")}</span>
          <span className="h-px flex-1 bg-black/40" aria-hidden />
        </div>

        <p className="px-5 py-12 text-right text-[13px]! font-medium! leading-relaxed text-ink-faint min md:px-8 md:py-20 md:text-right lg:px-12 lg:py-34 ml-auto max-w-200">
          {tPage("orderRequestText")}
        </p>

        <div id="order-request">
          <OneOfOneForm t={tPageForm} heading={tPage("findYourOne")} collectionSlug={slug} />
        </div>
      </>
    );
  }

  if (collection.kind === "illustrations") {
    const tPage = await getTranslations("collections.illustrationsPage");
    const tPageForm = await getTranslations("collections.illustrationsPage.form");

    return (
      <>
        <Hero
          title={tPage("heroTitle")}
          description={collection.description ? renderBreaks(collection.description) : tPage("heroDescription")}
          image={heroImage(collection, "/collection8.jpg")}
          alt={tPage("heroTitle")}
        />

        <div className="px-5 pb-12 md:px-8 lg:px-12">
          <span className="block h-px bg-line" aria-hidden />
        </div>

        <IllustrationGrid
          slug={slug}
          label={tPage("illustrationLabel")}
          items={products.map((p) => ({
            code: p.code,
            image: p.images[0] ?? "/collection9.jpg",
            onSale: p.discountPrice !== null,
            soldOut: p.soldOut,
          }))}
          saleLabel={tBadges("sale")}
          outOfStockLabel={tBadges("outOfStock")}
        />

        <div className="flex items-center gap-4 px-5 pt-24 md:px-8 lg:px-12">
          <span className="label-tag text-ink font-medium! text-[11px]! md:text-[13px]! lg:text-base!">{t("detail.orderRequest")}</span>
          <span className="h-px flex-1 bg-black/40" aria-hidden />
        </div>

        <p className="px-5 py-12 text-right text-[13px]! font-medium! leading-relaxed text-ink-faint min md:px-8 md:py-20 md:text-right lg:px-12 lg:py-34 ml-auto max-w-165">
          {tPage("orderRequestText")}
        </p>

        <div id="order-request">
          <ChooseYourDesignForm t={tPageForm} heading={tPage("chooseYourDesign")} collectionSlug={slug} />
        </div>
      </>
    );
  }

  return (
    <>
      <Hero
        title={`${t("detail.titlePrefix")} ${collection.title}`}
        description={renderBreaks(collection.description || t("detail.description"))}
        image={heroImage(collection, "/collection1.png")}
        alt={collection.title}
      />

      <FilterableProducts products={gridProducts} slug={slug} labels={filterLabels} />

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
        <OrderRequestForm t={tForm} heading={t("detail.findPiece")} collectionSlug={slug} />
      </div>
    </>
  );
}
