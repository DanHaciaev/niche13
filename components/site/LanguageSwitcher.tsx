"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useDarkRoute } from "./DarkRouteContext";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Current locale, the others, and a switch that remembers the choice. */
export function useLocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();

  // Opens the same page in the other language (/collections ⇄ /en/collections).
  // The cookie is set first: Russian addresses carry no prefix, so without it
  // the middleware would send a visitor who chose English back to /en.
  function switchTo(next: string) {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.assign(getPathname({ href: pathname, locale: next }) + window.location.search + window.location.hash);
  }

  return { locale, otherLocales: routing.locales.filter((code) => code !== locale), switchTo };
}

export default function LanguageSwitcher() {
  const { locale, otherLocales, switchTo: switchLocale } = useLocaleSwitch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = useDarkRoute();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function switchTo(next: string) {
    setOpen(false);
    switchLocale(next);
  }

  return (
    // flex: the button sits on the nav's centre line instead of the baseline
    // of an inherited 1.5 line-height, which pushed it below the links.
    <div ref={ref} className="relative flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="text-[11px] font-medium uppercase leading-none text-ink transition-colors duration-300 hover:text-ink-soft"
      >
        {locale.toUpperCase()}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className={`absolute left-1/2 top-full mt-3 w-10 -translate-x-1/2 overflow-hidden border border-line ${
              isDark ? "bg-black" : "bg-white"
            }`}
          >
            {otherLocales.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchTo(code)}
                className="flex h-8 w-full items-center justify-center text-[11px] font-medium uppercase text-ink-soft transition-colors duration-300 hover:text-ink"
              >
                {code.toUpperCase()}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
