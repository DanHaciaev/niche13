"use client";

import { useState } from "react";

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
const COLORS = ["#17150f", "#ffffff", "#f5c518"];

export function SizeOptions() {
  const [selected, setSelected] = useState("2XL");
  return (
    <div className="flex gap-4">
      {SIZES.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => setSelected(size)}
          className={`label-tag text-[13px]! transition-colors md:text-[20px]! lg:text-[23px]! ${
            selected === size ? "text-ink" : "text-ink-faint hover:text-ink-soft"
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}

export function ColorOptions() {
  const [selected, setSelected] = useState(COLORS[2]);
  return (
    <div className="flex gap-3">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => setSelected(color)}
          aria-label={color}
          className={`h-6 w-6 rounded-full border transition-shadow ${
            selected === color ? "ring-2 ring-ink ring-offset-2" : "border-line"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
