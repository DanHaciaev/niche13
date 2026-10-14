import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SizeOptions, ColorOptions } from "@/components/site/ProductOptions";
import { getCollections } from "@/lib/collections-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; productCode: string }>;
}): Promise<Metadata> {
  const { locale, productCode } = await params;
  const t = await getTranslations({ locale, namespace: "collections.detail.product" });
  return { title: `NICHE / ${productCode} — ${t("title")}` };
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

  const collection = getCollections(t).find((c) => c.slug === slug);
  if (!collection) notFound();

  if (slug === "illustrations") {
    const tIllustration = await getTranslations("collections.illustrationsPage");
    const tIllustrationProduct = await getTranslations("collections.illustrationsPage.product");

    return (
      <div className="px-5 pb-16 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-16">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-7 lg:gap-16">
          <div className="relative aspect-3/4 w-full overflow-hidden md:w-[42%] lg:w-[30%]">
            <Image
              src="/collection9.jpg"
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
              {tIllustrationProduct("descriptionText")}
            </p>

            <div className="mt-10 lg:mt-20">
              <button
                type="button"
                className="label-tag w-full bg-ink py-4 text-center text-[12px]! font-medium! text-cream transition-colors hover:bg-ink-soft md:w-auto md:px-8 md:text-[14px]! lg:text-[16px]!"
              >
                {tIllustrationProduct("submit")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "one-of-one") {
    const tOneOfOneProduct = await getTranslations("collections.oneOfOnePage.product");
    const descriptionLines = tOneOfOneProduct("descriptionText").split("\n");

    return (
      <div className="px-5 pb-16 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-16">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-7 lg:gap-16">
          <div className="relative aspect-3/4 w-full overflow-hidden md:w-[42%] lg:w-[30%]">
            <Image
              src="/clothes.jpg"
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
              <button
                type="button"
                className="label-tag w-full bg-ink py-4 text-center text-[12px]! font-medium! md:text-[14px]! text-cream transition-colors hover:bg-ink-soft md:w-auto md:px-8 md:text-base! lg:text-[16px]!"
              >
                {tOneOfOneProduct("submit")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-16 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-16">
      <div className="flex flex-col items-center gap-10 md:items-start md:flex-row md:gap-7 lg:gap-16">
        <div className="relative aspect-392/525 w-full shrink-0 overflow-hidden md:w-[42%] lg:w-[30%]">
          <Image
            src="/clothes.jpg"
            alt={`NICHE / ${productCode}`}
            fill
            sizes="(min-width: 1024px) 36vw, (min-width: 640px) 42vw, 100vw"
            priority
            className="object-cover"
          />
        </div>

        <div className="flex-1">
          <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
            {tProduct("nicheNumber")}
          </span>
          <p className="label-tag mt-1 text-[10px]! font-medium! text-ink-faint md:text-[15px]!">
            NICHE/{productCode}
          </p>
          <p className="label-tag mt-1 text-[10px]! font-medium! text-ink-faint md:text-[15px]!">
            {(parseInt(productCode, 10) - 1) % 2 === 0 ? t("detail.male") : t("detail.female")}
          </p>

          <h1 className="label-tag mt-10 lg:mt-20 text-[13px]! md:text-base! font-medium! text-ink">{tProduct("title")}</h1>
          <p className="mt-2 max-w-full font-medium! text-[11px]! md:text-[15px]! leading-relaxed text-ink-soft">
            {tProduct("description")}
          </p>

          <div className="mt-10 lg:mt-20 flex flex-col gap-10 lg:flex-row lg:gap-20">
            <div>
              <div className="flex items-baseline gap-4">
                <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
                  {tProduct("size")}*
                </span>
                <Link
                  href="/size-guide"
                  className="label-tag text-[11px]! text-ink-faint underline-offset-2 hover:text-ink hover:underline md:text-xs!"
                >
                  {tProduct("sizeGuide")}
                </Link>
              </div>
              <div className="mt-3">
                <SizeOptions />
              </div>
            </div>

            <div>
              <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
                {tProduct("quantity")}*
              </span>
              <input
                type="number"
                min={1}
                placeholder={tProduct("quantityPlaceholder")}
                className="mt-3 block w-full border-b border-line bg-transparent pb-2 font-medium! text-[11px]! md:text-[15px]! text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none lg:w-48"
              />
            </div>
          </div>

          <div className="mt-10 lg:mt-20">
            <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
              {tProduct("color")}*
            </span>
            <div className="mt-3">
              <ColorOptions />
            </div>
          </div>

          <div className="mt-15 flex items-center gap-6">
            <button
              type="button"
              className="label-tag bg-ink px-4 py-2 md:px-8 md:py-4 text-[10px]! font-medium! text-cream transition-colors hover:bg-ink-soft md:text-[14px]!"
            >
              {tProduct("addToOrderRequest")}
            </button>
            <Link
              href="/checkout"
              className="label-tag text-[10px]! text-ink-soft text-center underline-offset-2 hover:text-ink hover:underline font-medium! md:text-[14px]!"
            >
              {tProduct("viewYourRequest")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
