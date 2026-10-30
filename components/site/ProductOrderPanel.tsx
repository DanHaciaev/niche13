"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { addOrderRequestItem, getOrderRequestItems, subscribeOrderRequest } from "@/lib/orderRequestStore";

export function ProductOrderPanel({
  code,
  basePath,
  sizes,
  colors,
  stock,
  labels,
}: {
  code: string;
  /** Listing this product belongs to; its order form is at #order-request. */
  basePath: string;
  sizes: string[];
  colors: string[];
  /** Pieces left per size; null when stock isn't tracked. */
  stock: Record<string, number> | null;
  labels: {
    size: string;
    sizeGuide: string;
    quantity: string;
    quantityPlaceholder: string;
    color: string;
    addToOrderRequest: string;
    addedToOrderRequest: string;
    viewYourRequest: string;
    soldOut: string;
  };
}) {
  const t = useTranslations("collections.detail.product");
  const available = (s: string) => stock === null || (stock[s] ?? 0) > 0;
  const inStock = sizes.filter(available);
  const [size, setSize] = useState(inStock.includes("2XL") ? "2XL" : (inStock[0] ?? ""));
  const left = stock === null || !size ? null : (stock[size] ?? 0);
  const soldOut = inStock.length === 0;
  const [quantity, setQuantity] = useState("");
  const [color, setColor] = useState(colors[2] ?? colors[0] ?? "");
  const [added, setAdded] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      const items = getOrderRequestItems();
      setAdded(items.some((i) => i.code === code));
      setCount(items.length);
    };
    sync();
    return subscribeOrderRequest(sync);
  }, [code]);

  return (
    <>
      <div className="mt-10 lg:mt-20 flex flex-col gap-10 lg:flex-row lg:gap-20">
        <div className="w-40 md:w-56">
          <div className="flex items-baseline gap-4">
            <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
              {labels.size}*
            </span>
            <Link
              href="/size-guide"
              className="label-tag text-[11px]! text-ink-faint underline-offset-2 hover:text-ink hover:underline md:text-xs!"
            >
              {labels.sizeGuide}
            </Link>
          </div>
          <div className="mt-3 flex gap-4">
            {sizes.map((s) =>
              available(s) ? (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    // Don't keep a quantity the newly picked size can't cover.
                    if (stock && Number(quantity) > (stock[s] ?? 0)) setQuantity(String(stock[s]));
                  }}
                  className={`label-tag text-[11px]! transition-colors font-medium! md:text-base! ${
                    size === s ? "text-ink" : "text-ink-faint hover:text-ink-soft"
                  }`}
                >
                  {s}
                </button>
              ) : (
                <span
                  key={s}
                  title={labels.soldOut}
                  className="label-tag cursor-not-allowed text-[11px]! font-medium! text-ink-faint/50 line-through md:text-base!"
                >
                  <span className="sr-only">{labels.soldOut}: </span>
                  {s}
                </span>
              ),
            )}
          </div>
          {left !== null && left > 0 && left <= 3 && (
            <p className="label-tag mt-3 text-[10px]! font-medium! text-[#981C1C] md:text-[12px]!">
              {t("lowStock", { count: left })}
            </p>
          )}
        </div>

        <div>
          <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
            {labels.quantity}*
          </span>
          <input
            type="number"
            min={1}
            max={left ?? undefined}
            value={quantity}
            onChange={(e) => {
              const value = e.target.value;
              setQuantity(left !== null && Number(value) > left ? String(left) : value);
            }}
            placeholder={labels.quantityPlaceholder}
            className="mt-3 block w-full border-b border-line bg-transparent pb-2 font-medium! text-[11px]! md:text-[15px]! text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none lg:w-48"
          />
        </div>
      </div>

      <div className="mt-10 lg:mt-20">
        <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
          {labels.color}*
        </span>
        <div className="mt-3 flex gap-3">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={`h-6 w-6 rounded-full border transition-shadow ${
                color === c ? "ring-2 ring-ink ring-offset-2" : "border-line"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="mt-15 flex items-center gap-6">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => addOrderRequestItem({ code, size, quantity: quantity || "1", color })}
          className="label-tag bg-ink px-4 py-2 md:px-8 md:py-4 text-[10px]! font-medium! text-cream transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-ink-soft md:text-[14px]!"
        >
          {soldOut ? labels.soldOut : added ? labels.addedToOrderRequest : labels.addToOrderRequest}
        </button>
        <Link
          href={`${basePath}#order-request`}
          className="label-tag text-[10px]! text-ink-soft text-center underline-offset-2 hover:text-ink hover:underline font-medium! md:text-[14px]!"
        >
          {labels.viewYourRequest}
          {count > 0 ? ` (${count})` : ""}
        </Link>
      </div>
    </>
  );
}
