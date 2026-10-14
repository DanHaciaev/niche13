export interface CollectionMeta {
  slug: string;
  eyebrow?: string;
  title: string;
  sub?: string;
  reverse?: boolean;
  feature?: boolean;
  placeholderLabel: string;
  image?: string;
}

type CollectionsT = (key: string) => string;

export function getCollections(t: CollectionsT): CollectionMeta[] {
  return [
    { slug: "ru", eyebrow: t("eyebrow"), title: "RU", reverse: true, placeholderLabel: "top1.jpg", image: "/collection1.png" },
    { slug: "en", eyebrow: t("eyebrow"), title: "EN", placeholderLabel: "top2.jpg", image: "/collection2.png" },
    { slug: "ro", eyebrow: t("eyebrow"), title: "RO", reverse: true, placeholderLabel: "middle_1.jpg", image: "/collection3.png" },
    { slug: "niche-feelings", title: t("feelings"), feature: true, placeholderLabel: "middle_2.jpg", image: "/collection4.png" },
    { slug: "with-name", eyebrow: t("eyebrow"), title: "///", placeholderLabel: "middle_3.jpg", image: "/collection5.png" },
    { slug: "without-name", eyebrow: t("eyebrow"), title: "///", reverse: true, placeholderLabel: "middle_4.jpg", image: "/collection6.jpg" },
    { slug: "one-of-one", title: t("oneOfOne"), feature: true, placeholderLabel: "middle_5.jpg", image: "/collection7.png" },
    { slug: "illustrations", eyebrow: t("eyebrow"), title: t("illustrations"), placeholderLabel: "bottom_1.jpg", image: "/collection8.jpg" },
  ];
}
