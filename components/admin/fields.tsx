"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { inputClass } from "./ui";

/* eslint-disable @next/next/no-img-element -- previews of local blobs and
   storage URLs; next/image can't optimise blob: URLs. */

const EASE = [0.22, 1, 0.36, 1] as const;

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Existing photos (arrows reorder, first is the cover) plus new uploads
 * with instant previews. Existing URLs post as `name`, files as `fileName`. */
export function ImagesField({
  name,
  fileName,
  initial,
  max = 12,
}: {
  name: string;
  fileName: string;
  initial: string[];
  max?: number;
}) {
  const [kept, setKept] = useState(initial);
  const [added, setAdded] = useState<{ file: File; url: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the real <input type=file> in sync with what's shown, so removing a
  // preview really removes that file from the submission.
  useEffect(() => {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    added.forEach(({ file }) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
  }, [added]);

  useEffect(() => () => added.forEach(({ url }) => URL.revokeObjectURL(url)), [added]);

  const room = max - kept.length - added.length;

  function addFiles(files: FileList | null) {
    if (!files) return;
    if (max === 1) {
      // Single image: a new pick replaces whatever was there.
      const file = [...files].find((f) => f.type.startsWith("image/"));
      if (!file) return;
      setKept([]);
      setAdded([{ file, url: URL.createObjectURL(file) }]);
      return;
    }
    const images = [...files].filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room));
    setAdded((prev) => [...prev, ...images.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  return (
    <div className="flex flex-col gap-3">
      {kept.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      {(kept.length > 0 || added.length > 0) && (
        <div className={`grid gap-3 ${max === 1 ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-4"}`}>
          <AnimatePresence initial={false}>
            {kept.map((url, i) => (
              <motion.div
                key={url}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.35, ease: EASE }}
                className={`group relative overflow-hidden border border-line bg-cream ${max === 1 ? "aspect-4/3 max-w-xs" : "aspect-3/4"}`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 0 && max > 1 && (
                  <span className="label-tag absolute left-0 top-0 bg-ink px-2 py-1 text-[8px]! text-white">Обложка</span>
                )}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  {max > 1 ? (
                    <span className="flex gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => setKept((prev) => move(prev, i, i - 1))}
                        className="flex h-7 w-7 items-center justify-center bg-white/90 text-sm text-ink hover:bg-ink hover:text-white disabled:opacity-30"
                        aria-label="Переместить левее"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={i === kept.length - 1}
                        onClick={() => setKept((prev) => move(prev, i, i + 1))}
                        className="flex h-7 w-7 items-center justify-center bg-white/90 text-sm text-ink hover:bg-ink hover:text-white disabled:opacity-30"
                        aria-label="Переместить правее"
                      >
                        →
                      </button>
                    </span>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => setKept((prev) => prev.filter((u) => u !== url))}
                    className="flex h-7 w-7 items-center justify-center bg-white/90 text-sm text-ink hover:bg-[#981C1C] hover:text-white"
                    aria-label="Убрать фото"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}
            {added.map(({ url, file }) => (
              <motion.div
                key={url}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.35, ease: EASE }}
                className={`group relative overflow-hidden border border-dashed border-ink/40 bg-cream ${max === 1 ? "aspect-4/3 max-w-xs" : "aspect-3/4"}`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <span className="label-tag absolute bottom-0 left-0 right-0 truncate bg-white/90 px-2 py-1 text-[8px]! text-ink-soft">
                  Новое · {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAdded((prev) => prev.filter((a) => a.url !== url))}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center bg-white/90 text-sm text-ink hover:bg-[#981C1C] hover:text-white"
                  aria-label="Убрать фото"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-7 text-center transition-colors ${
          room <= 0 && max > 1 ? "pointer-events-none opacity-40" : ""
        } ${dragging ? "border-ink bg-cream" : "border-ink/30 bg-white hover:border-ink"}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-ink-faint" aria-hidden>
          <path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="label-tag text-[10px]! font-medium! text-ink">
          {max === 1 ? (kept.length || added.length ? "Заменить фото" : "Загрузить фото") : "Добавить фото"}
        </span>
        <span className="text-xs text-ink-faint">
          JPG, PNG, WebP или AVIF · до 10 МБ{max > 1 ? " · первое фото — обложка" : ""}
        </span>
        <input
          ref={inputRef}
          type="file"
          name={fileName}
          multiple={max > 1}
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </label>
    </div>
  );
}

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

/** Which sizes the product comes in and, optionally, how many pieces of each
 * are left. Posts `sizes` (in display order), `track_stock` and
 * `stock_<size>` for every enabled size. */
export function SizesStockField({
  initialSizes,
  initialTrack,
  initialStock,
}: {
  initialSizes: string[];
  initialTrack: boolean;
  initialStock: Record<string, number>;
}) {
  const [sizes, setSizes] = useState(initialSizes);
  const [track, setTrack] = useState(initialTrack);
  const [stock, setStock] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initialStock).map(([k, v]) => [k, String(v)])),
  );
  const [custom, setCustom] = useState("");

  const options = [...new Set([...PRESET_SIZES, ...initialSizes, ...sizes])];
  const selected = options.filter((s) => sizes.includes(s));
  const total = selected.reduce((sum, s) => sum + (Number(stock[s]) || 0), 0);

  function toggle(size: string) {
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  return (
    <div className="flex flex-col gap-5">
      {selected.map((s) => (
        <input key={s} type="hidden" name="sizes" value={s} />
      ))}
      {/* While tracking is off the inputs below aren't rendered; post the
          numbers anyway so switching it back on restores them. */}
      {!track &&
        selected.map((s) => <input key={s} type="hidden" name={`stock_${s}`} value={stock[s] ?? ""} />)}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {options.map((size) => {
            const on = sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggle(size)}
                aria-pressed={on}
                className={`label-tag h-10 min-w-12 px-3 text-[11px]! font-medium! transition-colors ${
                  on ? "bg-ink text-white" : "border border-line bg-white text-ink-faint hover:border-ink hover:text-ink"
                }`}
              >
                {size}
              </button>
            );
          })}
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (custom && !sizes.includes(custom)) setSizes((p) => [...p, custom]);
                setCustom("");
              }
            }}
            placeholder="Свой"
            className="h-10 w-20 border border-line bg-white px-3 text-xs outline-none focus:border-ink"
          />
        </div>
        <span className="text-xs text-ink-faint">
          Нажмите, чтобы включить или выключить размер. Свой размер — введите и Enter.
        </span>
      </div>

      <div className="border-t border-line pt-5">
        <label className="flex cursor-pointer items-start justify-between gap-6">
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink">Учитывать остатки</span>
            <span className="text-xs leading-relaxed text-ink-faint">
              Размер с нулём на сайте станет недоступен, а когда закончатся все — товар покажется «Нет в наличии».
              При остатке 1–3 покупатель увидит «Осталось N шт.».
            </span>
          </span>
          <input
            type="checkbox"
            name="track_stock"
            checked={track}
            onChange={(e) => setTrack(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 ${
              track ? "bg-ink" : "bg-line"
            }`}
          >
            <motion.span
              className="absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm"
              animate={{ x: track ? 20 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
          </span>
        </label>

        <AnimatePresence initial={false}>
          {track && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              {selected.length === 0 ? (
                <p className="pt-4 text-xs text-ink-faint">Сначала выберите размеры выше.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 pt-5 sm:grid-cols-4 md:grid-cols-7">
                  {selected.map((size) => {
                    const value = stock[size] ?? "";
                    const n = Number(value) || 0;
                    return (
                      <label
                        key={size}
                        className={`flex flex-col border px-3 py-2.5 transition-colors focus-within:border-ink ${
                          n === 0 ? "border-[#981C1C]/30 bg-[#981C1C]/4" : n <= 3 ? "border-line bg-cream/60" : "border-line bg-white"
                        }`}
                      >
                        <span className="label-tag text-[10px]! font-semibold! text-ink">{size}</span>
                        <input
                          type="number"
                          name={`stock_${size}`}
                          min={0}
                          max={99999}
                          inputMode="numeric"
                          value={value}
                          placeholder="0"
                          onChange={(e) =>
                            setStock((prev) => ({ ...prev, [size]: e.target.value.replace(/\D/g, "").slice(0, 5) }))
                          }
                          className="mt-1 w-full bg-transparent text-lg font-medium tabular-nums text-ink outline-none"
                        />
                        <span className={`text-[10px] ${n === 0 ? "text-[#981C1C]" : "text-ink-faint"}`}>
                          {n === 0 ? "нет" : n <= 3 ? "мало" : "шт."}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {selected.length > 0 && (
                <p className="pt-3 text-xs text-ink-faint">
                  Всего в наличии: <span className="font-semibold text-ink">{total} шт.</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ColorsField({ initial }: { initial: string[] }) {
  const [colors, setColors] = useState(initial);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <AnimatePresence initial={false}>
        {colors.map((color, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            className="group relative"
          >
            <label
              className="block h-10 w-10 cursor-pointer rounded-full border border-line shadow-[inset_0_0_0_3px_white]"
              style={{ backgroundColor: color }}
              title={color}
            >
              <input
                type="color"
                name="colors"
                value={color}
                onChange={(e) => setColors((prev) => prev.map((c, j) => (j === i ? e.target.value : c)))}
                className="sr-only"
              />
            </label>
            <button
              type="button"
              onClick={() => setColors((prev) => prev.filter((_, j) => j !== i))}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              aria-label={`Убрать цвет ${color}`}
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {colors.length < 12 && (
        <button
          type="button"
          onClick={() => setColors((prev) => [...prev, "#981c1c"])}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-ink/40 text-lg text-ink-faint transition-colors hover:border-ink hover:text-ink"
          aria-label="Добавить цвет"
        >
          +
        </button>
      )}
    </div>
  );
}

export function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <span className="relative block">
      <select name={name} defaultValue={defaultValue} className={`${inputClass} appearance-none pr-10`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
        <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** RU/EN pair of inputs shown as tabs, so bilingual forms stay compact. */
export function BilingualField({
  label,
  name,
  ru,
  en,
  multiline = false,
  rows = 4,
  required = false,
  hint,
}: {
  label: string;
  name: string;
  ru: string;
  en: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  hint?: string;
}) {
  const [lang, setLang] = useState<"ru" | "en">("ru");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="label-tag text-[10px]! font-semibold! text-ink-soft">
          {label}
          {required && " *"}
        </span>
        <div className="flex border border-line">
          {(["ru", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`label-tag px-2.5 py-1 text-[9px]! font-semibold! transition-colors ${
                lang === l ? "bg-ink text-white" : "text-ink-faint hover:text-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {(["ru", "en"] as const).map((l) => {
        const props = {
          name: `${name}_${l}`,
          defaultValue: l === "ru" ? ru : en,
          required: required && l === "ru",
          placeholder: l === "en" ? "English version (необязательно — иначе как на русском)" : "",
          className: `${inputClass} ${lang === l ? "" : "hidden"} ${multiline ? "resize-y leading-relaxed" : ""}`,
        };
        return multiline ? <textarea key={l} rows={rows} {...props} /> : <input key={l} {...props} />;
      })}
      {hint && <span className="text-xs leading-relaxed text-ink-faint">{hint}</span>}
    </div>
  );
}
