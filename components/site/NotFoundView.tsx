"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Link } from "@/i18n/navigation";

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function NotFoundView() {
  const t = useTranslations("notFound");
  const reduceMotion = useReducedMotion();

  // Pointer position normalised to -1..1, smoothed so the digits drift
  // rather than snap when the cursor moves.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 60, damping: 20 });
  const y = useSpring(pointerY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1);
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduceMotion, pointerX, pointerY]);

  return (
    <section className="relative flex min-h-[calc(100svh-5rem)] flex-col overflow-hidden bg-white">
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 md:px-8">
        <motion.span
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="label-tag text-[12px]! font-medium! text-ink-faint"
        >
          {t("label")}
        </motion.span>

        <div
          aria-hidden="true"
          className="mt-6 flex items-center gap-[0.04em] text-[clamp(7rem,28vw,20rem)] font-medium leading-none tracking-[-0.06em] text-ink select-none"
        >
          <Digit char="4" delay={0.15} depth={-14} x={x} y={y} />
          <Ring delay={0.3} x={x} y={y} still={!!reduceMotion} />
          <Digit char="4" delay={0.45} depth={14} x={x} y={y} />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.9 } } }}
          className="mt-10 flex max-w-xl flex-col items-center text-center md:mt-12"
        >
          <motion.h1
            variants={fadeUp}
            className="text-balance text-xl uppercase tracking-[0.08em] text-ink md:text-2xl"
          >
            {t("title")}
          </motion.h1>

          <motion.span
            variants={{
              hidden: { scaleX: 0 },
              visible: { scaleX: 1, transition: { duration: 0.9, ease: EASE } },
            }}
            className="mt-6 block h-px w-16 origin-center bg-ink"
          />

          <motion.p
            variants={fadeUp}
            className="mt-6 text-balance text-sm leading-relaxed text-ink-soft md:text-base"
          >
            {t("text")}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:gap-10"
          >
            <Link
              href="/"
              className="group label-tag inline-flex items-center gap-3 border border-ink bg-ink px-7 py-4 text-[12px]! font-medium! text-white transition-colors duration-300 hover:bg-white hover:text-ink"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
              {t("home")}
            </Link>
            <Link
              href="/collections"
              className="link-underline label-tag text-[12px]! font-medium! text-ink"
            >
              {t("collections")}
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <Marquee text={t("marquee")} still={!!reduceMotion} />
    </section>
  );
}

function Digit({
  char,
  delay,
  depth,
  x,
  y,
}: {
  char: string;
  delay: number;
  depth: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
}) {
  const dx = useTransform(x, (value) => value * depth);
  const dy = useTransform(y, (value) => value * depth * 0.6);

  return (
    // The clip box turns the slide-up into a "mask reveal", like type
    // being printed from beneath the line.
    <span className="inline-block overflow-hidden pb-[0.06em]">
      <motion.span className="inline-block" style={{ x: dx, y: dy }}>
        <motion.span
          className="inline-block"
          initial={{ y: "110%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 1.1, ease: EASE, delay }}
        >
          {char}
        </motion.span>
      </motion.span>
    </span>
  );
}

function Ring({
  delay,
  x,
  y,
  still,
}: {
  delay: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  still: boolean;
}) {
  const dx = useTransform(x, (value) => value * -6);
  const dy = useTransform(y, (value) => value * -4);

  return (
    <motion.span
      className="relative inline-flex h-[0.74em] w-[0.6em] items-center justify-center"
      style={{ x: dx, y: dy }}
    >
      <svg viewBox="0 0 120 148" className="absolute inset-0 h-full w-full overflow-visible">
        {/* The outline draws itself in, standing in for the "0". */}
        <motion.ellipse
          cx="60"
          cy="74"
          rx="52"
          ry="66"
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: -90 }}
          transition={{ duration: 1.4, ease: EASE, delay }}
          style={{ transformOrigin: "60px 74px" }}
        />
        {/* A small dot orbits the ring once it has drawn — the "missing" page. */}
        <motion.g
          initial={{ opacity: 0, rotate: 0 }}
          animate={still ? { opacity: 1 } : { opacity: 1, rotate: 360 }}
          transition={{
            opacity: { duration: 0.5, delay: delay + 1.3 },
            rotate: { duration: 9, ease: "linear", repeat: Infinity, delay: delay + 1.3 },
          }}
          style={{ transformOrigin: "60px 74px" }}
        >
          <circle cx="60" cy="-10" r="7" fill="currentColor" />
        </motion.g>
      </svg>
    </motion.span>
  );
}

function Marquee({ text, still }: { text: string; still: boolean }) {
  const items = Array.from({ length: 8 }, () => text);

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 1.4 }}
      className="overflow-hidden border-t border-line py-4"
    >
      <motion.div
        className="flex w-max"
        animate={still ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        {/* Two identical halves so the -50% loop point is seamless. */}
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0">
            {items.map((item, index) => (
              <span
                key={index}
                className="label-tag flex items-center gap-8 pr-8 text-[11px]! font-medium! text-ink-faint"
              >
                {item}
                <span className="inline-block h-1 w-1 rounded-full bg-ink-faint" />
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
