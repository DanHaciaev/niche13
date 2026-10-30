import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CollectionGrid } from "@/components/site/CollectionGrid";
import { getCategories, getCategory } from "@/lib/data/catalog";

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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = await getCategory(slug, locale);
  if (!data) notFound();
  const t = await getTranslations("collections.categories");

  return <CollectionGrid collections={data.collections} emptyText={t("empty")} />;
}
