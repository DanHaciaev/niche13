import type { Metadata } from "next";
import { montserrat } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Админка", template: "%s — Niche Admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.ico" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${montserrat.variable} h-full`}>
      <body className="min-h-full bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
