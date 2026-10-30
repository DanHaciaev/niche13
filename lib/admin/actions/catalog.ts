"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { newFiles, readImageList, removeImages, uploadImages } from "@/lib/admin/images";
import { refreshSite } from "@/lib/admin/revalidate";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { done, failed, type ActionState } from "@/lib/admin/types";

const uuid = z.uuid();
const text = (max: number) => z.string().trim().max(max);
const str = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const checked = (formData: FormData, key: string) => formData.get(key) === "on";

const SIZE_PATTERN = /^[A-Za-z0-9]{1,6}$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Postgres unique-violation code → friendly message. */
function dbError(error: { code?: string; message?: string }, duplicate: string) {
  console.error("[admin] db error", error);
  if (error.code === "23505") return failed(duplicate);
  if (error.code === "42501") return failed("Нет прав. Проверьте, что вы добавлены в таблицу admins.");
  return failed("Не удалось сохранить. Попробуйте ещё раз.");
}

// ---------------------------------------------------------------------------
// Collection ↔ category links
// ---------------------------------------------------------------------------

/** Replaces the links of one collection (or one category) with the ticked
 * checkboxes. Forms render a "links" marker field next to the checkboxes, so
 * a form without them never wipes existing links by accident. */
async function saveLinks(
  admin: Awaited<ReturnType<typeof requireAdmin>>,
  formData: FormData,
  side: "collection_id" | "category_id",
  id: string,
) {
  if (formData.get("links") !== "1") return null;
  const other = side === "collection_id" ? "category_id" : "collection_id";
  const ids = [...new Set(formData.getAll("link_ids").map(String))].filter((v) => uuid.safeParse(v).success);

  const { error: deleteError } = await admin.supabase.from("collection_categories").delete().eq(side, id);
  if (deleteError) return deleteError;
  if (ids.length === 0) return null;
  const { error } = await admin.supabase
    .from("collection_categories")
    .insert(ids.map((otherId) => ({ [side]: id, [other]: otherId })));
  return error;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Адрес: латиница, цифры и дефисы, например t-shirts")
    .max(60),
  title_ru: text(80).min(1, "Укажите название"),
  title_en: text(80),
  sort_order: z.coerce.number().int().min(-9999).max(9999),
});

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (id && !uuid.safeParse(id).success) return failed("Неверный идентификатор");

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failed(parsed.error.issues[0]?.message ?? "Проверьте поля");

  let image = readImageList(formData, "image")[0] ?? null;
  const upload = newFiles(formData, "image_file").slice(0, 1);
  if (upload.length) {
    const result = await uploadImages(admin, upload, `categories/${parsed.data.slug}`);
    if ("error" in result) return failed(result.error);
    image = result.urls[0];
  }

  const row = {
    ...parsed.data,
    title_en: parsed.data.title_en || parsed.data.title_ru,
    image,
    is_active: checked(formData, "is_active"),
  };
  const query = id
    ? admin.supabase.from("categories").update(row).eq("id", id).select("id").single()
    : admin.supabase.from("categories").insert(row).select("id").single();
  const { data, error } = await query;
  if (error || !data) return dbError(error ?? {}, "Категория с таким адресом уже есть");

  const linkError = await saveLinks(admin, formData, "category_id", data.id);
  if (linkError) return dbError(linkError, "");

  refreshSite(CATALOG_TAG);
  if (!id) redirect(`/admin/categories/${data.id}?created=1`);
  return done("Категория сохранена");
}

export async function deleteCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (!uuid.safeParse(id).success) return failed("Неверный идентификатор");

  const { data: existing } = await admin.supabase.from("categories").select("image").eq("id", id).single();
  // Links go with it (on delete cascade); the collections themselves stay.
  const { error } = await admin.supabase.from("categories").delete().eq("id", id);
  if (error) return dbError(error, "");

  if (existing?.image) await removeImages(admin, [existing.image]);
  refreshSite(CATALOG_TAG);
  redirect("/admin/categories");
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const collectionSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Адрес: латиница, цифры и дефисы, например autumn-2026")
    .max(60),
  title_ru: text(120).min(1, "Укажите название"),
  title_en: text(120),
  eyebrow_ru: text(60),
  eyebrow_en: text(60),
  description_ru: text(3000),
  description_en: text(3000),
  kind: z.enum(["catalog", "one_of_one", "illustrations"]),
  layout: z.enum(["left", "right", "feature"]),
  sort_order: z.coerce.number().int().min(-9999).max(9999),
});

export async function saveCollection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (id && !uuid.safeParse(id).success) return failed("Неверный идентификатор");

  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failed(parsed.error.issues[0]?.message ?? "Проверьте поля");

  const folder = `collections/${parsed.data.slug}`;
  const images: Record<"cover_image" | "hero_image", string | null> = { cover_image: null, hero_image: null };
  for (const key of ["cover_image", "hero_image"] as const) {
    const upload = newFiles(formData, `${key}_file`).slice(0, 1);
    if (upload.length) {
      const result = await uploadImages(admin, upload, folder);
      if ("error" in result) return failed(result.error);
      images[key] = result.urls[0];
    } else {
      images[key] = readImageList(formData, key)[0] ?? null;
    }
  }

  const row = {
    ...parsed.data,
    title_en: parsed.data.title_en || parsed.data.title_ru,
    ...images,
    is_active: checked(formData, "is_active"),
  };

  const query = id
    ? admin.supabase.from("collections").update(row).eq("id", id).select("id").single()
    : admin.supabase.from("collections").insert(row).select("id").single();
  const { data, error } = await query;
  if (error || !data) return dbError(error ?? {}, "Коллекция с таким адресом уже есть");

  const linkError = await saveLinks(admin, formData, "collection_id", data.id);
  if (linkError) return dbError(linkError, "");

  refreshSite(CATALOG_TAG);
  if (!id) redirect(`/admin/collections/${data.id}?created=1`);
  return done("Коллекция сохранена");
}

export async function deleteCollection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (!uuid.safeParse(id).success) return failed("Неверный идентификатор");

  const { count } = await admin.supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", id);
  if (count) return failed(`Сначала удалите или перенесите товары (${count})`);

  const { data: existing } = await admin.supabase
    .from("collections")
    .select("cover_image, hero_image")
    .eq("id", id)
    .single();
  const { error } = await admin.supabase.from("collections").delete().eq("id", id);
  if (error) return dbError(error, "");

  await removeImages(admin, [existing?.cover_image, existing?.hero_image].filter(Boolean) as string[]);
  refreshSite(CATALOG_TAG);
  redirect("/admin/collections");
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const money = z
  .string()
  .trim()
  .transform((v) => v.replace(",", "."))
  .refine((v) => v === "" || /^\d{1,8}(\.\d{1,2})?$/.test(v), "Цена: только число, например 400 или 399.90")
  .transform((v) => (v === "" ? null : Number(v)));

const productSchema = z
  .object({
    collection_id: uuid,
    code: z.string().trim().regex(/^[A-Za-z0-9-]{1,20}$/, "Код: латиница, цифры и дефис, например 001"),
    title_ru: text(160),
    title_en: text(160),
    description_ru: text(4000),
    description_en: text(4000),
    gender: z.enum(["", "male", "female"]).transform((v) => v || null),
    price: money,
    discount_price: money,
    currency: text(8).regex(/^[A-Za-z₽$€£]{0,8}$/, "Валюта: например MDL"),
    sort_order: z.coerce.number().int().min(-9999).max(9999),
  })
  .refine((v) => v.discount_price === null || (v.price !== null && v.discount_price < v.price), {
    message: "Цена со скидкой должна быть меньше обычной",
  });

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (id && !uuid.safeParse(id).success) return failed("Неверный идентификатор");

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failed(parsed.error.issues[0]?.message ?? "Проверьте поля");

  const sizes = formData.getAll("sizes").map(String).filter((s) => SIZE_PATTERN.test(s));
  const colors = [...new Set(formData.getAll("colors").map(String).filter((c) => COLOR_PATTERN.test(c)))].slice(0, 12);

  const trackStock = checked(formData, "track_stock");
  const stockBySize = Object.fromEntries(
    sizes.map((size) => [size, Math.min(99999, Math.max(0, Math.floor(Number(formData.get(`stock_${size}`)) || 0)))]),
  );

  const kept = readImageList(formData, "images");
  const upload = await uploadImages(admin, newFiles(formData, "new_images"), `products/${parsed.data.code}`);
  if ("error" in upload) return failed(upload.error);

  const row = {
    ...parsed.data,
    currency: parsed.data.currency || "MDL",
    sizes,
    colors,
    images: [...kept, ...upload.urls],
    is_sold_out: checked(formData, "is_sold_out"),
    is_hidden: checked(formData, "is_hidden"),
    track_stock: trackStock,
    // Kept even when tracking is off, so switching it back on restores the numbers.
    stock_by_size: stockBySize,
  };

  let previousImages: string[] = [];
  if (id) {
    const { data } = await admin.supabase.from("products").select("images").eq("id", id).single();
    previousImages = Array.isArray(data?.images) ? (data.images as string[]) : [];
  }

  const query = id
    ? admin.supabase.from("products").update(row).eq("id", id).select("id").single()
    : admin.supabase.from("products").insert(row).select("id").single();
  const { data, error } = await query;
  if (error || !data) {
    await removeImages(admin, upload.urls);
    return dbError(error ?? {}, "В этой коллекции уже есть товар с таким кодом");
  }

  await removeImages(admin, previousImages.filter((url) => !row.images.includes(url)));
  refreshSite(CATALOG_TAG);
  if (!id) redirect(`/admin/products/${data.id}?created=1`);
  return done("Товар сохранён");
}

export async function deleteProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (!uuid.safeParse(id).success) return failed("Неверный идентификатор");

  const { data: existing } = await admin.supabase.from("products").select("images").eq("id", id).single();
  const { error } = await admin.supabase.from("products").delete().eq("id", id);
  if (error) return dbError(error, "");

  await removeImages(admin, Array.isArray(existing?.images) ? (existing.images as string[]) : []);
  refreshSite(CATALOG_TAG);
  redirect("/admin/products");
}

/** Quick toggles from the product list (hide / sold out) without opening the form. */
export async function toggleProductFlag(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const flag = str(formData, "flag");
  if (!uuid.safeParse(id).success || (flag !== "is_hidden" && flag !== "is_sold_out")) {
    return failed("Неверный запрос");
  }
  const value = str(formData, "value") === "true";
  const { error } = await admin.supabase.from("products").update({ [flag]: value }).eq("id", id);
  if (error) return dbError(error, "");
  refreshSite(CATALOG_TAG);
  return done(
    flag === "is_hidden" ? (value ? "Товар скрыт" : "Товар снова на сайте") : value ? "Отмечен «Нет в наличии»" : "Снова в наличии",
  );
}
