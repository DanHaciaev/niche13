import { saveCollection } from "@/lib/admin/actions/catalog";
import { COLLECTION_KIND_LABELS, LAYOUT_LABELS } from "@/lib/admin/labels";
import { AdminForm, SubmitButton, Toggle } from "./forms";
import { BilingualField, ImagesField, Select } from "./fields";
import { Card, Field, inputClass } from "./ui";

export interface CollectionRecord {
  id?: string;
  slug: string;
  title_ru: string;
  title_en: string;
  eyebrow_ru: string;
  eyebrow_en: string;
  description_ru: string;
  description_en: string;
  cover_image: string | null;
  hero_image: string | null;
  kind: keyof typeof COLLECTION_KIND_LABELS;
  layout: keyof typeof LAYOUT_LABELS;
  is_active: boolean;
  sort_order: number;
}

export const EMPTY_COLLECTION: CollectionRecord = {
  slug: "",
  title_ru: "",
  title_en: "",
  eyebrow_ru: "Коллекция",
  eyebrow_en: "Collection",
  description_ru: "",
  description_en: "",
  cover_image: null,
  hero_image: null,
  kind: "catalog",
  layout: "left",
  is_active: true,
  sort_order: 100,
};

export function CollectionEditor({ collection }: { collection: CollectionRecord }) {
  const imagesKey = `${collection.cover_image}|${collection.hero_image}`;

  return (
    <AdminForm action={saveCollection} className="grid gap-4 xl:grid-cols-[1fr_340px]">
      {collection.id && <input type="hidden" name="id" value={collection.id} />}

      <div className="flex flex-col gap-4">
        <Card title="Название и текст">
          <div className="flex flex-col gap-6">
            <BilingualField label="Название" name="title" ru={collection.title_ru} en={collection.title_en} required />
            <BilingualField
              label="Надпись над названием"
              name="eyebrow"
              ru={collection.eyebrow_ru}
              en={collection.eyebrow_en}
              hint="Мелкий текст в списке коллекций, например «Коллекция». Можно оставить пустым."
            />
            <BilingualField
              label="Описание"
              name="description"
              ru={collection.description_ru}
              en={collection.description_en}
              multiline
              rows={5}
              hint="Текст рядом с фото вверху страницы коллекции. Пусто — стандартный текст сайта."
            />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Фото в списке" description="Показывается на странице «Коллекции».">
            <ImagesField key={`cover-${imagesKey}`} name="cover_image" fileName="cover_image_file" initial={collection.cover_image ? [collection.cover_image] : []} max={1} />
          </Card>
          <Card title="Фото на странице" description="Большое фото вверху страницы коллекции.">
            <ImagesField key={`hero-${imagesKey}`} name="hero_image" fileName="hero_image_file" initial={collection.hero_image ? [collection.hero_image] : []} max={1} />
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:sticky xl:top-8 xl:self-start">
        <Card title="Публикация">
          <Toggle name="is_active" label="Показывать на сайте" hint="Выключите, чтобы скрыть коллекцию со всеми товарами." defaultChecked={collection.is_active} />
          <div className="mt-6 flex justify-end border-t border-line pt-5">
            <SubmitButton>{collection.id ? "Сохранить" : "Создать коллекцию"}</SubmitButton>
          </div>
        </Card>

        <Card title="Настройки">
          <div className="flex flex-col gap-5">
            <Field label="Адрес *" hint="Латиница и дефисы: сайт/collections/адрес">
              <input
                name="slug"
                required
                defaultValue={collection.slug}
                placeholder="autumn-2026"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={inputClass}
              />
            </Field>
            <Field label="Тип страницы">
              <Select
                name="kind"
                defaultValue={collection.kind}
                options={Object.entries(COLLECTION_KIND_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Field>
            <Field label="Вид в списке">
              <Select
                name="layout"
                defaultValue={collection.layout}
                options={Object.entries(LAYOUT_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Field>
            <Field label="Порядок" hint="Меньше — выше в списке">
              <input name="sort_order" type="number" defaultValue={collection.sort_order} className={inputClass} />
            </Field>
          </div>
        </Card>
      </div>
    </AdminForm>
  );
}
