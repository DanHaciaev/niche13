"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { addOrderRequestItem, getOrderRequestItems, subscribeOrderRequest } from "@/lib/orderRequestStore";

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
const COLORS = ["#17150f", "#ffffff", "#f5c518"];

export function ProductOrderPanel({
  code,
  slug,
  labels,
}: {
  code: string;
  slug: string;
  labels: {
    size: string;
    sizeGuide: string;
    quantity: string;
    quantityPlaceholder: string;
    color: string;
    addToOrderRequest: string;
    addedToOrderRequest: string;
    viewYourRequest: string;
  };
}) {
  const [size, setSize] = useState("2XL");
  const [quantity, setQuantity] = useState("");
  const [color, setColor] = useState(COLORS[2]);
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
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`label-tag text-[11px]! transition-colors font-medium! md:text-base! ${
                  size === s ? "text-ink" : "text-ink-faint hover:text-ink-soft"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label-tag text-[13px]! font-medium! text-ink md:text-[16px]!">
            {labels.quantity}*
          </span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
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
          {COLORS.map((c) => (
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
          onClick={() => addOrderRequestItem({ code, size, quantity: quantity || "1", color })}
          className="label-tag bg-ink px-4 py-2 md:px-8 md:py-4 text-[10px]! font-medium! text-cream transition-colors hover:bg-ink-soft md:text-[14px]!"
        >
          {added ? labels.addedToOrderRequest : labels.addToOrderRequest}
        </button>
        <Link
          href={`/collections/${slug}#order-request`}
          className="label-tag text-[10px]! text-ink-soft text-center underline-offset-2 hover:text-ink hover:underline font-medium! md:text-[14px]!"
        >
          {labels.viewYourRequest}
          {count > 0 ? ` (${count})` : ""}
        </Link>
      </div>
    </>
  );
}
