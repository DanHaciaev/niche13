import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryGrid } from "@/components/site/CategoryGrid";
import { CollectionsListing } from "@/components/site/CollectionsListing";
import { getCategories, getCollections } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });
  return { title: t("title") };
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const categories = await getCategories(locale);
  if (categories.length > 0) {
    const { categoryPlaceholder } = await getSiteContent(locale);
    return <CategoryGrid categories={categories} placeholderImage={categoryPlaceholder} />;
  }

  // No categories set up yet: show every collection, as the page did before.
  return <CollectionsListing collections={await getCollections(locale)} />;
}
