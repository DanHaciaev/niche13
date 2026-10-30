import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogHero as Hero, CatalogListing, catalogGrid } from "@/components/site/CatalogView";
import { FilterableProducts } from "@/components/site/FilterableProducts";
import { ChooseYourDesignForm } from "@/components/site/ChooseYourDesignForm";
import { OneOfOneForm } from "@/components/site/OneOfOneForm";
import { IllustrationGrid } from "@/components/site/IllustrationGrid";
import { getCollection, getCollections, type Collection } from "@/lib/data/catalog";
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
  const tBadges = await getTranslations("badges");

  const data = await getCollection(slug, locale);
  if (!data) notFound();
  const { collection, products } = data;

  if (collection.kind === "one_of_one") {
    const tPage = await getTranslations("collections.oneOfOnePage");
    const tPageForm = await getTranslations("collections.oneOfOnePage.form");
    const grid = await catalogGrid(products);

    return (
      <>
        <Hero
          title={tPage("heroTitle")}
          description={collection.description ? renderBreaks(collection.description) : tPage("heroDescription")}
          image={heroImage(collection, "/collection7.png")}
          alt={tPage("heroTitle")}
        />

        <FilterableProducts products={grid.items} basePath={`/collections/${slug}`} labels={grid.labels} />

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

      <CatalogListing products={products} basePath={`/collections/${slug}`} requestSlug={slug} />
    </>
  );
}
