import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CustomDesignForm } from "@/components/site/CustomDesignForm";
import { getSiteContent, withBreaks } from "@/lib/data/content";
import { renderBreaks } from "@/lib/rich-text";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { custom } = await getSiteContent(locale);
  return { title: custom.heroTitle };
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("custom");
  const tForm = await getTranslations("custom.form");
  const { custom } = await getSiteContent(locale);

  return (
    <>
      <section className="flex flex-col-reverse items-end gap-3 px-5 pb-28 pt-10 md:px-8 md:flex-row md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-16 lg:px-12 lg:pt-20">
        <div className="flex w-full flex-1 justify-center">
          <div className="text-left md:max-w-170">
              <h1 className="label-tag text-ink text-[14px]! md:text-[20px]! lg:text-[24px]!">
                {custom.heroTitle}
              </h1>
              <p className="mt-2 text-right font-medium text-[13px] md:text-base lg:text-[18px] leading-relaxed text-ink-soft md:mt-2">
                {renderBreaks(withBreaks(custom.heroDescription))}
              </p>
            </div>
        </div>

        {custom.heroImage && (
          <div className="relative aspect-3/4 w-[55%] shrink-0 overflow-hidden md:w-[38%] lg:w-[32%]">
            <Image
              src={custom.heroImage}
              alt={custom.heroTitle}
              fill
              sizes="(min-width: 1024px) 32vw, (min-width: 769px) 38vw, 55vw"
              priority
              className="object-cover"
            />
          </div>
        )}
      </section>

      <div className="flex items-center gap-4 px-5 md:px-8 lg:px-12">
        <span className="label-tag text-ink font-medium! text-[11px]! md:text-[13px]! lg:text-base!">{t("orderRequest")}</span>
        <span className="h-px flex-1 bg-black/40" aria-hidden />
      </div>

      <p className="px-5 py-12 text-right text-[13px]! leading-relaxed text-ink-faint min md:px-8 md:py-20 md:text-right lg:px-12 lg:py-34 ml-auto max-w-250">
        {renderBreaks(withBreaks(custom.requestText))}
      </p>

      <CustomDesignForm t={tForm} heading={custom.formHeading} />
    </>
  );
}
