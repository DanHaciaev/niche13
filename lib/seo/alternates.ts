import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url";


export function localeAlternates(path: string, currentLocale: string) {
  return {
    canonical: `${siteUrl}/${currentLocale}${path}`,
    languages: Object.fromEntries(
      routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
    ),
  };
}
