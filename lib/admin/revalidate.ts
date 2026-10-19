import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { CONTENT_TAG } from "@/lib/data/content";

/** Make admin edits visible on the public site immediately, and refresh the
 * admin pages so forms re-render from the saved data. */
export function refreshSite(tag: typeof CATALOG_TAG | typeof CONTENT_TAG) {
  revalidateTag(tag, { expire: 0 });
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin", "layout");
}
