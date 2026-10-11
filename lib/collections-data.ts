export interface CollectionMeta {
  slug: string;
  eyebrow?: string;
  title: string;
  sub?: string;
  reverse?: boolean;
  feature?: boolean;
  placeholderLabel: string;
}

type CollectionsT = (key: string) => string;

export function getCollections(t: CollectionsT): CollectionMeta[] {
  return [
    { slug: "ru", eyebrow: t("eyebrow"), title: "RU", reverse: true, placeholderLabel: "top1.jpg" },
    { slug: "en", eyebrow: t("eyebrow"), title: "EN", placeholderLabel: "top2.jpg" },
    { slug: "ro", eyebrow: t("eyebrow"), title: "RO", reverse: true, placeholderLabel: "middle_1.jpg" },
    { slug: "niche-feelings-1", title: t("feelings"), feature: true, placeholderLabel: "middle_2.jpg" },
    { slug: "illustrations", eyebrow: t("eyebrow"), title: t("illustrations"), placeholderLabel: "middle_3.jpg" },
    { slug: "222", eyebrow: t("eyebrow"), title: "222", reverse: true, placeholderLabel: "middle_4.jpg" },
    { slug: "niche-feelings-2", title: t("feelings"), feature: true, placeholderLabel: "middle_5.jpg" },
    { slug: "sander", eyebrow: t("designer"), title: "25.SANDER", sub: t("sanderSeason"), placeholderLabel: "bottom_1.jpg" },
  ];
}
