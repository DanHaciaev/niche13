"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { submitRequest, type RequestState } from "@/lib/requests/actions";
import type { RequestKind } from "@/lib/requests/schema";
import {
  getOrderRequestItems,
  setOrderRequestItems,
  subscribeOrderRequest,
} from "@/lib/orderRequestStore";

const EASE = [0.22, 1, 0.36, 1] as const;

const FormStateContext = createContext<{ state: RequestState; pending: boolean }>({
  state: { status: "idle" },
  pending: false,
});

/** Wraps a site enquiry form: posts it to the `submitRequest` Server Action
 * and shares pending/result state with <SubmitButton> and <FormMessage>,
 * which the server-rendered form places wherever its layout needs them. */
export function RequestForm({
  kind,
  collectionSlug,
  className,
  children,
}: {
  kind: RequestKind;
  collectionSlug?: string;
  className: string;
  children: ReactNode;
}) {
  const locale = useLocale();
  const [state, action, pending] = useActionState(submitRequest, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState("[]");

  // Set on the client only: a server timestamp would mismatch on hydration.
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);

  useEffect(() => {
    if (kind !== "collection") return;
    const sync = () => setItems(JSON.stringify(getOrderRequestItems()));
    sync();
    return subscribeOrderRequest(sync);
  }, [kind]);

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    if (kind === "collection") setOrderRequestItems([]);
  }, [state, kind]);

  // Submitting via onSubmit (rather than <form action>) stops React from
  // clearing every field when the server rejects the request.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <FormStateContext.Provider value={{ state, pending }}>
      <form ref={formRef} onSubmit={onSubmit} className={className}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="locale" value={locale} />
        {collectionSlug && <input type="hidden" name="collection" value={collectionSlug} />}
        {kind === "collection" && <input type="hidden" name="items" value={items} />}
        <input ref={startedRef} type="hidden" name="started_at" defaultValue="" />
        {/* Honeypot: invisible to people, irresistible to bots. */}
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

export function SubmitButton({
  label,
  className,
  style,
}: {
  label: string;
  className: string;
  style?: CSSProperties;
}) {
  const { pending } = useContext(FormStateContext);
  const t = useTranslations("requestForm");

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-70`}
      style={style}
    >
      {pending ? t("sending") : label}
    </button>
  );
}

export function FormMessage({
  className = "",
  onDark = false,
}: {
  className?: string;
  /** On a coloured panel (the red illustrations form) both states use white. */
  onDark?: boolean;
}) {
  const { state } = useContext(FormStateContext);
  const t = useTranslations("requestForm");
  const text =
    state.status === "success"
      ? t("success")
      : state.status === "error"
        ? t(`errors.${state.error ?? "server"}`)
        : null;

  return (
    <div aria-live="polite" className={className}>
      <AnimatePresence mode="wait">
        {text && (
          <motion.p
            key={state.at}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className={`label-tag text-center text-[11px]! font-medium! md:text-[12px]! ${
              onDark ? "text-white!" : state.status === "success" ? "text-ink!" : "text-[#981C1C]!"
            }`}
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
