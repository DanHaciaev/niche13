"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@/i18n/navigation";

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
        className="label-tag relative z-50 text-ink-soft transition-colors duration-300 hover:text-ink"
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
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="label-tag absolute right-24 top-7 text-ink-soft transition-colors duration-300 hover:text-ink"
            >
              {closeLabel}
            </button>

            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }}
              className="flex flex-col items-center gap-10 sm:gap-12"
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
                  className="h-16 w-auto sm:h-20"
                />
              </motion.div>

              <nav className="flex flex-col items-center gap-8 sm:gap-10">
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
                      className="text-[22px]  uppercase tracking-widest text-ink transition-colors hover:text-ink-soft"
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
