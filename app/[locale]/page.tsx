import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { NewsCarousel } from "@/components/site/NewsCarousel";
import { localeAlternates } from "@/lib/seo/alternates";
import { siteUrl } from "@/lib/site-url";

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
      <section className="flex min-h-screen items-center px-5 pb-24 pt-10 md:px-8 md:pb-32 lg:px-12 lg:pt-16">
        <div className="grid w-full gap-12 md:flex md:flex-col-reverse md:items-end md:gap-3 lg:grid lg:gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div className="mx-auto flex flex-col font-medium items-center gap-4 max-w-md min-w-0 text-right justify-end md:flex-col md:items-end md:gap-5 md:mx-auto md:max-w-140 md:justify-end lg:gap-0 lg:mx-0 lg:ml-auto">
            <Image
              src="/logo.png"
              alt="Niche"
              width={193}
              height={84}
              priority
              className="h-16 md:h-21 w-auto self-start shrink-0 md:self-start lg:self-auto"
            />
            <p className="text-right text-[12px]! tracking-[-2%] leading-relaxed text-ink-soft md:text-base! lg:text-[18px]">
              {t("intro")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 md:ml-auto md:w-[70%] lg:w-full lg:ml-0 lg:gap-5">
            <div className="relative aspect-265/355 overflow-hidden md:translate-y-0">
              <Image
                src="/top1.jpg"
                alt="Niche — original illustration"
                fill
                sizes="(min-width: 1024px) 25vw, 45vw"
                priority
                className="object-cover"
              />
            </div>
            <div className="relative aspect-265/355 translate-y-10 overflow-hidden md:translate-y-0">
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
        </div>
      </section>

      {/* News */}
      <div className="px-5 py-10 md:px-8 lg:px-12">
        <div className="flex items-center gap-6">
          <span className="label-tag shrink-0 text-ink">{t("news")}</span>
          <span className="h-px flex-1 bg-black/40" />
        </div>
      </div>

      <NewsCarousel images={newsImages} label={t("news")} />
    </>
  );
}
