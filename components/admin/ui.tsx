import type { ReactNode } from "react";
import Link from "next/link";
import type { RequestStatus } from "@/lib/requests/schema";
import { STATUS_LABELS } from "@/lib/admin/labels";

/* Shared admin building blocks. Server-safe (no hooks) so pages can render
   them directly; interactive pieces live in ./forms.tsx. */

export const inputClass =
  "w-full border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint hover:border-ink-faint focus:border-ink";

export const labelClass = "label-tag text-[10px]! font-semibold! text-ink-soft";

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <span className="label-tag text-[11px]! font-medium! text-ink-faint">{eyebrow}</span>
        <h1 className="mt-2 text-[32px] font-medium uppercase leading-none tracking-[-0.02em] text-ink md:text-[44px]">
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-line bg-white ${className}`}>
      {title && (
        <div className="border-b border-line px-5 py-4 md:px-6">
          <h2 className="label-tag text-[12px]! font-semibold! text-ink">{title}</h2>
          {description && <p className="mt-1 text-xs leading-relaxed text-ink-faint">{description}</p>}
        </div>
      )}
      <div className="px-5 py-5 md:px-6 md:py-6">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className="text-xs leading-relaxed text-ink-faint">{hint}</span>}
    </label>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={`label-tag inline-flex items-center gap-2 px-5 py-3 text-[11px]! font-medium! transition-colors ${
        variant === "primary"
          ? "bg-ink text-white hover:bg-ink-soft"
          : "border border-line bg-white text-ink hover:border-ink"
      }`}
    >
      {children}
    </Link>
  );
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  new: "bg-[#981C1C] text-white",
  in_progress: "bg-ink text-white",
  done: "border border-line bg-cream text-ink-soft",
  cancelled: "border border-line bg-white text-ink-faint line-through",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`label-tag inline-flex h-6 items-center px-2.5 text-[9px]! font-semibold! ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Collapsible step-by-step help inside a settings card. */
export function Guide({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border border-line bg-cream/50 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-ink"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="label-tag text-[10px]! font-semibold! text-ink">{title}</span>
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          aria-hidden
          className="shrink-0 text-ink-faint transition-transform duration-300 group-open:rotate-180"
        >
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="flex flex-col gap-3 border-t border-line px-4 py-4 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </details>
  );
}

export function GuideSteps({ children }: { children: ReactNode }) {
  return <ol className="flex list-decimal flex-col gap-2.5 pl-5 marker:font-semibold marker:text-ink">{children}</ol>;
}

/** Monospace snippet the reader copies, e.g. a line for the env file. */
export function Snippet({ children }: { children: ReactNode }) {
  return (
    <code className="block overflow-x-auto whitespace-pre border border-line bg-white px-3 py-2 font-mono text-[12px] text-ink">
      {children}
    </code>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line bg-white px-6 py-16 text-center">
      <span className="label-tag text-[12px]! font-semibold! text-ink">{title}</span>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-faint">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function formatDate(value: string, withTime = true) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    ...(withTime && { hour: "2-digit", minute: "2-digit" }),
    timeZone: "Europe/Chisinau",
  }).format(new Date(value));
}
