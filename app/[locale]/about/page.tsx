import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { renderBreaks } from "@/lib/rich-text";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return { title: t("title") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.about");

  return (
    <div className="bg-black">
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5">
        <Image
          src="/logo.png"
          alt="Niche"
          width={193}
          height={89}
          priority
          className="h-16 w-auto invert md:h-20"
        />
      </div>

      <div className="px-5 pb-24 pt-16 md:px-8 md:pt-20 lg:px-12 lg:pt-24">
        <div className="flex flex-col justify-center gap-10 lg:flex-row md:items-start md:gap-12 lg:gap-16">
          <div className="relative aspect-345/420 w-full overflow-hidden md:w-[42%] lg:w-[30%]">
            <Image
              src="/about.png"
              alt={t("title")}
              fill
              sizes="(min-width: 1024px) 34vw, (min-width: 640px) 42vw, 100vw"
              className="object-cover grayscale"
            />
          </div>

          <div className="flex flex-col leading-relaxed text-white/80 md:flex-1 text-[18px] lg:max-w-200">
            <p>{renderBreaks(t("text"))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
