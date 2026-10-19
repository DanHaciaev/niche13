"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

export interface BarDatum {
  /** Short axis label, e.g. "12 окт". */
  label: string;
  value: number;
  /** Extra tooltip line, e.g. "48 посетителей". */
  detail?: string;
}

/** Single-series column chart: one ink hue (one series needs no legend),
 * thin columns with 2px gaps and rounded data-ends on a shared baseline,
 * recessive axis, hover tooltip, and a table for screen readers. */
export function BarChart({
  data,
  unit,
  title,
  height = 200,
}: {
  data: BarDatum[];
  unit: string;
  title: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = [max, Math.round(max / 2), 0];
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between pb-6 text-right" style={{ height }} aria-hidden>
          {ticks.map((tick, i) => (
            <span key={i} className="text-[10px] tabular-nums leading-none text-ink-faint">
              {tick}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 24 }} aria-hidden>
            <span className="border-t border-dashed border-line" />
            <span className="border-t border-dashed border-line" />
            <span className="border-t border-ink/30" />
          </div>

          <div className="relative flex items-end gap-0.5" style={{ height: height - 24 }} onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div
                key={i}
                className="relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                aria-label={`${d.label}: ${d.value} ${unit}`}
              >
                <motion.div
                  className={`w-full origin-bottom rounded-t-[4px] transition-colors ${
                    hover === null || hover === i ? "bg-ink" : "bg-ink/25"
                  }`}
                  style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * (0.4 / data.length) }}
                />
                {hover === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap bg-ink px-3 py-2 text-white shadow-lg ${
                      i > data.length * 0.7 ? "right-0" : i < data.length * 0.3 ? "left-0" : "left-1/2 -translate-x-1/2"
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wider text-white/60">{d.label}</span>
                    <span className="block text-sm font-semibold tabular-nums">
                      {d.value} {unit}
                    </span>
                    {d.detail && <span className="block text-[11px] text-white/70">{d.detail}</span>}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 flex h-4 gap-0.5" aria-hidden>
            {data.map((d, i) => (
              <span key={i} className="flex-1 overflow-visible whitespace-nowrap text-center text-[10px] text-ink-faint">
                {i === data.length - 1 || (i % labelEvery === 0 && data.length - 1 - i >= labelEvery) ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* sr-only on a <table> itself doesn't work: tables refuse to shrink to
          1px and would stretch the page. The wrapping div clips it instead. */}
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <th scope="row">{d.label}</th>
                <td>
                  {d.value} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** Ranked list with inline magnitude bars (top pages, request types). */
export function RankList({ rows, unit }: { rows: { label: string; value: number; detail?: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="flex flex-col gap-4">
      {rows.map((row, i) => (
        <li key={row.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate text-sm text-ink">{row.label}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
              {row.value}
              <span className="ml-1 text-[11px] font-normal text-ink-faint">{unit}</span>
            </span>
          </div>
          <div className="h-1.5 bg-cream-deep">
            <motion.div
              className="h-full origin-left rounded-r-[4px] bg-ink"
              style={{ width: `${(row.value / max) * 100}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.05 }}
            />
          </div>
          {row.detail && <span className="text-[11px] text-ink-faint">{row.detail}</span>}
        </li>
      ))}
    </ol>
  );
}

/** Big number that counts up once it scrolls into view. */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString("ru-RU"));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: 1.2, ease: EASE });
    return () => controls.stop();
  }, [inView, value, count]);

  return (
    <>
      <motion.span ref={ref} aria-hidden>
        {rounded}
      </motion.span>
      <span className="sr-only">{value}</span>
    </>
  );
}

export function StatTile({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: number;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className={`flex flex-col justify-between gap-6 border p-5 md:p-6 ${accent ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
      <span className={`label-tag text-[10px]! font-semibold! ${accent ? "text-white/60" : "text-ink-faint"}`}>{label}</span>
      <div>
        <span className="block text-[40px] font-medium leading-none tracking-[-0.03em] tabular-nums md:text-[48px]">
          <CountUp value={value} />
        </span>
        {note && <span className={`mt-2 block text-xs ${accent ? "text-white/60" : "text-ink-faint"}`}>{note}</span>}
      </div>
    </div>
  );
}
