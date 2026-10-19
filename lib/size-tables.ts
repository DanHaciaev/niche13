import { z } from "zod";

/* Size tables: shared by the site, the admin editor (client) and the save
   action, so it has no server-only imports. */

export interface Bilingual {
  ru: string;
  en: string;
}

/** One table on the size-guide page, e.g. "Tops" or "Trousers". Each row
 * holds one cell per column; the first column is the size name. */
export interface SizeTable {
  title: Bilingual;
  columns: Bilingual[];
  rows: string[][];
}

export const SIZE_LIMITS = { tables: 10, columns: 10, rows: 40, cell: 40, title: 80 } as const;

const cell = z.string().trim().max(SIZE_LIMITS.cell);
const bilingual = (max: number) => z.object({ ru: z.string().trim().max(max), en: z.string().trim().max(max) });

export const sizeTablesSchema = z
  .array(
    z.object({
      title: bilingual(SIZE_LIMITS.title),
      columns: z.array(bilingual(SIZE_LIMITS.cell)).min(1).max(SIZE_LIMITS.columns),
      rows: z.array(z.array(cell).max(SIZE_LIMITS.columns)).max(SIZE_LIMITS.rows),
    }),
  )
  .max(SIZE_LIMITS.tables)
  // Keep rows exactly as wide as the header and drop rows without a size.
  .transform((tables) =>
    tables.map((t) => ({
      ...t,
      rows: t.rows
        .map((row) => t.columns.map((_, i) => row[i] ?? ""))
        .filter((row) => row[0]),
    })),
  );

const col = (ru: string, en: string): Bilingual => ({ ru, en });

export const SIZE_TEMPLATES: Record<"tops" | "bottoms" | "empty", SizeTable> = {
  tops: {
    title: col("Футболки и худи", "T-shirts & hoodies"),
    columns: [col("Размер", "Size"), col("Грудь (см)", "Chest (cm)"), col("Длина (см)", "Length (cm)"), col("Плечи (см)", "Shoulder (cm)"), col("Рукав (см)", "Sleeve (cm)")],
    rows: [
      ["S", "46", "66", "44", "20"],
      ["M", "50", "69", "47", "21"],
      ["L", "54", "72", "50", "22"],
      ["XL", "58", "75", "53", "23"],
      ["2XL", "62", "78", "56", "24"],
      ["3XL", "66", "81", "59", "25"],
    ],
  },
  bottoms: {
    title: col("Брюки и шорты", "Trousers & shorts"),
    columns: [col("Размер", "Size"), col("Талия (см)", "Waist (cm)"), col("Бёдра (см)", "Hips (cm)"), col("Длина (см)", "Length (cm)"), col("Шаг (см)", "Inseam (cm)")],
    rows: ["S", "M", "L", "XL"].map((size) => [size, "", "", "", ""]),
  },
  empty: {
    title: col("", ""),
    columns: [col("Размер", "Size"), col("", "")],
    rows: [["", ""]],
  },
};

/** The table the site has always shown, as the starting point. Old saves
 * stored fixed {size, chest, …} rows — those are converted into it. */
export function legacySizeTables(
  rows?: { size: string; chest: string; length: string; shoulder: string; sleeve: string }[],
): SizeTable[] {
  const base = SIZE_TEMPLATES.tops;
  return [
    {
      ...base,
      title: col("", ""),
      rows: rows?.length ? rows.map((r) => [r.size, r.chest, r.length, r.shoulder, r.sleeve]) : base.rows,
    },
  ];
}
