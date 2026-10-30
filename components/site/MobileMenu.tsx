"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Link, usePathname } from "@/i18n/navigation";
import { useDarkRoute } from "./DarkRouteContext";
import { useLocaleSwitch } from "./LanguageSwitcher";

const EASE = [0.22, 1, 0.36, 1] as const;

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Phone header (below 768px): "MENU · HOME", where MENU opens a
 * full-screen menu with the logo, the main links and the language. */
export function MobileMenu({
  links,
  menuLabel,
  homeLabel,
}: {
  links: readonly { href: string; label: string }[];
  menuLabel: string;
  homeLabel: string;
}) {
  const pathname = usePathname();
  const isDark = useDarkRoute();
  const { otherLocales, switchTo } = useLocaleSwitch();
  // Remember which page the menu was opened on: navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const close = () => setOpenOn(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const text = "text-[10px] font-medium uppercase leading-none transition-colors";
  const tone = isDark ? "text-white hover:text-white/70" : "text-ink hover:text-ink-soft";

  return (
    <>
      <div className="relative z-50 flex h-14 items-center gap-[26px] px-5">
        <button
          type="button"
          onClick={() => setOpenOn(open ? null : pathname)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className={`${text} ${tone}`}
        >
          {menuLabel}
        </button>
        <Link href="/" onClick={close} className={`${text} ${tone}`}>
          {homeLabel}
        </Link>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className={`fixed inset-0 z-40 flex items-center justify-center ${isDark ? "bg-black" : "bg-white"}`}
          >
            <motion.nav
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
              className="flex flex-col items-center gap-7"
            >
              <motion.div variants={item} className="mb-2">
                <Image
                  src="/logo.png"
                  alt="Niche"
                  width={193}
                  height={84}
                  className={`h-12 w-auto ${isDark ? "invert" : ""}`}
                />
              </motion.div>
              {links.map((link) => (
                <motion.div key={link.href} variants={item}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className={`text-[12px] font-medium uppercase transition-colors ${tone}`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {otherLocales.map((code) => (
                <motion.div key={code} variants={item}>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      switchTo(code);
                    }}
                    className={`text-[12px] font-medium uppercase transition-colors ${tone}`}
                  >
                    {code}
                  </button>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
