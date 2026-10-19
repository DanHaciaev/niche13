import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin/auth";
import { saveContent } from "@/lib/admin/actions/settings";
import { DEFAULT_EMAIL, DEFAULT_INSTAGRAM, resolveSizeTables, type StoredContent } from "@/lib/data/content";
import { AdminForm, SubmitButton } from "@/components/admin/forms";
import { BilingualField } from "@/components/admin/fields";
import { SizeTablesField } from "@/components/admin/SizeTablesField";
import { Card, Field, PageHeader, inputClass } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Тексты" };

/** The site writes line breaks as <br/> in its texts; the editor shows them
 * as real new lines. */
const fromSite = (text: string) => text.replace(/<br\s*\/?>/gi, "\n");

export default async function ContentPage() {
  const admin = await requireAdmin();
  const { data } = await admin.supabase.from("settings").select("value").eq("key", "content").maybeSingle();
  const stored = (data?.value ?? {}) as StoredContent;

  // Pre-fill with what the site shows today, so editing starts from the real text.
  const [ru, en] = await Promise.all([
    getTranslations({ locale: "ru", namespace: "pages.about" }),
    getTranslations({ locale: "en", namespace: "pages.about" }),
  ]);

  return (
    <AdminForm action={saveContent} className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Содержимое сайта"
        title="Тексты"
        actions={<SubmitButton>Сохранить всё</SubmitButton>}
      />

      <Card title="О бренде" description="Текст страницы «О бренде». Каждая новая строка — новый абзац.">
        <BilingualField
          label="Текст"
          name="about"
          ru={stored.aboutRu || fromSite(ru("text"))}
          en={stored.aboutEn || fromSite(en("text"))}
          multiline
          rows={12}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Email" description="Страница «Контакты» и подвал сайта.">
          <Field label="Адрес">
            <input name="email" type="email" defaultValue={stored.email || DEFAULT_EMAIL} className={inputClass} />
          </Field>
        </Card>
        <Card title="Instagram" description="Ссылка в «Контактах» и в подвале.">
          <Field label="Ссылка на профиль">
            <input
              name="instagramUrl"
              type="url"
              defaultValue={stored.instagramUrl || DEFAULT_INSTAGRAM}
              placeholder="https://instagram.com/niche"
              className={inputClass}
            />
          </Field>
        </Card>
      </div>

      <Card
        title="Таблицы размеров"
        description="Страница «Таблица размеров». Можно сделать отдельные таблицы для верха, брюк и чего угодно — каждая со своими колонками."
      >
        <SizeTablesField initial={resolveSizeTables(stored)} />
      </Card>

      <div className="flex justify-end">
        <SubmitButton>Сохранить всё</SubmitButton>
      </div>
    </AdminForm>
  );
}
