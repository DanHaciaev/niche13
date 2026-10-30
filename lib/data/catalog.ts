import "server-only";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { publicClient } from "@/lib/supabase/public";

export type CollectionKind = "catalog" | "one_of_one" | "illustrations";
export type CollectionLayout = "left" | "right" | "feature";
export type Gender = "male" | "female";

export interface Collection {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  coverImage: string | null;
  heroImage: string | null;
  kind: CollectionKind;
  layout: CollectionLayout;
}

export interface Category {
  slug: string;
  title: string;
  image: string | null;
  /** False for a plain catalog (e.g. Bags): its page lists products directly. */
  hasCollections: boolean;
}

export interface Product {
  code: string;
  title: string;
  description: string;
  gender: Gender | null;
  price: number | null;
  discountPrice: number | null;
  currency: string;
  images: string[];
  sizes: string[];
  colors: string[];
  soldOut: boolean;
  /** Pieces left per size, or null when stock isn't tracked for this product. */
  stock: Record<string, number> | null;
}

export const CATALOG_TAG = "catalog";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
const DEFAULT_COLORS = ["#17150f", "#ffffff", "#f5c518"];

// ---------------------------------------------------------------------------
// Raw rows from Supabase (both languages), cached until an admin edits them.
// ---------------------------------------------------------------------------

interface CollectionRow {
  id: string;
  slug: string;
  title_ru: string;
  title_en: string;
  eyebrow_ru: string;
  eyebrow_en: string;
  description_ru: string;
  description_en: string;
  cover_image: string | null;
  hero_image: string | null;
  kind: CollectionKind;
  layout: CollectionLayout;
}

interface ProductRow {
  collection_id: string | null;
  category_id?: string | null;
  code: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  gender: Gender | null;
  price: number | string | null;
  discount_price: number | string | null;
  currency: string;
  images: unknown;
  sizes: unknown;
  colors: unknown;
  is_sold_out: boolean;
  track_stock: boolean | null;
  stock_by_size: unknown;
}

interface CategoryRow {
  id: string;
  slug: string;
  title_ru: string;
  title_en: string;
  image: string | null;
  /** Missing until schema.sql adds it; treated as true. */
  has_collections?: boolean;
}

interface CatalogRows {
  collections: CollectionRow[];
  products: ProductRow[];
  categories: CategoryRow[];
  links: { collection_id: string; category_id: string }[];
}

const loadCatalogRows = unstable_cache(
  async (): Promise<CatalogRows | null> => {
    const supabase = publicClient();
    if (!supabase) return null;

    const [collections, products, categories, links] = await Promise.all([
      supabase
        .from("collections")
        .select(
          "id, slug, title_ru, title_en, eyebrow_ru, eyebrow_en, description_ru, description_en, cover_image, hero_image, kind, layout",
        )
        .eq("is_active", true)
        .order("sort_order")
        .order("created_at"),
      // "*" rather than a column list: a column added by a newer schema.sql
      // that hasn't been run yet must not take the whole catalog down.
      supabase
        .from("products")
        .select("*")
        .eq("is_hidden", false)
        .not("code", "is", null)
        .order("sort_order")
        .order("code"),
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .order("created_at"),
      supabase.from("collection_categories").select("collection_id, category_id"),
    ]);

    // On a database error fall back to the built-in catalog rather than
    // showing an empty shop. The error is logged for the developer.
    if (collections.error || products.error) {
      console.error("[catalog] Supabase error", collections.error ?? products.error);
      return null;
    }

    // Categories are optional: if their tables aren't there yet (schema.sql
    // not re-run), the shop still works and /collections lists collections.
    if (categories.error || links.error) {
      console.error("[catalog] categories unavailable", categories.error ?? links.error);
    }

    return {
      collections: collections.data as CollectionRow[],
      products: products.data as ProductRow[],
      categories: categories.error ? [] : (categories.data as CategoryRow[]),
      links: links.error ? [] : (links.data as CatalogRows["links"]),
    };
  },
  ["catalog-rows"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

const toNumber = (value: number | string | null) =>
  value === null || value === "" ? null : Number(value);

const toStrings = (value: unknown, fallback: string[]) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : fallback;

function pick(locale: string, ru: string, en: string) {
  return (locale === "en" ? en : ru) || ru || en;
}

function mapCollection(row: CollectionRow, locale: string): Collection {
  return {
    slug: row.slug,
    title: pick(locale, row.title_ru, row.title_en),
    eyebrow: pick(locale, row.eyebrow_ru, row.eyebrow_en),
    description: pick(locale, row.description_ru, row.description_en),
    coverImage: row.cover_image,
    heroImage: row.hero_image,
    kind: row.kind,
    layout: row.layout,
  };
}

function readStock(row: ProductRow, sizes: string[]): Record<string, number> | null {
  if (!row.track_stock) return null;
  const raw = (row.stock_by_size ?? {}) as Record<string, unknown>;
  return Object.fromEntries(sizes.map((size) => [size, Math.max(0, Math.floor(Number(raw[size]) || 0))]));
}

function mapProduct(row: ProductRow, locale: string): Product {
  const sizes = toStrings(row.sizes, DEFAULT_SIZES);
  const stock = readStock(row, sizes);
  return {
    code: row.code,
    title: pick(locale, row.title_ru, row.title_en),
    description: pick(locale, row.description_ru, row.description_en),
    gender: row.gender,
    price: toNumber(row.price),
    discountPrice: toNumber(row.discount_price),
    currency: row.currency,
    images: toStrings(row.images, []),
    sizes,
    colors: toStrings(row.colors, DEFAULT_COLORS),
    // Sold out by hand, or automatically once every tracked size hits zero.
    soldOut: row.is_sold_out || (stock !== null && Object.values(stock).every((n) => n === 0)),
    stock,
  };
}

// ---------------------------------------------------------------------------
// Built-in catalog: what the site showed before it had a database. Used
// until Supabase is connected, so the design never shows an empty state.
// ---------------------------------------------------------------------------

async function fallbackCollections(locale: string): Promise<Collection[]> {
  const t = await getTranslations({ locale, namespace: "collections" });
  const eyebrow = t("eyebrow");
  const base = { description: "", kind: "catalog" as const, heroImage: "/collection1.png" };

  return [
    { ...base, slug: "ru", eyebrow, title: "RU", layout: "right", coverImage: "/collection1.png" },
    { ...base, slug: "en", eyebrow, title: "EN", layout: "left", coverImage: "/collection2.png" },
    { ...base, slug: "ro", eyebrow, title: "RO", layout: "right", coverImage: "/collection3.png" },
    { ...base, slug: "niche-feelings", eyebrow: "", title: t("feelings"), layout: "feature", coverImage: "/collection4.png" },
    { ...base, slug: "with-name", eyebrow, title: "///", layout: "left", coverImage: "/collection5.png" },
    { ...base, slug: "without-name", eyebrow, title: "///", layout: "right", coverImage: "/collection6.jpg" },
    { ...base, slug: "one-of-one", eyebrow: "", title: t("oneOfOne"), kind: "one_of_one", layout: "feature", coverImage: "/collection7.png", heroImage: "/collection7.png" },
    { ...base, slug: "illustrations", eyebrow, title: t("illustrations"), kind: "illustrations", layout: "left", coverImage: "/collection8.jpg", heroImage: "/collection8.jpg" },
  ];
}

async function fallbackProducts(collection: Collection, locale: string): Promise<Product[]> {
  const t = await getTranslations({ locale, namespace: "collections.detail" });
  const [price, currency = ""] = t("price").split(" ");
  const [discount] = t("discountPrice").split(" ");
  const image = collection.kind === "illustrations" ? "/collection9.jpg" : "/clothes.jpg";

  return Array.from({ length: 8 }, (_, i) => ({
    code: String(i + 1).padStart(3, "0"),
    title: "",
    description: "",
    gender: collection.kind === "catalog" || collection.kind === "one_of_one" ? (i % 2 === 0 ? "male" : "female") : null,
    price: Number(price),
    discountPrice: i === 3 ? Number(discount) : null,
    currency,
    images: [image],
    sizes: DEFAULT_SIZES,
    colors: DEFAULT_COLORS,
    soldOut: i === 2,
    stock: null,
  }));
}

// ---------------------------------------------------------------------------
// Public API used by pages
// ---------------------------------------------------------------------------

export async function getCollections(locale: string): Promise<Collection[]> {
  const rows = await loadCatalogRows();
  if (!rows) return fallbackCollections(locale);
  return rows.collections.map((row) => mapCollection(row, locale));
}

export async function getCollection(
  slug: string,
  locale: string,
): Promise<{ collection: Collection; products: Product[] } | null> {
  const rows = await loadCatalogRows();

  if (!rows) {
    const collection = (await fallbackCollections(locale)).find((c) => c.slug === slug);
    if (!collection) return null;
    return { collection, products: await fallbackProducts(collection, locale) };
  }

  const row = rows.collections.find((c) => c.slug === slug);
  if (!row) return null;
  const collection = mapCollection(row, locale);

  // Fresh database, no products yet: keep showing the demo catalog so the
  // shop never looks empty. The first real product switches this off.
  if (rows.products.length === 0) {
    return { collection, products: await fallbackProducts(collection, locale) };
  }

  return {
    collection,
    products: rows.products
      .filter((p) => p.collection_id === row.id)
      .map((p) => mapProduct(p, locale)),
  };
}

export async function getProduct(slug: string, code: string, locale: string) {
  const data = await getCollection(slug, locale);
  if (!data) return null;
  const product = data.products.find((p) => p.code === code);
  if (!product) return null;
  return { collection: data.collection, product };
}

export function formatPrice(value: number | null, currency: string) {
  if (value === null) return "";
  const amount = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return currency ? `${amount} ${currency}` : amount;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

async function fallbackCategories(locale: string): Promise<Category[]> {
  const t = await getTranslations({ locale, namespace: "collections.categories" });
  return [
    { slug: "t-shirts", title: t("tShirts"), image: "/middle_4.jpg", hasCollections: true },
    { slug: "hoodies", title: t("hoodies"), image: "/middle_2.jpg", hasCollections: true },
    { slug: "bags", title: t("bags"), image: "/collection2.png", hasCollections: false },
  ];
}

function mapCategory(row: CategoryRow, locale: string): Category {
  return {
    slug: row.slug,
    title: pick(locale, row.title_ru, row.title_en),
    image: row.image,
    hasCollections: row.has_collections !== false,
  };
}

/** Demo products for a plain-catalog category, shown until real ones exist. */
function fallbackCategoryProducts(category: Category, locale: string) {
  return fallbackProducts(
    { slug: category.slug, title: category.title, eyebrow: "", description: "", coverImage: null, heroImage: null, kind: "catalog", layout: "left" },
    locale,
  );
}

/** Categories for the /collections page. Empty when the database has none
 * yet — the page then lists collections directly, as before categories. */
export async function getCategories(locale: string): Promise<Category[]> {
  const rows = await loadCatalogRows();
  if (!rows) return fallbackCategories(locale);
  return rows.categories.map((c) => mapCategory(c, locale));
}

/** One category: its linked collections (in collection order) or, for a
 * plain catalog, the products that belong to it directly. */
export async function getCategory(
  slug: string,
  locale: string,
): Promise<{ category: Category; collections: Collection[]; products: Product[] } | null> {
  const rows = await loadCatalogRows();

  if (!rows) {
    const category = (await fallbackCategories(locale)).find((c) => c.slug === slug);
    if (!category) return null;
    return category.hasCollections
      ? { category, collections: await fallbackCollections(locale), products: [] }
      : { category, collections: [], products: await fallbackCategoryProducts(category, locale) };
  }

  const row = rows.categories.find((c) => c.slug === slug);
  if (!row) return null;
  const category = mapCategory(row, locale);

  if (!category.hasCollections) {
    // Same rule as collections: an empty database keeps the demo catalog.
    const products =
      rows.products.length === 0
        ? await fallbackCategoryProducts(category, locale)
        : rows.products.filter((p) => p.category_id === row.id).map((p) => mapProduct(p, locale));
    return { category, collections: [], products };
  }

  const linked = new Set(rows.links.filter((l) => l.category_id === row.id).map((l) => l.collection_id));
  return {
    category,
    collections: rows.collections.filter((c) => linked.has(c.id)).map((c) => mapCollection(c, locale)),
    products: [],
  };
}

export async function getCategoryProduct(slug: string, code: string, locale: string) {
  const data = await getCategory(slug, locale);
  if (!data || data.category.hasCollections) return null;
  const product = data.products.find((p) => p.code === code);
  return product ? { category: data.category, product } : null;
}
