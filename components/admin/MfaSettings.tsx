"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  confirmMfaEnroll,
  disableMfa,
  startMfaEnroll,
  type MfaEnrollState,
} from "@/lib/admin/actions/auth";
import type { ActionState } from "@/lib/admin/types";
import { CodeInput } from "./MfaView";
import { Toast } from "./forms";

/* eslint-disable @next/next/no-img-element -- QR code is an inline data: SVG */

const EASE = [0.22, 1, 0.36, 1] as const;

function useFormAction(action: (s: ActionState, f: FormData) => Promise<ActionState>) {
  const [state, run, pending] = useActionState(action, {});
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => run(data));
  };
  return { state, onSubmit, pending };
}

const button =
  "label-tag inline-flex items-center justify-center px-6 py-3 text-[11px]! font-medium! transition-colors disabled:cursor-wait disabled:opacity-60";

export function MfaSettings({ enabled }: { enabled: boolean }) {
  const [enroll, start, starting] = useActionState<MfaEnrollState>(startMfaEnroll, {});
  const confirm = useFormAction(confirmMfaEnroll);
  const disable = useFormAction(disableMfa);
  const [showSecret, setShowSecret] = useState(false);

  if (enabled) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          <span className="text-sm font-medium text-ink">Включён — при входе нужен код из приложения</span>
        </div>
        <form onSubmit={disable.onSubmit} className="flex flex-col gap-3 border-t border-line pt-5 md:flex-row md:items-end">
          <div className="flex flex-col gap-2 md:w-80">
            <span className="label-tag text-[10px]! font-semibold! text-ink-soft">Отключить — введите текущий код</span>
            <CodeInput name="code" />
          </div>
          <button type="submit" disabled={disable.pending} className={`${button} border border-[#981C1C]/30 text-[#981C1C] hover:bg-[#981C1C] hover:text-white`}>
            {disable.pending ? "…" : "Отключить"}
          </button>
        </form>
        <Toast state={disable.state} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#981C1C]" />
        <p className="text-sm leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">Выключен.</span> Сейчас для входа хватает пароля. Включите — и даже с
          украденным паролем никто не войдёт без вашего телефона.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!enroll.factorId ? (
          <motion.div key="start" exit={{ opacity: 0 }}>
            <button
              type="button"
              disabled={starting}
              onClick={() => startTransition(() => start())}
              className={`${button} bg-ink text-white hover:bg-ink-soft`}
            >
              {starting ? "Готовим QR-код…" : "Подключить приложение"}
            </button>
            {enroll.message && !enroll.ok && <p className="mt-3 text-xs text-[#981C1C]">{enroll.message}</p>}
          </motion.div>
        ) : (
          <motion.div
            key="enroll"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="grid gap-6 border-t border-line pt-6 md:grid-cols-[200px_1fr]"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="border border-line bg-white p-3">
                <img src={enroll.qr} alt="QR-код для приложения-аутентификатора" width={176} height={176} />
              </div>
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="label-tag text-[9px]! text-ink-faint hover:text-ink"
              >
                {showSecret ? "Скрыть ключ" : "Не сканируется? Показать ключ"}
              </button>
              {showSecret && (
                <code className="max-w-full break-all bg-cream px-2 py-1 text-center text-[11px] text-ink">{enroll.secret}</code>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <ol className="flex list-decimal flex-col gap-2 pl-4 text-sm leading-relaxed text-ink-soft">
                <li>
                  Установите на телефон Google Authenticator, Microsoft Authenticator или любое приложение для
                  кодов 2FA.
                </li>
                <li>Отсканируйте QR-код слева — в приложении появится «Niche».</li>
                <li>Введите 6 цифр, которые показывает приложение.</li>
              </ol>
              <form onSubmit={confirm.onSubmit} className="flex flex-col gap-3 md:max-w-80">
                <input type="hidden" name="factorId" value={enroll.factorId} />
                <CodeInput name="code" />
                <button type="submit" disabled={confirm.pending} className={`${button} bg-ink text-white hover:bg-ink-soft`}>
                  {confirm.pending ? "Проверяем…" : "Включить 2FA"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toast state={confirm.state} />
    </div>
  );
}
