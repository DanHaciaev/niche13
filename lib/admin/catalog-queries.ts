import "server-only";
import type { AdminSession } from "./auth";

export interface PlainCategory {
  id: string;
  slug: string;
  title_ru: string;
}

/** Categories without collections (e.g. Bags), where products live directly.
 * Empty — rather than an error — while the database lacks the categories
 * tables or the has_collections column. */
export async function plainCategories(admin: AdminSession): Promise<PlainCategory[]> {
  const { data, error } = await admin.supabase.from("categories").select("*").order("sort_order").order("created_at");
  if (error) return [];
  return (data as (PlainCategory & { has_collections?: boolean })[])
    .filter((c) => c.has_collections === false)
    .map(({ id, slug, title_ru }) => ({ id, slug, title_ru }));
}
