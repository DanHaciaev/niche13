import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { montserrat } from "@/lib/fonts";
import { siteUrl } from "@/lib/site-url";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { FooterGate } from "@/components/site/FooterGate";
import { DarkRouteProvider } from "@/components/site/DarkRouteContext";
import { PageViewTracker } from "@/components/site/PageViewTracker";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("defaultTitle"),
      template: `%s — ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${montserrat.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-white text-ink antialiased">
        <NextIntlClientProvider>
          <DarkRouteProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <FooterGate>
              <Footer />
            </FooterGate>
            <PageViewTracker />
          </DarkRouteProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
