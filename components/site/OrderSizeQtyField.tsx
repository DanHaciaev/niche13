"use client";

import { useEffect, useRef, useState } from "react";
import { getOrderRequestItems, subscribeOrderRequest, type OrderRequestItem } from "@/lib/orderRequestStore";

function format(items: OrderRequestItem[]): string {
  const withSize = items.filter((i) => i.size);
  if (withSize.length === 0) return "";
  return withSize.map((i) => `${i.code} – Size ${i.size}, Quantity ${i.quantity || 1}`).join(".  ") + ".";
}

export function OrderSizeQtyField({ placeholder, className }: { placeholder: string; className: string }) {
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
