import { routing } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function localeAlternates(path: string, currentLocale: string) {
  return {
    canonical: `${siteUrl}/${currentLocale}${path}`,
    languages: Object.fromEntries(
      routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
    ),
  };
}
