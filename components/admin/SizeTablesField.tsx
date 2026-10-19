"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SIZE_LIMITS, SIZE_TEMPLATES, type SizeTable } from "@/lib/size-tables";
import { inputClass } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const cellClass =
  "w-full min-w-0 border border-transparent bg-transparent px-2 py-2 text-sm tabular-nums text-ink outline-none transition-colors hover:border-line focus:border-ink focus:bg-white";
const headClass =
  "w-full min-w-0 border border-transparent bg-transparent px-2 py-1 outline-none transition-colors hover:border-line focus:border-ink focus:bg-white";
const iconButton =
  "flex h-8 w-8 shrink-0 items-center justify-center text-ink-faint transition-colors hover:bg-[#981C1C] hover:text-white";

let nextId = 0;
type Keyed = SizeTable & { id: number };
const withId = (table: SizeTable): Keyed => ({ ...structuredClone(table), id: nextId++ });

/** Editable list of size tables. Each table has its own columns, so trousers,
 * shoes or accessories can be measured differently from tops. The whole state
 * posts as one JSON field and is validated on the server. */
export function SizeTablesField({ initial }: { initial: SizeTable[] }) {
  const [tables, setTables] = useState<Keyed[]>(() => initial.map(withId));

  const update = (id: number, fn: (t: SizeTable) => SizeTable) =>
    setTables((prev) => prev.map((t) => (t.id === id ? { ...fn(t), id } : t)));

  const serialized = JSON.stringify(tables.map(({ title, columns, rows }) => ({ title, columns, rows })));

  return (
    <div className="flex flex-col gap-6">
      <input type="hidden" name="size_tables" value={serialized} />

      <AnimatePresence initial={false}>
        {tables.map((table, ti) => {
          const grid = { gridTemplateColumns: `repeat(${table.columns.length}, minmax(96px, 1fr)) 32px` };
          return (
            <motion.div
              key={table.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="border border-line"
            >
              <div className="flex flex-col gap-3 border-b border-line bg-cream/60 p-4 md:flex-row md:items-center">
                <span className="label-tag shrink-0 text-[9px]! font-semibold! text-ink-faint">
                  Таблица {ti + 1}
                </span>
                <input
                  value={table.title.ru}
                  maxLength={SIZE_LIMITS.title}
                  onChange={(e) => update(table.id, (t) => ({ ...t, title: { ...t.title, ru: e.target.value } }))}
                  placeholder="Название, например «Брюки» (можно пусто)"
                  className={`${inputClass} md:flex-1`}
                />
                <input
                  value={table.title.en}
                  maxLength={SIZE_LIMITS.title}
                  onChange={(e) => update(table.id, (t) => ({ ...t, title: { ...t.title, en: e.target.value } }))}
                  placeholder="English title"
                  className={`${inputClass} md:flex-1`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Удалить эту таблицу целиком?")) {
                      setTables((prev) => prev.filter((t) => t.id !== table.id));
                    }
                  }}
                  className="label-tag shrink-0 px-3 py-2 text-[9px]! font-semibold! text-[#981C1C] hover:bg-[#981C1C] hover:text-white"
                >
                  Удалить таблицу
                </button>
              </div>

              <div className="overflow-x-auto p-4">
                <div className="min-w-max">
                  {/* Column headers: RU on top, EN below */}
                  <div className="grid items-start gap-1 border-b border-line pb-2" style={grid}>
                    {table.columns.map((column, ci) => (
                      <div key={ci} className="group/col relative flex flex-col">
                        <input
                          value={column.ru}
                          maxLength={SIZE_LIMITS.cell}
                          onChange={(e) =>
                            update(table.id, (t) => ({
                              ...t,
                              columns: t.columns.map((c, j) => (j === ci ? { ...c, ru: e.target.value } : c)),
                            }))
                          }
                          placeholder="Колонка"
                          aria-label={`Колонка ${ci + 1}, по-русски`}
                          className={`${headClass} label-tag text-[10px]! font-semibold! text-ink`}
                        />
                        <input
                          value={column.en}
                          maxLength={SIZE_LIMITS.cell}
                          onChange={(e) =>
                            update(table.id, (t) => ({
                              ...t,
                              columns: t.columns.map((c, j) => (j === ci ? { ...c, en: e.target.value } : c)),
                            }))
                          }
                          placeholder="Column"
                          aria-label={`Колонка ${ci + 1}, по-английски`}
                          className={`${headClass} text-[11px] text-ink-faint`}
                        />
                        {ci > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              update(table.id, (t) => ({
                                ...t,
                                columns: t.columns.filter((_, j) => j !== ci),
                                rows: t.rows.map((r) => r.filter((_, j) => j !== ci)),
                              }))
                            }
                            className="absolute -top-2 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white opacity-0 transition-opacity group-hover/col:opacity-100 focus:opacity-100"
                            aria-label={`Удалить колонку ${column.ru || ci + 1}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={table.columns.length >= SIZE_LIMITS.columns}
                      onClick={() =>
                        update(table.id, (t) => ({
                          ...t,
                          columns: [...t.columns, { ru: "", en: "" }],
                          rows: t.rows.map((r) => [...r, ""]),
                        }))
                      }
                      className="flex h-8 w-8 items-center justify-center border border-dashed border-ink/40 text-ink-faint transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
                      aria-label="Добавить колонку"
                      title="Добавить колонку"
                    >
                      +
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {table.rows.map((row, ri) => (
                      <motion.div
                        key={`${table.id}-${ri}-${table.rows.length}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid items-center gap-1 border-b border-line"
                        style={grid}
                      >
                        {table.columns.map((_, ci) => (
                          <input
                            key={ci}
                            value={row[ci] ?? ""}
                            maxLength={SIZE_LIMITS.cell}
                            onChange={(e) =>
                              update(table.id, (t) => ({
                                ...t,
                                rows: t.rows.map((r, i) =>
                                  i === ri ? t.columns.map((__, j) => (j === ci ? e.target.value : (r[j] ?? ""))) : r,
                                ),
                              }))
                            }
                            aria-label={`${table.columns[ci]?.ru || "Колонка"}, строка ${ri + 1}`}
                            className={`${cellClass} ${ci === 0 ? "font-semibold uppercase" : ""}`}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => update(table.id, (t) => ({ ...t, rows: t.rows.filter((_, i) => i !== ri) }))}
                          className={iconButton}
                          aria-label={`Удалить строку ${row[0] || ri + 1}`}
                        >
                          ×
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="px-4 pb-4">
                <button
                  type="button"
                  disabled={table.rows.length >= SIZE_LIMITS.rows}
                  onClick={() => update(table.id, (t) => ({ ...t, rows: [...t.rows, t.columns.map(() => "")] }))}
                  className="label-tag border border-dashed border-ink/40 px-4 py-2.5 text-[10px]! font-medium! text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
                >
                  + Добавить размер
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {tables.length < SIZE_LIMITS.tables && (
        <div className="flex flex-col gap-3 border border-dashed border-line p-4 md:flex-row md:items-center">
          <span className="label-tag text-[10px]! font-semibold! text-ink-soft md:mr-2">Новая таблица:</span>
          {(
            [
              ["tops", "Верх (футболки, худи)"],
              ["bottoms", "Низ (брюки, шорты)"],
              ["empty", "Пустая"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTables((prev) => [...prev, withId(SIZE_TEMPLATES[key])])}
              className="label-tag border border-line bg-white px-4 py-2.5 text-[10px]! font-medium! text-ink transition-colors hover:border-ink"
            >
              + {label}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs leading-relaxed text-ink-faint">
        Первая колонка — название размера. Строки без размера не сохраняются. Название колонки пишите сразу с
        единицами, например «Талия (см)». Если английский вариант пустой, на английской версии сайта будет русский.
      </p>
    </div>
  );
}
