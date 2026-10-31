import "server-only";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getSiteContent } from "@/lib/data/content";
import { siteUrl } from "@/lib/site-url";

const OG_LOCALES: Record<string, string> = { ru: "ru_RU", en: "en_US" };
/** Brand collage in /public, used when a page has no photo of its own. */
const DEFAULT_IMAGE = { url: "/og.jpg", width: 1200, height: 630 };
const DESCRIPTION_LENGTH = 160;

/** Absolute address of a page in one language:
 * "/about" → https://…/about (Russian) or https://…/en/about. */
export function localizedUrl(path: string, locale: string) {
  const pathname = getPathname({ href: path || "/", locale });
  return siteUrl + (pathname === "/" ? "" : pathname);
}

/** Site name and description from Admin → Content → "Поиск и превью ссылок".
 * Metadata never takes the page down: without the database it falls back to
 * the brand name and the page itself shows "temporarily unavailable".
 * `brand` is the bare brand name for structured data, where a tagline added
 * to the title would be wrong. */
export async function siteIdentity(locale: string) {
  const t = await getTranslations({ locale, namespace: "meta" });
  const brand = t("siteName");
  try {
    const { seo } = await getSiteContent(locale);
    return { name: seo.title || brand, description: seo.description, brand };
  } catch {
    return { name: brand, description: "", brand };
  }
}

/** Admin text → one line of plain text short enough for a search snippet. */
function snippet(text?: string) {
  const plain = (text ?? "").replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= DESCRIPTION_LENGTH) return plain;
  const cut = plain.slice(0, DESCRIPTION_LENGTH - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

/** Everything a public page tells search engines and link previews:
 * title, description, its address in each language (hreflang), and the
 * Open Graph card with the page's photo or the brand collage. */
export async function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
}: {
  locale: string;
  /** Path without the locale, e.g. "/collections/basic" ("" for home). */
  path: string;
  /** Page name; the site name is appended by the layout's title template. */
  title?: string;
  description?: string;
  image?: string | null;
}): Promise<Metadata> {
  const site = await siteIdentity(locale);
  const url = localizedUrl(path, locale);
  const text = snippet(description) || snippet(site.description) || undefined;
  const fullTitle = title ? `${title} — ${site.name}` : site.name;
  const images = image ? [{ url: image, alt: title ?? site.name }] : [{ ...DEFAULT_IMAGE, alt: site.name }];

  return {
    title: title ?? { absolute: site.name },
    description: text,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, localizedUrl(path, l)])),
        "x-default": localizedUrl(path, routing.defaultLocale),
      },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: OG_LOCALES[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      url,
      title: fullTitle,
      description: text,
      images,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: text, images: images.map((i) => i.url) },
  };
}
