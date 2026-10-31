"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV = [
  { href: "/admin", label: "Обзор", icon: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" },
  { href: "/admin/requests", label: "Заявки", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/products", label: "Товары", icon: "M7 4 4 7l3 2v11h10V9l3-2-3-3h-3a2 2 0 0 1-4 0H7Z" },
  { href: "/admin/categories", label: "Категории", icon: "M4 6h7M4 12h7M4 18h7M15 5l5 5-5 5" },
  { href: "/admin/collections", label: "Коллекции", icon: "M4 5h7v7H4V5Zm9 0h7v7h-7V5ZM4 14h7v5H4v-5Zm9 0h7v5h-7v-5Z" },
  { href: "/admin/content", label: "Контент", icon: "M5 5h14M5 10h14M5 15h9M5 20h6" },
  { href: "/admin/stats", label: "Статистика", icon: "M5 20V10m7 10V4m7 16v-7" },
  { href: "/admin/settings", label: "Настройки", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavLinks({ newRequests, onNavigate }: { newRequests: number; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3.5 px-4 py-3 transition-colors ${
              active ? "text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId="admin-nav-active"
                className="absolute inset-0 bg-ink"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <svg viewBox="0 0 24 24" className="relative h-4.5 w-4.5 shrink-0" fill="none" aria-hidden>
              <path d={item.icon} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="label-tag relative text-[11px]! font-medium!">{item.label}</span>
            {item.href === "/admin/requests" && newRequests > 0 && (
              <span className="relative ml-auto flex h-5 min-w-5 items-center justify-center bg-[#981C1C] px-1.5 text-[10px] font-semibold text-white">
                {newRequests}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Account({ email, signOut }: { email: string; signOut: () => Promise<void> }) {
  return (
    <div className="border-t border-line pt-5">
      <span className="label-tag block text-[9px]! text-ink-faint">Вы вошли как</span>
      <span className="mt-1 block truncate text-xs text-ink">{email}</span>
      <div className="mt-4 flex items-center justify-between gap-3">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="label-tag link-underline text-[10px]! font-medium! text-ink-soft hover:text-ink"
        >
          Открыть сайт ↗
        </a>
        <form action={signOut}>
          <button type="submit" className="label-tag text-[10px]! font-medium! text-[#981C1C] hover:underline">
            Выйти
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({
  email,
  newRequests,
  signOut,
}: {
  email: string;
  newRequests: number;
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  // Remember which page the menu was opened on: navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean | ((v: boolean) => boolean)) =>
    setOpenOn((typeof value === "function" ? value(open) : value) ? pathname : null);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-line bg-white px-5 py-8 lg:flex">
        <div>
          <Link href="/admin" className="block px-4">
            <Image src="/logo.png" alt="Niche" width={193} height={84} className="h-9 w-auto" priority />
            <span className="label-tag mt-2 block text-[9px]! text-ink-faint">Панель управления</span>
          </Link>
          <div className="mt-10">
            <NavLinks newRequests={newRequests} />
          </div>
        </div>
        <Account email={email} signOut={signOut} />
      </aside>

      {/* Mobile */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-white/90 px-5 backdrop-blur lg:hidden">
        <Link href="/admin">
          <Image src="/logo.png" alt="Niche" width={193} height={84} className="h-7 w-auto" priority />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="label-tag flex items-center gap-2 text-[11px]! font-medium! text-ink"
        >
          {open ? "Закрыть" : "Меню"}
          {!open && newRequests > 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#981C1C]" />}
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-x-0 top-16 z-30 flex max-h-[calc(100vh-4rem)] flex-col gap-6 overflow-y-auto border-b border-line bg-white px-5 py-6 lg:hidden"
          >
            <NavLinks newRequests={newRequests} onNavigate={() => setOpen(false)} />
            <Account email={email} signOut={signOut} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
