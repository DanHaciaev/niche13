import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CollectionsList, type CollectionRow } from "@/components/site/CollectionsList";
import { getCollections } from "@/lib/collections-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });
  return { title: t("title") };
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("collections");

  const rows: CollectionRow[] = [
    ...getCollections(t).map((c) => ({
      href: `/collections/${c.slug}`,
      eyebrow: c.eyebrow,
      title: c.title,
      sub: c.sub,
      reverse: c.reverse,
      feature: c.feature,
      placeholderLabel: c.placeholderLabel,
      image: c.image,
    })),
    {
      href: "/custom",
      eyebrow: t("customizeLine1"),
      title: t("customizeLine2"),
      reverse: true,
      placeholderLabel: "custom.jpg",
      image: "/collection9.jpg",
    },
  ];

  return (
    <>
      <div className="flex min-h-screen items-center justify-center px-5">
        <Image
          src="/logo.png"
          alt="Niche"
          width={200}
          height={148}
          className="h-16 w-auto md:h-20"
        />
      </div>

      <CollectionsList rows={rows} />
    </>
  );
}
