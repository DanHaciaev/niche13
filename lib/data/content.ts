import "server-only";
import { unstable_cache } from "next/cache";
import { publicClient } from "@/lib/supabase/public";
import { legacySizeTables, type SizeTable } from "@/lib/size-tables";

/** Shape of the `content` row in the settings table. Every field is optional:
 * an empty value means "use the site's built-in text". */
export interface StoredContent {
  aboutRu?: string;
  aboutEn?: string;
  email?: string;
  instagramUrl?: string;
  sizeTables?: SizeTable[];
  /** @deprecated fixed-column format from the first version; read-only. */
  sizeRows?: { size: string; chest: string; length: string; shoulder: string; sleeve: string }[];
}

export interface LocalizedSizeTable {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface SiteContent {
  /** Null when the admin hasn't written one — callers fall back to messages. */
  aboutText: string | null;
  email: string;
  instagramUrl: string;
  sizeTables: LocalizedSizeTable[];
}

export const CONTENT_TAG = "content";

export const DEFAULT_EMAIL = "hello@niche.com";
export const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
export const DEFAULT_INSTAGRAM = "https://instagram.com";

const loadStoredContent = unstable_cache(
  async (): Promise<StoredContent> => {
    const supabase = publicClient();
    if (!supabase) return {};
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "content")
      .maybeSingle();
    if (error) {
      console.error("[content] Supabase error", error);
      return {};
    }
    return (data?.value as StoredContent | null) ?? {};
  },
  ["site-content"],
  { tags: [CONTENT_TAG], revalidate: 3600 },
);

/** Size tables in both languages, upgrading the old fixed-column format. */
export function resolveSizeTables(stored: StoredContent): SizeTable[] {
  return stored.sizeTables?.length ? stored.sizeTables : legacySizeTables(stored.sizeRows);
}

export async function getSiteContent(locale: string): Promise<SiteContent> {
  const stored = await loadStoredContent();
  const about = (locale === "en" ? stored.aboutEn : stored.aboutRu)?.trim();
  const pick = (v: { ru: string; en: string }) => (locale === "en" ? v.en : v.ru) || v.ru || v.en;

  // Re-checked on read as well as on save: these end up in href attributes,
  // where a "javascript:" value would run script on click.
  const email = stored.email?.trim();
  const instagram = stored.instagramUrl?.trim();

  return {
    // The admin writes plain lines; the site's renderer breaks on <br/>.
    aboutText: about ? about.replace(/(\r?\n)+/g, "<br/>") : null,
    email: email && EMAIL_PATTERN.test(email) ? email : DEFAULT_EMAIL,
    instagramUrl: instagram && instagram.startsWith("https://") ? instagram : DEFAULT_INSTAGRAM,
    sizeTables: resolveSizeTables(stored).map((t) => ({
      title: pick(t.title),
      columns: t.columns.map(pick),
      rows: t.rows,
    })),
  };
}
