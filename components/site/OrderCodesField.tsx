"use client";

import { useEffect, useRef, useState } from "react";
import { getOrderRequestItems, setOrderRequestItems, subscribeOrderRequest } from "@/lib/orderRequestStore";

export function OrderCodesField({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder: string;
}) {
  const [codes, setCodes] = useState("");
  const editingRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      if (editingRef.current) return;
      setCodes(getOrderRequestItems().map((i) => i.code).join(", "));
    };
    sync();
    return subscribeOrderRequest(sync);
  }, []);

  function commit(value: string) {
    const keep = new Set(
      value
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    );
    const existing = getOrderRequestItems();
    const next = [...keep].map((code) => {
      const match = existing.find((i) => i.code === code);
      return match ?? { code, size: "", quantity: "", color: "" };
    });
    setOrderRequestItems(next);
  }

  return (
    <label className="flex flex-col gap-3">
      <span className="label-tag text-black font-medium! text-[8px]! md:text-[10px]! lg:text-[11px]! lg:text-[12px]! ml-auto md:ml-0">
        {label}
      </span>
      <textarea
        rows={2}
        name={name}
        maxLength={2000}
        placeholder={placeholder}
        value={codes}
        onFocus={() => {
          editingRef.current = true;
        }}
        onChange={(e) => setCodes(e.target.value)}
        onBlur={(e) => {
          editingRef.current = false;
          commit(e.target.value);
        }}
        className="resize-none border-b border-black bg-transparent pb-3 font-medium! text-[8px]! md:text-[10px]! lg:text-[11px]! leading-relaxed text-ink-faint placeholder:text-ink-faint focus:border-ink focus:outline-none"
      />
    </label>
  );
}
