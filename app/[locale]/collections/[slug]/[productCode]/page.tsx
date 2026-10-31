import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCollection, getProduct } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/content";
import { ProductDetail } from "@/components/site/ProductDetail";

export async function generateStaticParams({ params }: { params: { locale: string; slug: string } }) {
  const data = await getCollection(params.slug, params.locale);
  return (data?.products ?? []).map((p) => ({ productCode: p.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; productCode: string }>;
}): Promise<Metadata> {
  const { locale, slug, productCode } = await params;
  const data = await getProduct(slug, productCode, locale);
  if (!data) return {};
  const { productDefaults } = await getSiteContent(locale);
  return { title: `NICHE / ${productCode} — ${data.product.title || productDefaults.title}` };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; productCode: string }>;
}) {
  const { locale, slug, productCode } = await params;
  setRequestLocale(locale);

  const data = await getProduct(slug, productCode, locale);
  if (!data) notFound();
  const { collection, product } = data;

  if (collection.kind === "illustrations") {
    const tIllustration = await getTranslations("collections.illustrationsPage");
    const tIllustrationProduct = await getTranslations("collections.illustrationsPage.product");

    return (
      <div className="px-5 pb-16 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-16">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-7 lg:gap-16">
          <div className="relative aspect-3/4 w-full overflow-hidden bg-cream-deep md:w-[42%] lg:w-[30%]">
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt={`${tIllustration("illustrationLabel")} / ${productCode}`}
                fill
                sizes="(min-width: 1024px) 36vw, (min-width: 640px) 42vw, 100vw"
                priority
                className="object-cover"
              />
            )}
          </div>

          <div className="flex-1">
            <span className="label-tag text-[15px]! font-medium! text-ink md:text-[20px]!">
              {tIllustrationProduct("code")}
            </span>
            <p className="label-tag mt-1 text-[13px]! font-medium! text-ink-faint md:text-[15px]! lg:text-[18px]!">
              {tIllustration("illustrationLabel")} / {productCode}
            </p>

            <span className="label-tag mt-10 lg:mt-20 block text-[15px]! font-medium! text-ink md:text-[16px]! lg:text-[20px]!">
              {tIllustrationProduct("description")}
            </span>
            <p className="mt-2 max-w-full font-medium! text-[13px]! leading-relaxed text-ink-soft md:text-[15px]! lg:text-[18px]!">
              {product.description}
            </p>

            <div className="mt-10 lg:mt-20">
              <Link
                href={`/collections/${slug}#order-request`}
                className="label-tag block w-full bg-ink py-4 text-center text-[12px]! font-medium! text-cream transition-colors hover:bg-ink-soft md:inline-block md:w-auto md:px-8 md:text-[14px]! lg:text-[16px]!"
              >
                {tIllustrationProduct("submit")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (collection.kind === "one_of_one") {
    const tOneOfOneProduct = await getTranslations("collections.oneOfOnePage.product");
    const descriptionLines = product.description.split("\n").filter(Boolean);

    return (
      <div className="px-5 pb-16 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-16">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-7 lg:gap-16">
          <div className="relative aspect-3/4 w-full overflow-hidden bg-cream-deep md:w-[42%] lg:w-[30%]">
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt={`NICHE / ${productCode}`}
                fill
                sizes="(min-width: 1024px) 36vw, (min-width: 640px) 42vw, 100vw"
                priority
                className="object-cover"
              />
            )}
          </div>

          <div className="flex-1">
            <span className="label-tag text-[15px]! font-medium! text-ink md:text-base! lg:text-[20px]!">
              {tOneOfOneProduct("nicheNumber")}
            </span>
            <p className="label-tag mt-1 text-[13px]! font-medium! text-ink-faint md:text-[15px]! lg:text-[18px]!">
              NICHE / {productCode}
            </p>

            <span className="label-tag mt-10 lg:mt-20 block text-[15px]! font-medium! text-ink md:text-base! lg:text-[20px]!">
              {tOneOfOneProduct("detailsTitle")}
            </span>
            <div className="mt-2 max-w-full font-medium! text-[13px]! md:text-[15px]! lg:text-[18px]! leading-relaxed text-ink-soft">
              {descriptionLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <div className="mt-10 lg:mt-20">
              <Link
                href={`/collections/${slug}#order-request`}
                className="label-tag block w-full bg-ink py-4 text-center text-[12px]! font-medium! md:text-[14px]! text-cream transition-colors hover:bg-ink-soft md:inline-block md:w-auto md:px-8 md:text-base! lg:text-[16px]!"
              >
                {tOneOfOneProduct("submit")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ProductDetail product={product} code={productCode} basePath={`/collections/${slug}`} />;
}
