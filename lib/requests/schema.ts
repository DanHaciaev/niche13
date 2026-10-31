import { z } from "zod";

export const REQUEST_KINDS = ["collection", "custom", "one_of_one", "illustrations"] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

export const REQUEST_STATUSES = ["new", "in_progress", "done", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Free-text fields each form may send, besides the shared contact fields. */
export const KIND_FIELDS: Record<RequestKind, readonly string[]> = {
  collection: ["instagram", "codes", "size_qty", "colour"],
  custom: ["instagram", "garment", "size_colour", "quantity"],
  one_of_one: ["instagram", "niche_numbers"],
  illustrations: ["instagram", "illustration_codes", "garment", "size_colour", "quantity"],
};

/** Fields the form marks with "*" — rejected when empty. Every field is
 * required except Instagram (and the free-text comment). */
export const REQUIRED_FIELDS: Record<RequestKind, readonly string[]> = {
  collection: KIND_FIELDS.collection.filter((f) => f !== "instagram"),
  custom: KIND_FIELDS.custom.filter((f) => f !== "instagram"),
  one_of_one: KIND_FIELDS.one_of_one.filter((f) => f !== "instagram"),
  illustrations: KIND_FIELDS.illustrations.filter((f) => f !== "instagram"),
};

export const FIELD_LABELS: Record<string, string> = {
  instagram: "Instagram",
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

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(200).pipe(z.email()),
  phone: z.string().trim().regex(/^[+()\d\s.-]{5,40}$/),
  country: z.string().trim().min(1).max(80),
  comment: text(3000),
});

export const itemSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9-]{1,20}$/),
  size: z.string().trim().max(10),
  quantity: z.string().trim().regex(/^\d{0,4}$/),
  color: z.string().trim().max(20),
});

export const itemsSchema = z.array(itemSchema).max(50);

export type RequestItem = z.infer<typeof itemSchema>;
