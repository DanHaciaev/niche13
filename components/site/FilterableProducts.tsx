"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductGrid, type Product } from "./ProductGrid";

type Gender = "male" | "female";
type SortOrder = "default" | "low-high" | "high-low";

export interface FilterLabels {
  filters: string;
  gender: string;
  male: string;
  female: string;
  sortBy: string;
  priceLowHigh: string;
  priceHighLow: string;
  clearFilters: string;
}

export function FilterableProducts({
  products,
  basePath,
  labels,
}: {
  products: Product[];
  basePath: string;
  labels: FilterLabels;
}) {
  const [open, setOpen] = useState(false);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [sort, setSort] = useState<SortOrder>("default");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = useMemo(() => {
    let list = products;
    if (genders.length > 0) {
      list = list.filter((p) => p.gender && genders.includes(p.gender));
    }
    if (sort !== "default") {
      list = [...list].sort((a, b) => {
        const av = a.discountPriceValue ?? a.priceValue ?? 0;
        const bv = b.discountPriceValue ?? b.priceValue ?? 0;
        return sort === "low-high" ? av - bv : bv - av;
      });
    }
    return list;
  }, [products, genders, sort]);

  function toggleGender(g: Gender) {
    setGenders((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  const active = genders.length > 0 || sort !== "default";

  return (
    <>
      <div ref={containerRef} className="relative flex items-center gap-4 px-5 pb-12 md:px-8 lg:px-12">
        <span className="h-px flex-1 bg-black/40" aria-hidden />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="label-tag text-[11px]! text-ink transition-colors hover:text-ink-soft md:text-sm!"
        >
          {labels.filters}
          {active && <span className="ml-1 text-[#981C1C]">•</span>}
        </button>

        {open && (
          <div className="absolute right-5 top-5 z-20 mt-3 w-64 border border-line bg-white p-5 md:right-8 lg:right-12">
            <div>
              <span className="label-tag block text-[11px]! text-ink">{labels.gender}</span>
              <div className="mt-3 flex flex-col gap-2">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGender(g)}
                    className="label-tag text-left text-[12px]! text-ink transition-colors hover:text-ink-soft"
                  >
                    {genders.includes(g) ? "✓ " : ""}
                    {g === "male" ? labels.male : labels.female}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <span className="label-tag block text-[11px]! text-ink">{labels.sortBy}</span>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSort((s) => (s === "low-high" ? "default" : "low-high"))}
                  className="label-tag text-left text-[12px]! text-ink transition-colors hover:text-ink-soft"
                >
                  {sort === "low-high" ? "✓ " : ""}
                  {labels.priceLowHigh}
                </button>
                <button
                  type="button"
                  onClick={() => setSort((s) => (s === "high-low" ? "default" : "high-low"))}
                  className="label-tag text-left text-[12px]! text-ink transition-colors hover:text-ink-soft"
                >
                  {sort === "high-low" ? "✓ " : ""}
                  {labels.priceHighLow}
                </button>
              </div>
            </div>

            {active && (
              <button
                type="button"
                onClick={() => {
                  setGenders([]);
                  setSort("default");
                }}
                className="label-tag mt-5 block text-[11px]! text-ink-faint underline-offset-2 hover:text-ink hover:underline"
              >
                {labels.clearFilters}
              </button>
            )}
          </div>
        )}
      </div>

      <ProductGrid products={filtered} basePath={basePath} />
    </>
  );
}
