import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogHero, CatalogListing } from "@/components/site/CatalogView";
import { CollectionGrid } from "@/components/site/CollectionGrid";
import { getCategories, getCategory } from "@/lib/data/catalog";
import { renderBreaks } from "@/lib/rich-text";

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return (await getCategories(params.locale)).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getCategory(slug, locale);
  return data ? { title: data.category.title } : {};
}

/** A category opens either the grid of its collections or — when it has no
 * collections (e.g. Bags) — its product catalog straight away. */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = await getCategory(slug, locale);
  if (!data) notFound();
  const { category, collections, products } = data;

  if (!category.hasCollections) {
    const t = await getTranslations("collections");
    return (
      <>
        <CatalogHero
          title={category.title}
          description={renderBreaks(t("detail.description"))}
          image={category.image ?? "/collection1.png"}
          alt={category.title}
        />
        <CatalogListing products={products} basePath={`/category/${slug}`} requestSlug={slug} />
      </>
    );
  }

  const t = await getTranslations("collections.categories");
  return <CollectionGrid collections={collections} emptyText={t("empty")} />;
}
