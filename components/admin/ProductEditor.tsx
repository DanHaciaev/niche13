import { saveProduct } from "@/lib/admin/actions/catalog";
import { AdminForm, SubmitButton, Toggle } from "./forms";
import { BilingualField, ColorsField, ImagesField, Select, SizesStockField } from "./fields";
import { Card, Field, inputClass } from "./ui";

export interface ProductRecord {
  id?: string;
  collection_id: string | null;
  category_id?: string | null;
  code: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  gender: "male" | "female" | null;
  price: number | null;
  discount_price: number | null;
  currency: string;
  images: string[];
  sizes: string[];
  colors: string[];
  is_sold_out: boolean;
  is_hidden: boolean;
  sort_order: number;
  track_stock: boolean;
  stock_by_size: Record<string, number>;
}

export const EMPTY_PRODUCT: ProductRecord = {
  collection_id: null,
  category_id: null,
  code: "",
  title_ru: "",
  title_en: "",
  description_ru: "",
  description_en: "",
  gender: null,
  price: null,
  discount_price: null,
  currency: "MDL",
  images: [],
  sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  colors: ["#17150f", "#ffffff", "#f5c518"],
  is_sold_out: false,
  is_hidden: false,
  sort_order: 0,
  track_stock: false,
  stock_by_size: {},
};

export function ProductEditor({
  product,
  collections,
  categories = [],
}: {
  product: ProductRecord;
  collections: { id: string; title_ru: string }[];
  /** Categories without collections: products can live in them directly. */
  categories?: { id: string; title_ru: string }[];
}) {
  return (
    <AdminForm action={saveProduct} className="grid gap-4 xl:grid-cols-[1fr_340px]">
      {product.id && <input type="hidden" name="id" value={product.id} />}

      <div className="flex flex-col gap-4">
        <Card title="Фотографии" description="Первое фото показывается в каталоге. Без фото товар покажется с общей картинкой.">
          {/* Remount from saved data after each save so uploaded files are not sent twice. */}
          <ImagesField key={product.images.join("|")} name="images" fileName="new_images" initial={product.images} />
        </Card>

        <Card title="Описание">
          <div className="flex flex-col gap-6">
            <BilingualField
              label="Название"
              name="title"
              ru={product.title_ru}
              en={product.title_en}
              hint="Если пусто — на сайте будет «Вышитая футболка»."
            />
            <BilingualField
              label="Описание"
              name="description"
              ru={product.description_ru}
              en={product.description_en}
              multiline
              rows={6}
              hint="Каждая новая строка — отдельный абзац."
            />
          </div>
        </Card>

        <Card title="Размеры, наличие и цвета" description="Покупатель выбирает их на странице товара.">
          <div className="flex flex-col gap-8">
            <SizesStockField
              initialSizes={product.sizes}
              initialTrack={product.track_stock ?? false}
              initialStock={product.stock_by_size ?? {}}
            />
            <div className="flex flex-col gap-3">
              <span className="label-tag text-[10px]! font-semibold! text-ink-soft">Цвета</span>
              <ColorsField initial={product.colors} />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:sticky xl:top-8 xl:self-start">
        <Card title="Публикация">
          <div className="flex flex-col gap-4">
            <Toggle name="is_hidden" label="Скрыть с сайта" hint="Товар останется в админке." defaultChecked={product.is_hidden} />
            <Toggle
              name="is_sold_out"
              label="Нет в наличии"
              hint="Вручную, независимо от остатков. На фото появится плашка."
              defaultChecked={product.is_sold_out}
            />
          </div>
          <div className="mt-6 flex justify-end border-t border-line pt-5">
            <SubmitButton>{product.id ? "Сохранить" : "Создать товар"}</SubmitButton>
          </div>
        </Card>

        <Card title="Основное">
          <div className="flex flex-col gap-5">
            <Field label="Где показывать *" hint="Коллекция — или категория без коллекций, например «Сумки».">
              <span className="relative block">
                <select
                  name="place"
                  defaultValue={
                    product.category_id
                      ? `category:${product.category_id}`
                      : `collection:${product.collection_id ?? collections[0]?.id ?? ""}`
                  }
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <optgroup label="Коллекции">
                    {collections.map((c) => (
                      <option key={c.id} value={`collection:${c.id}`}>
                        {c.title_ru}
                      </option>
                    ))}
                  </optgroup>
                  {categories.length > 0 && (
                    <optgroup label="Категории без коллекций">
                      {categories.map((c) => (
                        <option key={c.id} value={`category:${c.id}`}>
                          {c.title_ru}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
                  <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Код *" hint="NICHE / код">
                <input name="code" required defaultValue={product.code} placeholder="001" pattern="[A-Za-z0-9\-]{1,20}" className={inputClass} />
              </Field>
              <Field label="Порядок" hint="меньше — выше">
                <input name="sort_order" type="number" defaultValue={product.sort_order} className={inputClass} />
              </Field>
            </div>
            <Field label="Пол">
              <Select
                name="gender"
                defaultValue={product.gender ?? ""}
                options={[
                  { value: "", label: "Не указан" },
                  { value: "male", label: "Мужское" },
                  { value: "female", label: "Женское" },
                ]}
              />
            </Field>
          </div>
        </Card>

        <Card title="Цена">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[1fr_88px] gap-3">
              <Field label="Цена">
                <input name="price" inputMode="decimal" defaultValue={product.price ?? ""} placeholder="400" className={inputClass} />
              </Field>
              <Field label="Валюта">
                <input name="currency" defaultValue={product.currency} className={inputClass} />
              </Field>
            </div>
            <Field label="Цена со скидкой" hint="Заполните — и на товаре появится плашка «Скидка».">
              <input
                name="discount_price"
                inputMode="decimal"
                defaultValue={product.discount_price ?? ""}
                placeholder="—"
                className={inputClass}
              />
            </Field>
          </div>
        </Card>
      </div>
    </AdminForm>
  );
}
