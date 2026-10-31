import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { NewsCarousel } from "@/components/site/NewsCarousel";
import { getSiteContent } from "@/lib/data/content";
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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const { home } = await getSiteContent(locale);
  // Photos come from Admin → Content; an empty slot simply isn't shown.
  const heroPhotos = [
    { src: home.heroLeft, alt: "Niche", desktopOnly: true },
    { src: home.heroRight, alt: "Niche", desktopOnly: false },
  ].filter((p): p is { src: string; alt: string; desktopOnly: boolean } => Boolean(p.src));

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

      {/* Hero, sized in vw so every screen keeps the design's proportions:
          - below md: only the right photo, 352×398 on a 375px screen (93.9%);
          - from md: both photos, 590×688 each and 27px apart on a 1280px
            screen (together 94.3% of the width), growing no further past 1440px. */}
      <section className="py-33 md:pt-10 md:pb-15 lg:pt-4 lg:pb-18">
        <div className="mx-auto grid w-[93.87vw] grid-cols-1 md:w-[94.3vw] md:max-w-[1358px] md:grid-cols-2 md:gap-[min(2.11vw,30px)]">
          {heroPhotos.map((photo) => (
            <div
              key={photo.desktopOnly ? "left" : "right"}
              className={`relative aspect-352/398 overflow-hidden md:aspect-590/688 ${photo.desktopOnly ? "hidden md:block" : ""}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={photo.desktopOnly ? "(min-width: 1440px) 664px, 47vw" : "(min-width: 1440px) 664px, (min-width: 768px) 47vw, 94vw"}
                // The left photo is hidden on phones: as a normal lazy image it's
                // skipped there, yet still loads at once on desktop (it's on screen).
                priority={!photo.desktopOnly}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* News */}
      <div className="px-5 md:px-8 lg:px-12">
        <div className="flex items-center gap-6">
          {/* Same type as the header links. */}
          <span className="shrink-0 text-[11px] font-medium uppercase leading-none text-ink">{t("news")}</span>
          <span className="h-px flex-1 bg-black/40" />
        </div>
      </div>

      {home.news.length > 0 && <NewsCarousel images={home.news} label={t("news")} />}
    </>
  );
}
