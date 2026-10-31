import "server-only";
import { unstable_cache } from "next/cache";
import { publicClient } from "@/lib/supabase/public";
import type { SizeTable } from "@/lib/size-tables";

/* All site content lives in the database (settings row "content"), edited in
   Admin → Content. Nothing is hardcoded: if the database can't be reached,
   loading content throws and the page shows "temporarily unavailable". */

export interface Bilingual {
  ru: string;
  en: string;
}

/** Shape of the `content` row in the settings table. */
export interface StoredContent {
  aboutRu?: string;
  aboutEn?: string;
  aboutImage?: string;
  email?: string;
  instagramUrl?: string;
  sizeTables?: SizeTable[];
  sizeIntro?: Bilingual;
  sizeNote?: Bilingual;
  home?: { heroLeft?: string; heroRight?: string; news?: string[] };
  /** Photo for the empty tiles that complete the /collections grid. */
  categoryPlaceholder?: string;
  footer?: { image?: string; heading?: Bilingual; text?: Bilingual };
  contacts?: { title?: Bilingual; subtitle?: Bilingual; customText?: Bilingual };
  custom?: {
    heroTitle?: Bilingual;
    heroDescription?: Bilingual;
    requestText?: Bilingual;
    formHeading?: Bilingual;
    heroImage?: string;
    tileTitle?: Bilingual;
    tileImage?: string;
  };
  /** Used by catalog pages whose collection (or category) leaves them empty. */
  catalogDefaults?: { description?: Bilingual; requestText?: Bilingual; formHeading?: Bilingual };
  productDefaults?: { title?: Bilingual; description?: Bilingual };
}

export interface LocalizedSizeTable {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface SiteContent {
  aboutText: string;
  aboutImage: string | null;
  email: string;
  instagramUrl: string;
  sizeTables: LocalizedSizeTable[];
  sizeIntro: string;
  sizeNote: string;
  home: { heroLeft: string | null; heroRight: string | null; news: string[] };
  categoryPlaceholder: string | null;
  footer: { image: string | null; heading: string; text: string };
  contacts: { title: string; subtitle: string; customText: string };
  custom: {
    heroTitle: string;
    heroDescription: string;
    requestText: string;
    formHeading: string;
    heroImage: string | null;
    tileTitle: string;
    tileImage: string | null;
  };
  catalogDefaults: { description: string; requestText: string; formHeading: string };
  productDefaults: { title: string; description: string };
}

export const CONTENT_TAG = "content";
export const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export class ContentUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Site content is unavailable", { cause });
    this.name = "ContentUnavailableError";
  }
}

const loadStoredContent = unstable_cache(
  async (): Promise<StoredContent> => {
    const supabase = publicClient();
    if (!supabase) throw new ContentUnavailableError("Supabase is not configured");
    const { data, error } = await supabase.from("settings").select("value").eq("key", "content").maybeSingle();
    // Thrown, not cached: the next request tries the database again.
    if (error) throw new ContentUnavailableError(error);
    return (data?.value as StoredContent | null) ?? {};
  },
  ["site-content"],
  { tags: [CONTENT_TAG], revalidate: 3600 },
);

export async function getSiteContent(locale: string): Promise<SiteContent> {
  const s = await loadStoredContent();
  const tr = (v?: Bilingual) => (v ? (locale === "en" ? v.en : v.ru) || v.ru || v.en || "" : "");
  const img = (v?: string) => v?.trim() || null;

  // Re-checked on read as well as on save: these end up in href attributes,
  // where a "javascript:" value would run script on click.
  const email = s.email?.trim() ?? "";
  const instagram = s.instagramUrl?.trim() ?? "";
  const about = (locale === "en" ? s.aboutEn : s.aboutRu)?.trim() || s.aboutRu?.trim() || "";

  return {
    // The admin writes plain lines; the site's renderer breaks on <br/>.
    aboutText: about.replace(/(\r?\n)+/g, "<br/>"),
    aboutImage: img(s.aboutImage),
    email: EMAIL_PATTERN.test(email) ? email : "",
    instagramUrl: instagram.startsWith("https://") ? instagram : "",
    sizeTables: (s.sizeTables ?? []).map((t) => ({
      title: tr(t.title),
      columns: t.columns.map(tr),
      rows: t.rows,
    })),
    sizeIntro: tr(s.sizeIntro),
    sizeNote: tr(s.sizeNote),
    home: {
      heroLeft: img(s.home?.heroLeft),
      heroRight: img(s.home?.heroRight),
      news: (s.home?.news ?? []).map((u) => u.trim()).filter(Boolean),
    },
    categoryPlaceholder: img(s.categoryPlaceholder),
    footer: { image: img(s.footer?.image), heading: tr(s.footer?.heading), text: tr(s.footer?.text) },
    contacts: {
      title: tr(s.contacts?.title),
      subtitle: tr(s.contacts?.subtitle),
      customText: tr(s.contacts?.customText),
    },
    custom: {
      heroTitle: tr(s.custom?.heroTitle),
      heroDescription: tr(s.custom?.heroDescription),
      requestText: tr(s.custom?.requestText),
      formHeading: tr(s.custom?.formHeading),
      heroImage: img(s.custom?.heroImage),
      tileTitle: tr(s.custom?.tileTitle),
      tileImage: img(s.custom?.tileImage),
    },
    catalogDefaults: {
      description: tr(s.catalogDefaults?.description),
      requestText: tr(s.catalogDefaults?.requestText),
      formHeading: tr(s.catalogDefaults?.formHeading),
    },
    productDefaults: { title: tr(s.productDefaults?.title), description: tr(s.productDefaults?.description) },
  };
}

/** Multi-line admin text → React-friendly `<br/>` markers (see renderBreaks). */
export function withBreaks(text: string) {
  return text.replace(/(\r?\n)+/g, "<br/>");
}
