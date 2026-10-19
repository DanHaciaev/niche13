import { z } from "zod";

export const REQUEST_KINDS = ["collection", "custom", "one_of_one", "illustrations"] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

export const REQUEST_STATUSES = ["new", "in_progress", "done", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Free-text fields each form may send, besides the shared contact fields. */
export const KIND_FIELDS: Record<RequestKind, readonly string[]> = {
  collection: ["codes", "size_qty", "colour"],
  custom: ["garment", "size_colour", "quantity"],
  one_of_one: ["niche_numbers"],
  illustrations: ["illustration_codes", "garment", "size_colour", "quantity"],
};

/** Fields the form marks with "*" — rejected when empty. */
export const REQUIRED_FIELDS: Partial<Record<RequestKind, readonly string[]>> = {
  one_of_one: ["niche_numbers"],
};

export const FIELD_LABELS: Record<string, string> = {
  codes: "Номера NICHE",
  size_qty: "Размер и количество",
  colour: "Цвет",
  garment: "Изделие",
  size_colour: "Размер и цвет",
  quantity: "Количество",
  niche_numbers: "Номера NICHE",
  illustration_codes: "Коды иллюстраций",
};

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();

export const contactSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z
      .string()
      .trim()
      .max(200)
      .transform((v) => v || null)
      .pipe(z.email().nullable()),
    phone: z
      .string()
      .trim()
      .max(40)
      .transform((v) => v || null)
      .pipe(z.string().regex(/^[+()\d\s.-]{5,40}$/).nullable()),
    country: text(80),
    comment: text(3000),
  })
  // A request nobody can answer is useless: require at least one way back.
  .refine((v) => v.email || v.phone, { path: ["email"] });

export const itemSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9-]{1,20}$/),
  size: z.string().trim().max(10),
  quantity: z.string().trim().regex(/^\d{0,4}$/),
  color: z.string().trim().max(20),
});

export const itemsSchema = z.array(itemSchema).max(50);

export type RequestItem = z.infer<typeof itemSchema>;
