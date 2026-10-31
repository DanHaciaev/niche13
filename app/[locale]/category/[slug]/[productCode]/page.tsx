import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProductDetail } from "@/components/site/ProductDetail";
import { getCategory, getCategoryProduct } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/content";
import { JsonLd } from "@/components/seo/JsonLd";
import { productJsonLd } from "@/lib/seo/jsonld";
import { localizedUrl, pageMetadata, siteIdentity } from "@/lib/seo/metadata";

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
  const data = await getCategoryProduct(slug, productCode, locale);
  if (!data) return {};
  const { productDefaults } = await getSiteContent(locale);
  return pageMetadata({
    locale,
    path: `/category/${slug}/${productCode}`,
    title: `NICHE / ${productCode} — ${data.product.title || productDefaults.title}`,
    description: data.product.description || productDefaults.description,
    image: data.product.images[0],
  });
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

  const { product } = data;
  const { productDefaults } = await getSiteContent(locale);
  const site = await siteIdentity(locale);
  const jsonLd = productJsonLd({
    product,
    name: `NICHE / ${productCode} — ${product.title || productDefaults.title}`,
    description: product.description || productDefaults.description,
    url: localizedUrl(`/category/${slug}/${productCode}`, locale),
    brand: site.brand,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductDetail product={product} code={productCode} basePath={`/category/${slug}`} />
    </>
  );
}
