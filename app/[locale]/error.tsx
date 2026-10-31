"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

/** Shown when a page can't load — in practice, when the database (the only
 * source of the site's content) is unreachable. Retrying re-runs the page. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("unavailable");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center gap-6 px-5 text-center">
      <h1 className="text-[20px] font-medium uppercase text-ink md:text-[28px]">{t("title")}</h1>
      <p className="max-w-md text-sm leading-relaxed text-ink-soft">{t("text")}</p>
      <button
        type="button"
        onClick={reset}
        className="label-tag mt-2 bg-ink px-8 py-4 text-[11px]! font-medium! text-cream transition-colors hover:bg-ink-soft"
      >
        {t("retry")}
      </button>
    </section>
  );
}
