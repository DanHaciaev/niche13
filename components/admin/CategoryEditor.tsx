import { saveCategory } from "@/lib/admin/actions/catalog";
import { AdminForm, SubmitButton, Toggle } from "./forms";
import { BilingualField, ImagesField } from "./fields";
import { Card, Field, LinkChecklist, inputClass } from "./ui";
import { CategoryModeField } from "./CategoryModeField";

export interface CategoryRecord {
  id?: string;
  slug: string;
  title_ru: string;
  title_en: string;
  image: string | null;
  is_active: boolean;
  sort_order: number;
  /** Missing until schema.sql adds the column; treated as true. */
  has_collections?: boolean;
}

export const EMPTY_CATEGORY: CategoryRecord = {
  slug: "",
  title_ru: "",
  title_en: "",
  image: null,
  is_active: true,
  sort_order: 100,
  has_collections: true,
};

export function CategoryEditor({
  category,
  collections,
  linked,
}: {
  category: CategoryRecord;
  collections: { id: string; title_ru: string; slug: string }[];
  linked: string[];
}) {
  return (
    <AdminForm action={saveCategory} className="grid gap-4 xl:grid-cols-[1fr_340px]">
      {category.id && <input type="hidden" name="id" value={category.id} />}

      <div className="flex flex-col gap-4">
        <Card title="Название">
          <BilingualField
            label="Название"
            name="title"
            ru={category.title_ru}
            en={category.title_en}
            required
            hint="Показывается над фото на странице «Коллекции», например «Футболки»."
          />
        </Card>

        <Card title="Что открывается по клику" description="Сетка коллекций или сразу каталог товаров.">
          <CategoryModeField
            defaultOn={category.has_collections !== false}
            productsHref={category.id ? `/admin/products?category=${category.id}` : null}
          >
            <span className="mb-3 block text-xs leading-relaxed text-ink-faint">
              Отмеченные коллекции появятся в этой категории. Одна коллекция может быть в нескольких категориях.
            </span>
            <LinkChecklist
              options={collections.map((c) => ({ id: c.id, label: c.title_ru, hint: `/collections/${c.slug}` }))}
              selected={linked}
              empty="Коллекций пока нет — создайте их в разделе «Коллекции»."
            />
          </CategoryModeField>
        </Card>

        <Card title="Фото" description="Плитка на странице «Коллекции». Лучше горизонтальное: на макете 394×261.">
          <ImagesField
            key={category.image ?? "none"}
            name="image"
            fileName="image_file"
            initial={category.image ? [category.image] : []}
            max={1}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:sticky xl:top-8 xl:self-start">
        <Card title="Публикация">
          <Toggle
            name="is_active"
            label="Показывать на сайте"
            hint="Скрытая категория пропадёт со страницы «Коллекции»; сами коллекции останутся."
            defaultChecked={category.is_active}
          />
          <div className="mt-6 flex justify-end border-t border-line pt-5">
            <SubmitButton>{category.id ? "Сохранить" : "Создать категорию"}</SubmitButton>
          </div>
        </Card>

        <Card title="Настройки">
          <div className="flex flex-col gap-5">
            <Field label="Адрес *" hint="Латиница и дефисы: сайт/category/адрес">
              <input
                name="slug"
                required
                defaultValue={category.slug}
                placeholder="t-shirts"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={inputClass}
              />
            </Field>
            <Field label="Порядок" hint="Меньше — левее и выше в сетке">
              <input name="sort_order" type="number" defaultValue={category.sort_order} className={inputClass} />
            </Field>
          </div>
        </Card>
      </div>
    </AdminForm>
  );
}
