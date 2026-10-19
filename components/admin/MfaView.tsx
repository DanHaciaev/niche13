"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { signOut, verifyMfa } from "@/lib/admin/actions/auth";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Six separate digit boxes that behave like one field: typing advances,
 * backspace goes back, pasting a whole code fills them all. */
export function CodeInput({ name, autoFocus = false }: { name: string; autoFocus?: boolean }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setAt(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split("");
      setDigits(Array.from({ length: 6 }, (_, i) => next[i] ?? ""));
      refs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    setDigits((prev) => prev.map((d, i) => (i === index ? clean : d)));
    if (clean && index < 5) refs.current[index + 1]?.focus();
  }

  return (
    <div className="flex justify-between gap-2">
      <input type="hidden" name={name} value={digits.join("")} />
      {digits.map((digit, i) => (
        <motion.input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.3 + i * 0.05 }}
          value={digit}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          maxLength={6}
          aria-label={`Цифра ${i + 1}`}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          onFocus={(e) => e.target.select()}
          className="h-14 w-full min-w-0 border border-line bg-white text-center text-2xl font-medium tabular-nums text-ink outline-none transition-colors focus:border-ink"
        />
      ))}
    </div>
  );
}

export function MfaView() {
  const [state, action, pending] = useActionState(verifyMfa, {});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-sm">
        <Image src="/logo.png" alt="Niche" width={193} height={84} className="h-12 w-auto" priority />

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mt-12 text-[40px] font-medium uppercase leading-none tracking-[-0.03em] text-ink"
        >
          Код
        </motion.h1>
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
          className="mt-5 block h-px w-full origin-left bg-ink"
        />
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">
          Откройте приложение-аутентификатор на телефоне и введите 6 цифр для Niche.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
          <CodeInput name="code" autoFocus />
          <button
            type="submit"
            disabled={pending}
            className="label-tag flex w-full items-center justify-center bg-ink py-4 text-[12px]! font-medium! text-white transition-colors hover:bg-ink-soft disabled:cursor-wait"
          >
            {pending ? "Проверяем…" : "Подтвердить"}
          </button>
          <div aria-live="polite" className="min-h-6">
            <AnimatePresence mode="wait">
              {state.message && !state.ok && (
                <motion.p
                  key={state.at}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="label-tag text-[11px]! font-medium! text-[#981C1C]"
                >
                  {state.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </form>

        <form action={signOut}>
          <button type="submit" className="label-tag text-[10px]! font-medium! text-ink-faint hover:text-ink">
            ← Войти под другим аккаунтом
          </button>
        </form>
      </div>
    </div>
  );
}
