import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { saveContentSection } from "@/lib/admin/actions/content";
import type { Bilingual, StoredContent } from "@/lib/data/content";
import { AdminForm, SubmitButton } from "@/components/admin/forms";
import { BilingualField, ImagesField } from "@/components/admin/fields";
import { SizeTablesField } from "@/components/admin/SizeTablesField";
import { Card, Field, PageHeader, inputClass } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Контент" };

/** One card = one form = one part of the content row (see saveContentSection). */
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card title={title} description={description}>
      <AdminForm action={saveContentSection} className="flex flex-col gap-6">
        <input type="hidden" name="section" value={id} />
        {children}
        <div className="flex justify-end border-t border-line pt-5">
          <SubmitButton>Сохранить</SubmitButton>
        </div>
      </AdminForm>
    </Card>
  );
}

function Photo({ name, value, label, hint }: { name: string; value?: string; label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <ImagesField key={value ?? "none"} name={name} fileName={`${name}_file`} initial={value ? [value] : []} max={1} />
    </Field>
  );
}

function Text({
  name,
  label,
  value,
  multiline = false,
  rows,
  hint,
}: {
  name: string;
  label: string;
  value?: Bilingual;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <BilingualField
      label={label}
      name={name}
      ru={value?.ru ?? ""}
      en={value?.en ?? ""}
      multiline={multiline}
      rows={rows}
      hint={hint}
    />
  );
}

export default async function ContentPage() {
  const admin = await requireAdmin();
  // Read straight from the database (not the site's cache) so the editor
  // always shows what was last saved.
  const { data } = await admin.supabase.from("settings").select("value").eq("key", "content").maybeSingle();
  const c = (data?.value ?? {}) as StoredContent;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Все тексты и фото сайта" title="Контент" />

      <Section
        id="seo"
        title="Поиск и превью ссылок"
        description="Как сайт выглядит в Google и в превью ссылок в Instagram, Telegram, WhatsApp."
      >
        <Text
          name="seo_title"
          label="Название сайта"
          value={c.seo?.title}
          hint="Заголовок главной в поиске; на остальных страницах добавляется после их названия. До 60 символов."
        />
        <Text
          name="seo_description"
          label="Описание"
          value={c.seo?.description}
          multiline
          rows={3}
          hint="Текст под ссылкой в Google. Лучше 120–160 символов: кто вы и что продаёте."
        />
      </Section>

      <Section id="home" title="Главная" description="Большие фото вверху и фото слайдера News.">
        <div className="grid gap-6 md:grid-cols-2">
          <Photo name="hero_left" value={c.home?.heroLeft} label="Левое фото" hint="На телефоне не показывается." />
          <Photo name="hero_right" value={c.home?.heroRight} label="Правое фото" hint="На телефоне — единственное." />
        </div>
        <Field label="Слайдер News" hint="Порядок — как здесь; стрелками можно переставить.">
          <ImagesField
            key={(c.home?.news ?? []).join("|")}
            name="news"
            fileName="news_files"
            initial={c.home?.news ?? []}
            max={20}
          />
        </Field>
      </Section>

      <Section
        id="collections"
        title="Страница «Коллекции»"
        description="Сетка категорий всегда показывает минимум два ряда: пустые места заполняются этим фото."
      >
        <Photo name="category_placeholder" value={c.categoryPlaceholder} label="Фото-заглушка" hint="Без фото пустые места не показываются." />
      </Section>

      <Section id="footer" title="Подвал" description="Внизу каждой страницы.">
        <Text name="footer_heading" label="Заголовок" value={c.footer?.heading} hint="Например «Найдите свою вещь. Сделайте её своей.»" />
        <Text
          name="footer_text"
          label="Текст"
          value={c.footer?.text}
          multiline
          rows={3}
          hint="На телефоне каждая строка — отдельная строка, на компьютере всё в одну."
        />
        <Photo name="footer_image" value={c.footer?.image} label="Фото" />
      </Section>

      <Section id="about" title="О бренде" description="Страница «О бренде».">
        <Text name="about" label="Текст" value={{ ru: c.aboutRu ?? "", en: c.aboutEn ?? "" }} multiline rows={12} hint="Каждая новая строка — новый абзац." />
        <Photo name="about_image" value={c.aboutImage} label="Фото" />
      </Section>

      <Section id="contacts" title="Контакты" description="Страница «Контакты»; email и Instagram — ещё и в подвале.">
        <Text name="contacts_title" label="Заголовок страницы" value={c.contacts?.title} />
        <Text name="contacts_subtitle" label="Подзаголовок" value={c.contacts?.subtitle} multiline rows={2} />
        <Text
          name="contacts_custom"
          label="Текст в блоке «Индивидуальные заказы»"
          value={c.contacts?.customText}
          multiline
          rows={2}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Email">
            <input name="email" type="email" defaultValue={c.email ?? ""} className={inputClass} />
          </Field>
          <Field label="Ссылка на Instagram">
            <input
              name="instagramUrl"
              type="url"
              defaultValue={c.instagramUrl ?? ""}
              placeholder="https://instagram.com/niche"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section id="custom" title="Создать свой Niche" description="Страница /custom и плитка «Customize your Niche» в сетке коллекций.">
        <Text name="custom_title" label="Заголовок страницы" value={c.custom?.heroTitle} />
        <Text name="custom_description" label="Описание" value={c.custom?.heroDescription} multiline rows={5} />
        <Text name="custom_request" label="Текст над формой" value={c.custom?.requestText} multiline rows={4} />
        <Text name="custom_heading" label="Заголовок формы" value={c.custom?.formHeading} />
        <Photo name="custom_image" value={c.custom?.heroImage} label="Фото на странице" />
        <div className="grid gap-6 border-t border-line pt-6 md:grid-cols-2">
          <Text name="custom_tile_title" label="Название плитки" value={c.custom?.tileTitle} hint="Подпись под плиткой в сетке коллекций." />
          <Photo name="custom_tile_image" value={c.custom?.tileImage} label="Фото плитки" />
        </div>
      </Section>

      <Section
        id="catalog"
        title="Тексты каталога по умолчанию"
        description="Подставляются, если у коллекции соответствующее поле пустое, и на страницах категорий без коллекций."
      >
        <Text name="defaults_description" label="Описание вверху страницы" value={c.catalogDefaults?.description} multiline rows={4} />
        <Text name="defaults_request" label="Текст над формой заявки" value={c.catalogDefaults?.requestText} multiline rows={3} />
        <Text name="defaults_heading" label="Заголовок формы" value={c.catalogDefaults?.formHeading} />
        <div className="flex flex-col gap-6 border-t border-line pt-6">
          <span className="label-tag text-[10px]! font-semibold! text-ink">Товар без своего названия и описания</span>
          <Text name="product_title" label="Название" value={c.productDefaults?.title} />
          <Text name="product_description" label="Описание" value={c.productDefaults?.description} multiline rows={3} />
        </div>
      </Section>

      <Section
        id="size"
        title="Таблица размеров"
        description="Страница «Таблица размеров». Можно сделать отдельные таблицы для верха, брюк и чего угодно — каждая со своими колонками."
      >
        <Text name="size_intro" label="Текст над таблицами" value={c.sizeIntro} multiline rows={3} />
        <SizeTablesField initial={c.sizeTables ?? []} />
        <Text name="size_note" label="Текст под таблицами" value={c.sizeNote} multiline rows={2} />
      </Section>
    </div>
  );
}
