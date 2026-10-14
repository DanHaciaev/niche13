"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

const PRODUCT_PAGE = /^\/collections\/[^/]+\/[^/]+$/;

export function FooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hidden = pathname === "/about" || pathname === "/contacts" || PRODUCT_PAGE.test(pathname);
  if (hidden) return null;
  return <>{children}</>;
}
