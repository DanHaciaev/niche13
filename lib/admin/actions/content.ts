"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { newFiles, readImageList, uploadImages } from "@/lib/admin/images";
import { refreshSite } from "@/lib/admin/revalidate";
import { done, failed, type ActionState } from "@/lib/admin/types";
import { CONTENT_TAG, EMAIL_PATTERN, type Bilingual, type StoredContent } from "@/lib/data/content";
import { sizeTablesSchema } from "@/lib/size-tables";

const SECTIONS = ["about", "contacts", "home", "collections", "footer", "custom", "catalog", "size", "seo"] as const;
type Section = (typeof SECTIONS)[number];

type Admin = Awaited<ReturnType<typeof requireAdmin>>;

/** Reads one admin content card. Each card saves only its own part of the
 * content row, so saving one never overwrites another. */
class SectionForm {
  constructor(
    private admin: Admin,
    private formData: FormData,
  ) {}

  text(key: string, max = 4000) {
    return String(this.formData.get(key) ?? "").trim().slice(0, max);
  }

  bilingual(key: string, max = 4000): Bilingual {
    return { ru: this.text(`${key}_ru`, max), en: this.text(`${key}_en`, max) };
  }

  /** One photo: a new upload replaces it, otherwise the kept one stays. */
  async image(key: string): Promise<string | undefined> {
    const upload = newFiles(this.formData, `${key}_file`).slice(0, 1);
    if (upload.length) {
      const result = await uploadImages(this.admin, upload, "content");
      if ("error" in result) throw new Error(result.error);
      return result.urls[0];
    }
    return readImageList(this.formData, key)[0];
  }

  /** A list of photos: the kept ones in order, then new uploads. */
  async images(key: string): Promise<string[]> {
    const kept = readImageList(this.formData, key);
    const result = await uploadImages(this.admin, newFiles(this.formData, `${key}_files`), "content");
    if ("error" in result) throw new Error(result.error);
    return [...kept, ...result.urls];
  }
}

async function readSection(form: SectionForm, section: Section, current: StoredContent): Promise<StoredContent | string> {
  switch (section) {
    case "about": {
      const about = form.bilingual("about", 8000);
      return { aboutRu: about.ru, aboutEn: about.en, aboutImage: await form.image("about_image") };
    }
    case "contacts": {
      const email = form.text("email", 200);
      if (email && !EMAIL_PATTERN.test(email)) return "Проверьте email";
      const instagramUrl = form.text("instagramUrl", 300);
      if (instagramUrl && !z.url({ protocol: /^https$/ }).safeParse(instagramUrl).success) {
        return "Ссылка на Instagram должна начинаться с https://";
      }
      return {
        email,
        instagramUrl,
        contacts: {
          title: form.bilingual("contacts_title", 200),
          subtitle: form.bilingual("contacts_subtitle", 500),
          customText: form.bilingual("contacts_custom", 1000),
        },
      };
    }
    case "home":
      return {
        home: {
          heroLeft: await form.image("hero_left"),
          heroRight: await form.image("hero_right"),
          news: await form.images("news"),
        },
      };
    case "collections":
      return { categoryPlaceholder: await form.image("category_placeholder") };
    case "footer":
      return {
        footer: {
          image: await form.image("footer_image"),
          heading: form.bilingual("footer_heading", 200),
          text: form.bilingual("footer_text", 1000),
        },
      };
    case "custom":
      return {
        custom: {
          heroTitle: form.bilingual("custom_title", 200),
          heroDescription: form.bilingual("custom_description", 3000),
          requestText: form.bilingual("custom_request", 2000),
          formHeading: form.bilingual("custom_heading", 200),
          heroImage: await form.image("custom_image"),
          tileTitle: form.bilingual("custom_tile_title", 120),
          tileImage: await form.image("custom_tile_image"),
        },
      };
    case "catalog":
      return {
        catalogDefaults: {
          description: form.bilingual("defaults_description", 3000),
          requestText: form.bilingual("defaults_request", 2000),
          formHeading: form.bilingual("defaults_heading", 200),
        },
        productDefaults: {
          title: form.bilingual("product_title", 200),
          description: form.bilingual("product_description", 4000),
        },
      };
    case "seo":
      return { seo: { title: form.bilingual("seo_title", 70), description: form.bilingual("seo_description", 300) } };
    case "size": {
      let sizeTables;
      try {
        const parsed = sizeTablesSchema.safeParse(JSON.parse(form.text("size_tables", 200_000) || "[]"));
        if (!parsed.success) return "Проверьте таблицы размеров: слишком длинный текст или много колонок";
        sizeTables = parsed.data;
      } catch {
        return "Не удалось прочитать таблицы размеров";
      }
      return { sizeTables, sizeIntro: form.bilingual("size_intro", 1000), sizeNote: form.bilingual("size_note", 1000) };
    }
  }
  return current;
}

export async function saveContentSection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const section = formData.get("section");
  if (!SECTIONS.includes(section as Section)) return failed("Неверный запрос");

  const { data, error: loadError } = await admin.supabase.from("settings").select("value").eq("key", "content").maybeSingle();
  if (loadError) return failed("Не удалось прочитать контент из базы");
  const current = (data?.value ?? {}) as StoredContent;

  let update: StoredContent | string;
  try {
    update = await readSection(new SectionForm(admin, formData), section as Section, current);
  } catch (error) {
    // Upload problems (wrong type, too large) arrive as readable messages.
    return failed(error instanceof Error ? error.message : "Не удалось загрузить фото");
  }
  if (typeof update === "string") return failed(update);

  const { error } = await admin.supabase
    .from("settings")
    .upsert({ key: "content", value: { ...current, ...update }, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[admin] save content failed", error);
    return failed("Не удалось сохранить");
  }

  refreshSite(CONTENT_TAG);
  return done("Сохранено — уже на сайте");
}
