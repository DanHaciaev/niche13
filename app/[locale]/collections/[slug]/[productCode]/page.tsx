import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPrice, getCollection, getProduct } from "@/lib/data/catalog";
import { ProductOrderPanel } from "@/components/site/ProductOrderPanel";

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
  const t = await getTranslations({ locale, namespace: "collections.detail.product" });
  const data = await getProduct(slug, productCode, locale);
  if (!data) return {};
  return { title: `NICHE / ${productCode} — ${data.product.title || t("title")}` };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; productCode: string }>;
}) {
  const { locale, slug, productCode } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("collections");
  const tProduct = await getTranslations("collections.detail.product");
  const tBadges = await getTranslations("badges");

  const data = await getProduct(slug, productCode, locale);
  if (!data) notFound();
  const { collection, product } = data;

  if (collection.kind === "illustrations") {
    const tIllustration = await getTranslations("collections.illustrationsPage");
    const tIllustrationProduct = await getTranslations("collections.illustrationsPage.product");

    return (
      <div className="px-5 pb-16 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-16">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-7 lg:gap-16">
          <div className="relative aspect-3/4 w-full overflow-hidden md:w-[42%] lg:w-[30%]">
            <Image
              src={product.images[0] ?? "/collection9.jpg"}
              alt={`${tIllustration("illustrationLabel")} / ${productCode}`}
              fill
              sizes="(min-width: 1024px) 36vw, (min-width: 640px) 42vw, 100vw"
              priority
              className="object-cover"
            />
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
              {product.description || tIllustrationProduct("descriptionText")}
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
    const descriptionLines = (product.description || tOneOfOneProduct("descriptionText")).split("\n");

    return (
      <div className="px-5 pb-16 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-16">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-7 lg:gap-16">
          <div className="relative aspect-3/4 w-full overflow-hidden md:w-[42%] lg:w-[30%]">
            <Image
              src={product.images[0] ?? "/clothes.jpg"}
              alt={`NICHE / ${productCode}`}
              fill
              sizes="(min-width: 1024px) 36vw, (min-width: 640px) 42vw, 100vw"
              priority
              className="object-cover"
            />
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

  const onSale = product.discountPrice !== null;

  return (
    <div className="px-5 pb-16 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-16">
      <div className="flex flex-col items-center gap-10 md:items-start md:flex-row md:gap-7 lg:gap-16">
        <div className="relative w-full shrink-0 md:w-[42%] lg:w-[30%]">
          <div className="relative aspect-392/525 w-full overflow-hidden">
            <Image
              src={product.images[0] ?? "/clothes.jpg"}
              alt={`NICHE / ${productCode}`}
              fill
              sizes="(min-width: 1024px) 36vw, (min-width: 640px) 42vw, 100vw"
              priority
              className="object-cover"
            />
          </div>
          {onSale && (
            <span className="label-tag absolute -left-1 -top-1 flex w-25 h-7 items-center justify-center font-medium! bg-[#981C1C] text-center text-[14px]! text-white">
              {tBadges("sale")}
            </span>
          )}
          {product.soldOut && (
            <span className="label-tag absolute -left-1 -top-1 flex h-7 w-37 items-center justify-center font-medium! bg-ink-soft text-center text-[13px]! text-white">
              {tBadges("outOfStock")}
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between lg:justify-start lg:gap-20">
            <div className="w-40 md:w-56">
              <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
                {tProduct("nicheNumber")}
              </span>
              <p className="label-tag mt-1 text-[10px]! font-medium! text-ink-faint md:text-[15px]!">
                NICHE/{productCode}
              </p>
              {product.gender && (
                <p className="label-tag mt-1 text-[10px]! font-medium! text-ink-faint md:text-[15px]!">
                  {product.gender === "male" ? t("detail.male") : t("detail.female")}
                </p>
              )}
            </div>

            {product.price !== null && (
              <div className="text-left">
                <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
                  {tProduct("price")}
                </span>
                {onSale ? (
                  <p className="mt-1 flex items-center gap-2">
                    <span className="label-tag text-[10px]! font-medium! text-ink-faint line-through decoration-ink-faint md:text-[15px]!">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    <span className="label-tag text-[10px]! font-medium! text-[#981C1C] md:text-[15px]!">
                      {formatPrice(product.discountPrice, product.currency)}
                    </span>
                  </p>
                ) : (
                  <p className="label-tag mt-1 text-[10px]! font-medium! text-ink-faint md:text-[15px]!">
                    {formatPrice(product.price, product.currency)}
                  </p>
                )}
              </div>
            )}
          </div>

          <h1 className="label-tag mt-10 lg:mt-20 text-[13px]! md:text-base! font-medium! text-ink">
            {product.title || tProduct("title")}
          </h1>
          <p className="mt-2 max-w-full font-medium! text-[11px]! md:text-[15px]! leading-relaxed text-ink-soft">
            {product.description || tProduct("description")}
          </p>

          <ProductOrderPanel
            code={productCode}
            slug={slug}
            sizes={product.sizes}
            colors={product.colors}
            stock={product.stock}
            labels={{
              size: tProduct("size"),
              sizeGuide: tProduct("sizeGuide"),
              quantity: tProduct("quantity"),
              quantityPlaceholder: tProduct("quantityPlaceholder"),
              color: tProduct("color"),
              addToOrderRequest: tProduct("addToOrderRequest"),
              addedToOrderRequest: tProduct("addedToOrderRequest"),
              viewYourRequest: tProduct("viewYourRequest"),
              soldOut: tBadges("outOfStock"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
