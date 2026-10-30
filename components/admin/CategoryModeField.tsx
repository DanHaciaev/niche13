"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** "Has collections" switch for a category. On: shows the collections
 * checklist (passed as children). Off: the category is a plain product
 * catalog, so the checklist is hidden — and, not being in the form, it
 * leaves existing links untouched. */
export function CategoryModeField({
  defaultOn,
  productsHref,
  children,
}: {
  defaultOn: boolean;
  productsHref: string | null;
  children: ReactNode;
}) {
  const [on, setOn] = useState(defaultOn);

  return (
    <div className="flex flex-col gap-5">
      <label className="flex cursor-pointer items-start justify-between gap-6">
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink">У категории есть коллекции</span>
          <span className="text-xs leading-relaxed text-ink-faint">
            Включено — покупатель видит сетку коллекций. Выключено — сразу каталог товаров этой категории
            (как «Сумки»).
          </span>
        </span>
        <input
          type="checkbox"
          name="has_collections"
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 ${
            on ? "bg-ink" : "bg-line"
          }`}
        >
          <motion.span
            className="absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm"
            animate={{ x: on ? 20 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
          />
        </span>
      </label>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={on ? "collections" : "products"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="border-t border-line pt-5"
        >
          {on ? (
            children
          ) : (
            <p className="text-sm leading-relaxed text-ink-soft">
              Товары этой категории добавляются в разделе «Товары»: в карточке товара в поле{" "}
              <b>«Где показывать»</b> выберите эту категорию.
              {productsHref && (
                <>
                  {" "}
                  <Link href={productsHref} className="text-ink underline underline-offset-2">
                    Открыть товары категории →
                  </Link>
                </>
              )}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
