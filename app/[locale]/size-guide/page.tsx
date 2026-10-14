import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sizeGuide" });
  return { title: t("title") };
}

const SIZES = [
  { size: "S", chest: 46, length: 66, shoulder: 44, sleeve: 20 },
  { size: "M", chest: 50, length: 69, shoulder: 47, sleeve: 21 },
  { size: "L", chest: 54, length: 72, shoulder: 50, sleeve: 22 },
  { size: "XL", chest: 58, length: 75, shoulder: 53, sleeve: 23 },
  { size: "2XL", chest: 62, length: 78, shoulder: 56, sleeve: 24 },
  { size: "3XL", chest: 66, length: 81, shoulder: 59, sleeve: 25 },
];

export default async function SizeGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sizeGuide");

  return (
    <div className="px-5 pb-28 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-20">
      <h1 className="text-3xl font-medium uppercase text-ink md:text-4xl lg:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
        {t("intro")}
      </p>

      <div className="mt-16 overflow-x-auto md:mt-20">
        <table className="w-full min-w-150 border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="label-tag py-4 pr-6 text-[11px]! text-ink md:text-xs! lg:text-sm!">
                {t("size")}
              </th>
              <th className="label-tag py-4 pr-6 text-[11px]! text-ink-faint md:text-xs! lg:text-sm!">
                {t("chest")}
              </th>
              <th className="label-tag py-4 pr-6 text-[11px]! text-ink-faint md:text-xs! lg:text-sm!">
                {t("length")}
              </th>
              <th className="label-tag py-4 pr-6 text-[11px]! text-ink-faint md:text-xs! lg:text-sm!">
                {t("shoulder")}
              </th>
              <th className="label-tag py-4 text-[11px]! text-ink-faint md:text-xs! lg:text-sm!">
                {t("sleeve")}
              </th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map((row) => (
              <tr key={row.size} className="border-b border-line">
                <td className="label-tag py-4 pr-6 text-[11px]! text-ink md:text-xs! lg:text-sm!">
                  {row.size}
                </td>
                <td className="py-4 pr-6 text-sm text-ink-soft">{row.chest}</td>
                <td className="py-4 pr-6 text-sm text-ink-soft">{row.length}</td>
                <td className="py-4 pr-6 text-sm text-ink-soft">{row.shoulder}</td>
                <td className="py-4 text-sm text-ink-soft">{row.sleeve}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-10 text-sm text-ink-faint">{t("note")}</p>
    </div>
  );
}
