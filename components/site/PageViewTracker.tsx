"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

/** Sends one beacon per page navigation for the admin's visit statistics. */
export function PageViewTracker() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const body = JSON.stringify({ path: pathname, locale });
    navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
  }, [pathname, locale]);

  return null;
}
