import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSiteContent } from "@/lib/data/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sizeGuide" });
  return { title: t("title") };
}

export default async function SizeGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sizeGuide");
  const { sizeTables } = await getSiteContent(locale);

  return (
    <div className="px-5 pb-28 pt-10 md:px-8 md:pt-14 lg:px-12 lg:pt-20">
      <h1 className="text-3xl font-medium uppercase text-ink md:text-4xl lg:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
        {t("intro")}
      </p>

      <div className="mt-16 flex flex-col gap-16 md:mt-20 md:gap-20">
        {sizeTables.map((table, ti) => (
          <section key={ti}>
            {table.title && (
              <h2 className="label-tag mb-2 text-[13px]! font-medium! text-ink md:text-[15px]!">{table.title}</h2>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    {table.columns.map((column, ci) => (
                      <th
                        key={ci}
                        className={`label-tag py-4 pr-6 text-[11px]! last:pr-0 md:text-xs! lg:text-sm! ${ci === 0 ? "text-ink" : "text-ink-faint"}`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-line">
                      {row.map((value, ci) =>
                        ci === 0 ? (
                          <td key={ci} className="label-tag py-4 pr-6 text-[11px]! text-ink md:text-xs! lg:text-sm!">
                            {value}
                          </td>
                        ) : (
                          <td key={ci} className="py-4 pr-6 text-sm text-ink-soft last:pr-0">
                            {value}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-ink-faint">{t("note")}</p>
    </div>
  );
}
