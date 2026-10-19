import type { RequestStatus } from "@/lib/requests/schema";

export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Выполнена",
  cancelled: "Отменена",
};

export const KIND_LABELS = {
  collection: "Из коллекции",
  custom: "Свой дизайн",
  one_of_one: "One-of-one",
  illustrations: "Иллюстрации",
} as const;

export const COLLECTION_KIND_LABELS = {
  catalog: "Обычная коллекция",
  one_of_one: "One-of-one",
  illustrations: "Иллюстрации",
} as const;

export const LAYOUT_LABELS = {
  left: "Фото слева",
  right: "Фото справа",
  feature: "Широкий баннер",
} as const;
