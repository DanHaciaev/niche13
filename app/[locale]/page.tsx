import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { NewsCarousel } from "@/components/site/NewsCarousel";
import { localeAlternates } from "@/lib/seo/alternates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates("", locale) };
}

const newsImages = [
  "/middle_1.jpg",
  "/middle_2.jpg",
  "/middle_3.jpg",
  "/middle_4.jpg",
  "/middle_5.jpg",
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Niche",
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        }}
      />

      {/* Hero */}
      <section className="grid gap-12 px-5 pb-24 pt-10 sm:px-8 sm:pb-32 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-12 lg:pt-16">
        <p className="mx-auto max-w-md text-center text-base leading-relaxed text-ink-soft lg:mx-0 lg:max-w-sm lg:text-right lg:text-[18px]">
          <Image
            src="/logo.png"
            alt="Niche"
            width={148}
            height={84}
            priority
            className="mr-2 inline-block h-8 w-auto -translate-y-0.5 align-middle sm:h-9"
          />
          {t("intro")}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
          <div className="relative aspect-265/355 overflow-hidden">
            <Image
              src="/top1.jpg"
              alt="Niche — original illustration"
              fill
              sizes="(min-width: 1024px) 25vw, 45vw"
              priority
              className="object-cover"
            />
          </div>
          <div className="relative aspect-265/355 overflow-hidden">
            <Image
              src="/top2.jpg"
              alt="Niche — lookbook"
              fill
              sizes="(min-width: 1024px) 25vw, 45vw"
              priority
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* News */}
      <div className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="flex items-center gap-6">
          <span className="label-tag shrink-0 text-ink">{t("news")}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
      </div>

      <NewsCarousel images={newsImages} label={t("news")} />
    </>
  );
}
