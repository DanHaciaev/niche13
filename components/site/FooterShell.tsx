"use client";

import type { CSSProperties, ReactNode } from "react";
import { useDarkRoute } from "./DarkRouteContext";

const DARK_VARS = {
  "--color-ink": "#ffffff",
  "--color-ink-soft": "#cfcfcf",
  "--color-ink-faint": "#9a9a9a",
  "--color-line": "#3a3a3a",
} as CSSProperties;

export function FooterShell({ children }: { children: ReactNode }) {
  const isDark = useDarkRoute();
  return (
    <footer
      className={isDark ? "bg-black" : "bg-white"}
      style={isDark ? DARK_VARS : undefined}
    >
      {children}
    </footer>
  );
}
