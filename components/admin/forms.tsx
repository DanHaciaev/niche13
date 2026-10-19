"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ActionState } from "@/lib/admin/types";

const EASE = [0.22, 1, 0.36, 1] as const;

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const PendingContext = createContext(false);

/** Admin form: runs a Server Action, keeps the typed values if it fails
 * (submitting via onSubmit stops React's automatic reset) and shows the
 * result as a toast. */
export function AdminForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [form, setForm] = useState<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) form?.reset();
  }, [state, resetOnSuccess, form]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Include the clicked button's name/value, as a native submit would.
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  return (
    <PendingContext.Provider value={pending}>
      <form ref={setForm} onSubmit={onSubmit} className={className}>
        {children}
      </form>
      <Toast state={state} />
    </PendingContext.Provider>
  );
}

export function Toast({ state }: { state: ActionState }) {
  const [dismissedAt, setDismissedAt] = useState<number | undefined>();
  const visible = state.message && state.at !== dismissedAt ? state : null;

  useEffect(() => {
    if (!state.message) return;
    const timer = setTimeout(() => setDismissedAt(state.at), 3800);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={visible.at}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 shadow-[0_12px_40px_-12px_rgba(23,21,15,0.35)] ${
              visible.ok ? "bg-ink text-white" : "bg-[#981C1C] text-white"
            }`}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/80" />
            <span className="label-tag text-[11px]! font-medium!">{visible.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  name,
  value,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  name?: string;
  value?: string;
}) {
  const pending = useContext(PendingContext);
  const styles = {
    primary: "bg-ink text-white hover:bg-ink-soft",
    ghost: "border border-line bg-white text-ink hover:border-ink",
    danger: "border border-[#981C1C]/30 bg-white text-[#981C1C] hover:bg-[#981C1C] hover:text-white",
  }[variant];

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`label-tag relative inline-flex items-center justify-center gap-2 overflow-hidden px-6 py-3 text-[11px]! font-medium! transition-colors disabled:cursor-wait ${styles}`}
    >
      <span className={pending ? "opacity-0" : ""}>{children}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1 w-1 rounded-full bg-current"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
      )}
    </button>
  );
}

/** Button that runs a Server Action after the admin confirms. */
export function ConfirmAction({
  action,
  label,
  confirmText,
  fields,
}: {
  action: FormAction;
  label: string;
  confirmText: string;
  fields?: Record<string, string>;
}) {
  return (
    <AdminForm action={action}>
      {Object.entries(fields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <ConfirmSubmit label={label} confirmText={confirmText} />
    </AdminForm>
  );
}

function ConfirmSubmit({ label, confirmText }: { label: string; confirmText: string }) {
  const pending = useContext(PendingContext);
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className="label-tag inline-flex items-center px-5 py-3 text-[11px]! font-medium! text-[#981C1C] transition-colors hover:bg-[#981C1C] hover:text-white disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(Boolean(defaultChecked));
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 py-1">
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="text-xs leading-relaxed text-ink-faint">{hint}</span>}
      </span>
      <input
        type="checkbox"
        name={name}
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 ${
          on ? "bg-ink" : "bg-line"
        }`}
      >
        <motion.span
          className="absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm"
          animate={{ x: on ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </span>
    </label>
  );
}
