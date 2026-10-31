import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogHero as Hero, CatalogListing, catalogGrid } from "@/components/site/CatalogView";
import { FilterableProducts } from "@/components/site/FilterableProducts";
import { ChooseYourDesignForm } from "@/components/site/ChooseYourDesignForm";
import { OneOfOneForm } from "@/components/site/OneOfOneForm";
import { IllustrationGrid } from "@/components/site/IllustrationGrid";
import { getCollection, getCollections } from "@/lib/data/catalog";
import { getSiteContent, withBreaks } from "@/lib/data/content";
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
  const data = await getCollection(slug, locale);
  return data ? { title: data.collection.pageTitle } : {};
}

/** Every text here comes from the collection in the database; anything it
 * leaves empty falls back to the site-wide catalog defaults (Admin → Content). */
export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("collections");
  const tBadges = await getTranslations("badges");

  const [data, content] = await Promise.all([getCollection(slug, locale), getSiteContent(locale)]);
  if (!data) notFound();
  const { collection, products } = data;
  const defaults = content.catalogDefaults;

  const description = renderBreaks(withBreaks(collection.description || defaults.description));
  const requestText = renderBreaks(withBreaks(collection.requestText || defaults.requestText));
  const formHeading = collection.formHeading || defaults.formHeading;
  const heroImage = collection.heroImage || collection.coverImage;

  const requestIntro = (maxWidth: string) => (
    <>
      <div className="flex items-center gap-4 px-5 pt-24 md:px-8 lg:px-12">
        <span className="label-tag text-ink font-medium! text-[11px]! md:text-[13px]! lg:text-base!">{t("detail.orderRequest")}</span>
        <span className="h-px flex-1 bg-black/40" aria-hidden />
      </div>
      <p className={`px-5 py-12 text-right text-[13px]! font-medium! leading-relaxed text-ink-faint min md:px-8 md:py-20 md:text-right lg:px-12 lg:py-34 ml-auto ${maxWidth}`}>
        {requestText}
      </p>
    </>
  );

  if (collection.kind === "one_of_one") {
    const tPageForm = await getTranslations("collections.oneOfOnePage.form");
    const grid = await catalogGrid(products);

    return (
      <>
        <Hero title={collection.pageTitle} description={description} image={heroImage} alt={collection.pageTitle} />
        <FilterableProducts products={grid.items} basePath={`/collections/${slug}`} labels={grid.labels} />
        {requestIntro("max-w-200")}
        <div id="order-request">
          <OneOfOneForm t={tPageForm} heading={formHeading} collectionSlug={slug} />
        </div>
      </>
    );
  }

  if (collection.kind === "illustrations") {
    const tPage = await getTranslations("collections.illustrationsPage");
    const tPageForm = await getTranslations("collections.illustrationsPage.form");

    return (
      <>
        <Hero title={collection.pageTitle} description={description} image={heroImage} alt={collection.pageTitle} />

        <div className="px-5 pb-12 md:px-8 lg:px-12">
          <span className="block h-px bg-line" aria-hidden />
        </div>

        <IllustrationGrid
          slug={slug}
          label={tPage("illustrationLabel")}
          items={products.map((p) => ({
            code: p.code,
            image: p.images[0] ?? null,
            onSale: p.discountPrice !== null,
            soldOut: p.soldOut,
          }))}
          saleLabel={tBadges("sale")}
          outOfStockLabel={tBadges("outOfStock")}
        />

        {requestIntro("max-w-165")}
        <div id="order-request">
          <ChooseYourDesignForm t={tPageForm} heading={formHeading} collectionSlug={slug} />
        </div>
      </>
    );
  }

  return (
    <>
      <Hero title={collection.pageTitle} description={description} image={heroImage} alt={collection.title} />
      <CatalogListing
        products={products}
        basePath={`/collections/${slug}`}
        requestSlug={slug}
        requestText={collection.requestText || defaults.requestText}
        formHeading={formHeading}
      />
    </>
  );
}
