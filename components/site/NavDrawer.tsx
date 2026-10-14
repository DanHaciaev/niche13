"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { useDarkRoute } from "./DarkRouteContext";

const EASE = [0.22, 1, 0.36, 1] as const;

interface NavLink {
  href: string;
  label: string;
}

export default function NavDrawer({
  links,
  menuLabel,
  closeLabel,
}: {
  links: readonly NavLink[];
  menuLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const isDark = useDarkRoute();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`label-tag relative z-50 transition-colors duration-300 ${
          isDark ? "text-white/70 hover:text-white" : "text-ink-soft hover:text-ink"
        }`}
      >
        {menuLabel}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.65, ease: EASE }}
            className={`fixed inset-0 z-40 flex flex-col items-center justify-center ${
              isDark ? "bg-black" : "bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`label-tag absolute right-24 top-7 transition-colors duration-300 ${
                isDark ? "text-white/70 hover:text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              {closeLabel}
            </button>

            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }}
              className="flex flex-col items-center gap-10 md:gap-12"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <Image
                  src="/logo.png"
                  alt="Niche"
                  width={200}
                  height={148}
                  className={`h-16 w-auto md:h-20 ${isDark ? "invert" : ""}`}
                />
              </motion.div>

              <nav className="flex flex-col items-center gap-6">
                {links.map((link) => (
                  <motion.div
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.6, ease: EASE }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`text-base font-medium uppercase tracking-widest transition-colors ${
                        isDark ? "text-white hover:text-white/70" : "text-ink hover:text-ink-soft"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
