import "server-only";
import { unstable_cache } from "next/cache";
import { publicClient } from "@/lib/supabase/public";
import { ContentUnavailableError } from "./content";

/* The catalog — categories, collections, products — comes only from the
   database. Nothing is hardcoded: if the database can't be reached, loading
   throws and the page shows "temporarily unavailable". */

export type CollectionKind = "catalog" | "one_of_one" | "illustrations";
export type CollectionLayout = "left" | "right" | "feature";
export type Gender = "male" | "female";

export interface Collection {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  /** Heading at the top of the collection page (falls back to the title). */
  pageTitle: string;
  /** Text above the order form; empty → the site-wide default. */
  requestText: string;
  /** Big heading of the order form; empty → the site-wide default. */
  formHeading: string;
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
  page_title_ru?: string;
  page_title_en?: string;
  request_text_ru?: string;
  request_text_en?: string;
  form_heading_ru?: string;
  form_heading_en?: string;
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
  has_collections?: boolean;
}

interface CatalogRows {
  collections: CollectionRow[];
  products: ProductRow[];
  categories: CategoryRow[];
  links: { collection_id: string; category_id: string }[];
}

const loadCatalogRows = unstable_cache(
  async (): Promise<CatalogRows> => {
    const supabase = publicClient();
    if (!supabase) throw new ContentUnavailableError("Supabase is not configured");

    // "*" rather than column lists: a column added by a newer schema.sql
    // that hasn't been run yet must not take the whole catalog down.
    const [collections, products, categories, links] = await Promise.all([
      supabase.from("collections").select("*").eq("is_active", true).order("sort_order").order("created_at"),
      supabase
        .from("products")
        .select("*")
        .eq("is_hidden", false)
        .not("code", "is", null)
        .order("sort_order")
        .order("code"),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("created_at"),
      supabase.from("collection_categories").select("collection_id, category_id"),
    ]);

    // Thrown, not cached: the next request tries the database again.
    const error = collections.error ?? products.error ?? categories.error ?? links.error;
    if (error) throw new ContentUnavailableError(error);

    return {
      collections: collections.data as CollectionRow[],
      products: products.data as ProductRow[],
      categories: categories.data as CategoryRow[],
      links: links.data as CatalogRows["links"],
    };
  },
  ["catalog-rows"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

const toNumber = (value: number | string | null) => (value === null || value === "" ? null : Number(value));

const toStrings = (value: unknown) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

function pick(locale: string, ru = "", en = "") {
  return (locale === "en" ? en : ru) || ru || en;
}

function mapCollection(row: CollectionRow, locale: string): Collection {
  const title = pick(locale, row.title_ru, row.title_en);
  return {
    slug: row.slug,
    title,
    eyebrow: pick(locale, row.eyebrow_ru, row.eyebrow_en),
    description: pick(locale, row.description_ru, row.description_en),
    pageTitle: pick(locale, row.page_title_ru, row.page_title_en) || title,
    requestText: pick(locale, row.request_text_ru, row.request_text_en),
    formHeading: pick(locale, row.form_heading_ru, row.form_heading_en),
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
  const sizes = toStrings(row.sizes);
  const stock = readStock(row, sizes);
  return {
    code: row.code,
    title: pick(locale, row.title_ru, row.title_en),
    description: pick(locale, row.description_ru, row.description_en),
    gender: row.gender,
    price: toNumber(row.price),
    discountPrice: toNumber(row.discount_price),
    currency: row.currency,
    images: toStrings(row.images),
    sizes,
    colors: toStrings(row.colors),
    // Sold out by hand, or automatically once every tracked size hits zero.
    soldOut: row.is_sold_out || (stock !== null && Object.values(stock).every((n) => n === 0)),
    stock,
  };
}

function mapCategory(row: CategoryRow, locale: string): Category {
  return {
    slug: row.slug,
    title: pick(locale, row.title_ru, row.title_en),
    image: row.image,
    hasCollections: row.has_collections !== false,
  };
}

// ---------------------------------------------------------------------------
// Public API used by pages
// ---------------------------------------------------------------------------

export async function getCollections(locale: string): Promise<Collection[]> {
  const rows = await loadCatalogRows();
  return rows.collections.map((row) => mapCollection(row, locale));
}

export async function getCollection(
  slug: string,
  locale: string,
): Promise<{ collection: Collection; products: Product[] } | null> {
  const rows = await loadCatalogRows();
  const row = rows.collections.find((c) => c.slug === slug);
  if (!row) return null;
  return {
    collection: mapCollection(row, locale),
    products: rows.products.filter((p) => p.collection_id === row.id).map((p) => mapProduct(p, locale)),
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

/** Categories for the /collections page. When there are none, the page
 * lists collections directly instead. */
export async function getCategories(locale: string): Promise<Category[]> {
  const rows = await loadCatalogRows();
  return rows.categories.map((c) => mapCategory(c, locale));
}

/** One category: its linked collections (in collection order) or, for a
 * plain catalog, the products that belong to it directly. */
export async function getCategory(
  slug: string,
  locale: string,
): Promise<{ category: Category; collections: Collection[]; products: Product[] } | null> {
  const rows = await loadCatalogRows();
  const row = rows.categories.find((c) => c.slug === slug);
  if (!row) return null;
  const category = mapCategory(row, locale);

  if (!category.hasCollections) {
    return {
      category,
      collections: [],
      products: rows.products.filter((p) => p.category_id === row.id).map((p) => mapProduct(p, locale)),
    };
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
