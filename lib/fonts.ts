import localFont from "next/font/local";
import { Manrope } from "next/font/google";

// NATS has no Cyrillic glyphs — Manrope is loaded as a silent fallback so
// Russian text still renders cleanly instead of falling back to Arial/Tofu.
export const nats = localFont({
  src: "../public/fonts/NATS-Regular.ttf",
  variable: "--font-nats",
  display: "swap",
});

export const fallback = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-fallback",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const display = nats;
export const body = nats;
