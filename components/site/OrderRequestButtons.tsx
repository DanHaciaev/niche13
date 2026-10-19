"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  addOrderRequestItem,
  getOrderRequestItems,
  subscribeOrderRequest,
} from "@/lib/orderRequestStore";

export function AddToOrderRequestButton({
  code,
  getSelection,
  label,
  addedLabel,
  className,
}: {
  code: string;
  getSelection: () => { size: string; quantity: string; color: string };
  label: string;
  addedLabel: string;
  className: string;
}) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const sync = () => setAdded(getOrderRequestItems().some((i) => i.code === code));
    sync();
    return subscribeOrderRequest(sync);
  }, [code]);

  return (
    <button
      type="button"
      onClick={() => addOrderRequestItem({ code, ...getSelection() })}
      className={className}
    >
      {added ? addedLabel : label}
    </button>
  );
}

export function ViewYourRequestLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getOrderRequestItems().length);
    return subscribeOrderRequest(() => setCount(getOrderRequestItems().length));
  }, []);

  return (
    <Link href={href} className={className}>
      {label}
      {count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
