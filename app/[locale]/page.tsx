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

      {/* Hero: two 499×688 photos, 27px apart, centred. Below the design
          width they scale down together and keep their proportions. */}
      <section className="px-5 pb-24 pt-6 md:px-8 md:pb-18">
        <div className="mx-auto grid max-w-[1025px] grid-cols-2 gap-3 md:gap-[27px]">
          {[
            { src: "/top1.jpg", alt: "Niche — original illustration" },
            { src: "/top2.jpg", alt: "Niche — lookbook" },
          ].map((photo) => (
            <div key={photo.src} className="relative aspect-499/688 overflow-hidden">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1089px) 499px, 48vw"
                priority
                className="object-cover"
              />
            </div>
          ))}
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
