import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteContent } from "@/lib/data/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.contacts" });
  return { title: t("title") };
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.contacts");
  const content = await getSiteContent(locale);

  const rows = [
    {
      label: t("generalEnquiries"),
      content: (
        <a
          href={`mailto:${content.email}`}
          className="text-sm text-ink-faint transition-colors hover:text-ink"
        >
          {content.email}
        </a>
      ),
    },
    {
      label: t("social"),
      content: (
        <a
          href={content.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-faint transition-colors hover:text-ink"
        >
          {t("socialValue")}
        </a>
      ),
    },
    {
      label: t("customOrders"),
      content: (
        <div className="text-sm leading-relaxed text-ink-faint">
          <p>{t("customOrdersLine1")}</p>
          <p>{t("customOrdersLine2")}</p>
          <Link href="/custom" className="text-ink underline-offset-2 transition-colors hover:text-ink-soft hover:underline">
            {t("customOrdersCta")}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="pb-20 pt-10 md:pt-14 lg:pt-20">
      <h1 className="px-5 text-[40px] font-medium uppercase text-ink md:px-8 lg:px-12 lg:text-[48px]">
        {t("title")}
      </h1>
      <p className="label-tag md:ml-10 px-5 text-base! text-black md:px-8 md:text-[20px]! lg:px-12">
        {t("subtitle")}
      </p>

      <div className="mt-16 flex flex-col md:mt-20">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-row justify-between border-t border-black/40 px-5 py-8 md:px-8 md:py-10 lg:px-12"
          >
            <span className="label-tag text-ink text-[15px]! md:text-[16px]! lg:text-[20px]!">{row.label}</span>
            <div className="w-1/2 shrink-0 text-[13px]! md:text-[20px]! lg:text-[24px]!">{row.content}</div>
          </div>
        ))}
        <div className="border-t border-line" aria-hidden />
      </div>
    </div>
  );
}
