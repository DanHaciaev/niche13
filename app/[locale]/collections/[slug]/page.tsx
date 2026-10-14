import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductGrid, type Product } from "@/components/site/ProductGrid";
import { OrderRequestForm } from "@/components/site/OrderRequestForm";
import { ChooseYourDesignForm } from "@/components/site/ChooseYourDesignForm";
import { OneOfOneForm } from "@/components/site/OneOfOneForm";
import { IllustrationGrid } from "@/components/site/IllustrationGrid";
import { getCollections } from "@/lib/collections-data";
import { renderBreaks } from "@/lib/rich-text";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });
  const collection = getCollections(t).find((c) => c.slug === slug);
  if (!collection) return {};
  return { title: `${t("detail.titlePrefix")} ${collection.title}` };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("collections");
  const tForm = await getTranslations("collections.detail.form");
  const tBadges = await getTranslations("badges");

  const collection = getCollections(t).find((c) => c.slug === slug);
  if (!collection) notFound();

  const products: Product[] = Array.from({ length: 8 }, (_, i) => {
    const code = String(i + 1).padStart(3, "0");
    if (i === 2) {
      return {
        code,
        price: t("detail.price"),
        outOfStock: true,
        outOfStockLabel: tBadges("outOfStock"),
      };
    }
    if (i === 3) {
      return {
        code,
        price: t("detail.price"),
        discountPrice: t("detail.discountPrice"),
        saleLabel: tBadges("sale"),
      };
    }
    return { code, price: t("detail.price") };
  });

  if (slug === "one-of-one") {
    const tPage = await getTranslations("collections.oneOfOnePage");
    const tPageForm = await getTranslations("collections.oneOfOnePage.form");

    return (
      <>
        <section className="flex flex-col-reverse items-end gap-3 px-5 pb-28 pt-10 md:px-8 md:flex-row md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
          <div className="flex w-full flex-1 justify-center">
            <div className="text-left md:max-w-93">
              <h1 className="label-tag text-ink lg:text-[22px]!">{tPage("heroTitle")}</h1>
              <p className="mt-2 text-right text-sm leading-relaxed text-ink-soft md:mt-2">
                {tPage("heroDescription")}
              </p>
            </div>
          </div>

          <div className="relative aspect-3/4 w-[55%] shrink-0 overflow-hidden md:w-[38%] lg:w-[32%]">
            <Image
              src="/collection7.png"
              alt={tPage("heroTitle")}
              fill
              sizes="(min-width: 1024px) 32vw, (min-width: 769px) 38vw, 55vw"
              priority
              className="object-cover"
            />
          </div>
        </section>

        <div className="px-5 pb-12 md:px-8 lg:px-12">
          <span className="block h-px bg-line" aria-hidden />
        </div>

        <ProductGrid products={products} slug={slug} />

        <div className="flex items-center gap-4 px-5 pb-10 pt-24 md:px-8 lg:px-12">
          
          <span className="h-px flex-1 bg-black/40" aria-hidden />
        </div>

        <p className="px-5 pt-16 pb-32 text-right ml-auto text-[13px] max-w-95 leading-relaxed text-ink-faint md:px-8 md:text-[20px] md:max-w-150 md:text-right lg:px-12 lg:max-w-210 lg:text-[24px]">
          {tPage("orderRequestText")}
        </p>

        <OneOfOneForm t={tPageForm} heading={tPage("findYourOne")} />
      </>
    );
  }

  if (slug === "illustrations") {
    const tPage = await getTranslations("collections.illustrationsPage");
    const tPageForm = await getTranslations("collections.illustrationsPage.form");

    return (
      <>
        <section className="flex flex-col-reverse items-end gap-3 px-5 pb-28 pt-10 md:px-8 md:flex-row md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
          <div className="flex w-full flex-1 justify-center">
            <div className="text-left md:max-w-93">
              <h1 className="label-tag text-ink lg:text-[22px]!">{tPage("heroTitle")}</h1>
              <p className="mt-2 text-right text-sm leading-relaxed text-ink-soft md:mt-2">
                {tPage("heroDescription")}
              </p>
            </div>
          </div>

          <div className="relative aspect-3/4 w-[55%] shrink-0 overflow-hidden md:w-[38%] lg:w-[32%]">
            <Image
              src="/collection8.jpg"
              alt={tPage("heroTitle")}
              fill
              sizes="(min-width: 1024px) 32vw, (min-width: 769px) 38vw, 55vw"
              priority
              className="object-cover"
            />
          </div>
        </section>

        <div className="px-5 pb-12 md:px-8 lg:px-12">
          <span className="block h-px bg-line" aria-hidden />
        </div>

        <IllustrationGrid
          slug={slug}
          label={tPage("illustrationLabel")}
          saleLabel={tBadges("sale")}
          outOfStockLabel={tBadges("outOfStock")}
        />

        <div className="flex items-center gap-4 px-5 pb-10 pt-24 md:px-8 lg:px-12">
          <span className="label-tag text-ink">{t("detail.orderRequest")}</span>
          <span className="h-px flex-1 bg-black/40" aria-hidden />
        </div>

        <p className="px-5 pt-16 pb-32 text-right ml-auto text-[13px] max-w-95 leading-relaxed text-ink-faint md:px-8 md:text-[20px] md:max-w-150 md:text-right lg:px-12 lg:max-w-210 lg:text-[24px]">
          {tPage("orderRequestText")}
        </p>

        <ChooseYourDesignForm t={tPageForm} heading={tPage("chooseYourDesign")} />
      </>
    );
  }

  return (
    <>
      <section className="flex flex-col-reverse items-end gap-3 px-5 pb-28 pt-10 md:px-8 md:flex-row md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
        <div className="flex w-full flex-1 justify-center">
          <div className="text-left md:max-w-93">
            <h1 className="label-tag text-ink lg:text-[22px]!">
              {t("detail.titlePrefix")} {collection.title}
            </h1>
            <p className="mt-2 text-right text-sm leading-relaxed text-ink-soft md:mt-2">
              {renderBreaks(t("detail.description"))}
            </p>
          </div>
        </div>

        <div className="relative aspect-3/4 w-[55%] shrink-0 overflow-hidden md:w-[38%] lg:w-[32%]">
          <Image
            src="/collection1.png"
            alt={collection.title}
            fill
            sizes="(min-width: 1024px) 32vw, (min-width: 769px) 38vw, 55vw"
            priority
            className="object-cover"
          />
        </div>
      </section>

      <div className="flex items-center gap-4 px-5 pb-12 md:px-8 lg:px-12">
        <span className="h-px flex-1 bg-black/40" aria-hidden />
      </div>

      <ProductGrid products={products} slug={slug} />

      <div className="flex items-center gap-4 px-5 pb-10 pt-24 md:px-8 lg:px-12">
        <span className="label-tag text-ink">{t("detail.orderRequest")}</span>
        <span className="h-px flex-1 bg-black/40" aria-hidden />
      </div>

      <p className="px-5 pb-16 text-center text-sm leading-relaxed text-ink-faint min md:px-8 md:pt-20 md:pb-30 md:text-[20px] md:text-right lg:px-12 lg:pt-24 lg:pb-34 lg:text-[24px]">
        {t("detail.exploreLine1")}
        <br />
        {t("detail.exploreLine2")}
      </p>

      <OrderRequestForm t={tForm} heading={t("detail.findPiece")} />
    </>
  );
}
