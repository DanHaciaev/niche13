import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getCategories, getCategory, getCollection, getCollections } from "@/lib/data/catalog";
import { localizedUrl } from "@/lib/seo/metadata";

// Rebuilt at most hourly, so new collections and products show up on their own.
export const revalidate = 3600;

const STATIC_PAGES = ["", "/collections", "/custom", "/about", "/contacts", "/size-guide"];

/** One entry per page, in Russian (the plain address) with the English
 * version listed as its alternate, as search engines expect for hreflang. */
function entry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: localizedUrl(path, routing.defaultLocale),
    changeFrequency: "weekly",
    priority,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, localizedUrl(path, l)])),
    },
  };
}

/** Every collection, category and product page, read from the catalog. */
async function catalogPaths() {
  const locale = routing.defaultLocale;
  const paths: string[] = [];

  for (const { slug } of await getCollections(locale)) {
    paths.push(`/collections/${slug}`);
    const data = await getCollection(slug, locale);
    data?.products.forEach((p) => paths.push(`/collections/${slug}/${p.code}`));
  }
  for (const { slug } of await getCategories(locale)) {
    paths.push(`/category/${slug}`);
    const data = await getCategory(slug, locale);
    data?.products.forEach((p) => paths.push(`/category/${slug}/${p.code}`));
  }
  return paths;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let catalog: string[] = [];
  try {
    catalog = await catalogPaths();
  } catch (error) {
    // Without the database the static pages are still worth listing.
    console.error("[sitemap] catalog unavailable", error);
  }
  return [
    ...STATIC_PAGES.map((path) => entry(path, path === "" ? 1 : 0.8)),
    ...catalog.map((path) => entry(path, path.split("/").length > 3 ? 0.6 : 0.7)),
  ];
}
