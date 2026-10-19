"use client";

import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 10 * 1024 * 1024;

export function DesignUploadField({ prompt, formats }: { prompt: string; formats: string }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [tooBig, setTooBig] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The form resets itself after a successful submission; clear the label too.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setFileName(null);
      setTooBig(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  return (
    <label
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDrop={() => setDragging(false)}
      className={`relative mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed bg-white/40 px-4 py-8 text-center transition-colors hover:border-ink ${
        dragging ? "border-ink bg-white/70" : "border-ink/40"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        name="design"
        required
        accept="image/png,image/jpeg,application/pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setFileName(file?.name ?? null);
          setTooBig(Boolean(file && file.size > MAX_BYTES));
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-ink-faint">
        <path
          d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="label-tag text-[11px]! text-ink md:text-xs!">{fileName ?? prompt}</span>
      <span className={`text-xs ${tooBig ? "text-[#981C1C]" : "text-ink-faint"}`}>
        {tooBig ? `${formats} · ≤ 10 MB` : formats}
      </span>
    </label>
  );
}
