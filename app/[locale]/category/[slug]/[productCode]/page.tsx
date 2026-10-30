import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductDetail } from "@/components/site/ProductDetail";
import { getCategory, getCategoryProduct } from "@/lib/data/catalog";

/** Products of a category without collections (e.g. Bags). */
export async function generateStaticParams({ params }: { params: { locale: string; slug: string } }) {
  const data = await getCategory(params.slug, params.locale);
  return (data?.products ?? []).map((p) => ({ productCode: p.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; productCode: string }>;
}): Promise<Metadata> {
  const { locale, slug, productCode } = await params;
  const t = await getTranslations({ locale, namespace: "collections.detail.product" });
  const data = await getCategoryProduct(slug, productCode, locale);
  if (!data) return {};
  return { title: `NICHE / ${productCode} — ${data.product.title || t("title")}` };
}

export default async function CategoryProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; productCode: string }>;
}) {
  const { locale, slug, productCode } = await params;
  setRequestLocale(locale);

  const data = await getCategoryProduct(slug, productCode, locale);
  if (!data) notFound();

  return <ProductDetail product={data.product} code={productCode} basePath={`/category/${slug}`} />;
}
