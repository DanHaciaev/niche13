"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

const DarkRouteContext = createContext(false);

export function DarkRouteProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDark = pathname === "/about";
  return (
    <DarkRouteContext.Provider value={isDark}>{children}</DarkRouteContext.Provider>
  );
}

export function useDarkRoute() {
  return useContext(DarkRouteContext);
}
