"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { signIn } from "@/lib/admin/actions/auth";
import { inputClass, labelClass } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;
const WORD = "Вход".split("");

export function LoginView({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(signIn, {});
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      {/* Left: editorial panel */}
      <div className="relative hidden w-[46%] overflow-hidden bg-ink lg:block">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.55 }}
          transition={{ duration: 1.6, ease: EASE }}
          className="absolute inset-0"
        >
          <Image src="/top1.jpg" alt="" fill sizes="46vw" priority className="object-cover grayscale" />
        </motion.div>
        <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/30 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
          className="absolute inset-x-12 bottom-12 text-white"
        >
          <span className="label-tag text-[11px]! font-medium! text-white/60">Niche · панель управления</span>
          <p className="mt-4 max-w-sm text-2xl font-medium uppercase leading-tight tracking-[-0.01em]">
            Найдите свою вещь. Сделайте её своей.
          </p>
        </motion.div>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Image src="/logo.png" alt="Niche" width={193} height={84} className="h-12 w-auto" priority />
          </motion.div>

          <h1 aria-label="Вход" className="mt-12 flex overflow-hidden text-[56px] font-medium uppercase leading-none tracking-[-0.04em] text-ink">
            {WORD.map((letter, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="inline-block"
                initial={{ y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.06 }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: EASE }}
            className="mt-5 block h-px w-full origin-left bg-ink"
          />

          {!configured ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 border border-[#981C1C]/30 bg-[#981C1C]/5 p-5 text-sm leading-relaxed text-ink-soft"
            >
              <span className="label-tag block text-[11px]! font-semibold! text-[#981C1C]">Supabase не подключён</span>
              <p className="mt-2">
                Добавьте ключи в <code className="bg-white px-1">.env.local</code> и перезапустите{" "}
                <code className="bg-white px-1">npm run dev</code>.
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={onSubmit}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.55 } } }}
              className="mt-10 flex flex-col gap-6"
            >
              <motion.label
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, ease: EASE }}
                className="flex flex-col gap-2"
              >
                <span className={labelClass}>Email</span>
                <input name="email" type="email" required autoComplete="username" className={inputClass} />
              </motion.label>

              <motion.label
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, ease: EASE }}
                className="flex flex-col gap-2"
              >
                <span className="flex items-center justify-between">
                  <span className={labelClass}>Пароль</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="label-tag text-[9px]! text-ink-faint hover:text-ink"
                  >
                    {showPassword ? "Скрыть" : "Показать"}
                  </button>
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
              </motion.label>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <button
                  type="submit"
                  disabled={pending}
                  className="group label-tag relative mt-2 flex w-full items-center justify-center gap-3 overflow-hidden bg-ink py-4 text-[12px]! font-medium! text-white transition-colors hover:bg-ink-soft disabled:cursor-wait"
                >
                  {pending ? "Проверяем…" : "Войти"}
                  {!pending && <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>}
                </button>
              </motion.div>

              <div aria-live="polite" className="min-h-6">
                <AnimatePresence mode="wait">
                  {state.message && !state.ok && (
                    <motion.p
                      key={state.at}
                      initial={{ opacity: 0, x: -8 }}
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
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}
