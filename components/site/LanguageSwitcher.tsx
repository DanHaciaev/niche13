/* eslint-disable react-hooks/immutability */
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useDarkRoute } from "./DarkRouteContext";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = useDarkRoute();

  const otherLocales = routing.locales.filter((code) => code !== locale);

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
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    setOpen(false);
    router.replace(pathname, { locale: next });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="text-[9px] font-medium uppercase leading-none text-ink transition-colors duration-300 hover:text-ink-soft"
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
                className="flex h-8 w-full items-center justify-center text-[9px] font-medium uppercase text-ink-soft transition-colors duration-300 hover:text-ink"
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
