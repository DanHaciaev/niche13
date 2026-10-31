"use client";

import { useEffect, useRef, useState } from "react";
import { getOrderRequestItems, subscribeOrderRequest, type OrderRequestItem } from "@/lib/orderRequestStore";

const COLOR_NAMES: Record<string, string> = {
  "#17150f": "Black",
  "#ffffff": "White",
  "#f5c518": "Yellow",
};

function format(items: OrderRequestItem[]): string {
  const withColor = items.filter((i) => i.color);
  if (withColor.length === 0) return "";
  return withColor.map((i) => `${i.code} – ${COLOR_NAMES[i.color] ?? i.color}`).join(", ");
}

export function OrderColourField({
  name,
  placeholder,
  className,
  required = false,
}: {
  name: string;
  required?: boolean;
  placeholder: string;
  className: string;
}) {
  const [value, setValue] = useState("");
  const editingRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      if (editingRef.current) return;
      setValue(format(getOrderRequestItems()));
    };
    sync();
    return subscribeOrderRequest(sync);
  }, []);

  return (
    <textarea
      rows={2}
      name={name}
      required={required}
      maxLength={2000}
      placeholder={placeholder}
      value={value}
      onFocus={() => {
        editingRef.current = true;
      }}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        editingRef.current = false;
      }}
      className={className}
    />
  );
}
