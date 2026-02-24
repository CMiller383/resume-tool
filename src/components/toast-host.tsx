"use client";

import { useEffect, useMemo, useState } from "react";

import {
  APP_TOAST_EVENT,
  type ToastEventDetail,
  type ToastTone,
} from "@/lib/toast-events";

type ToastItem = ToastEventDetail & {
  id: string;
  createdAt: number;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<ToastEventDetail>;
      if (!custom.detail?.message) return;
      const next: ToastItem = {
        id: createToastId(),
        title: custom.detail.title,
        message: custom.detail.message,
        tone: custom.detail.tone ?? "info",
        durationMs: custom.detail.durationMs ?? 2200,
        createdAt: Date.now(),
      };
      setToasts((prev) => [next, ...prev].slice(0, 4));
    };

    window.addEventListener(APP_TOAST_EVENT, handler as EventListener);
    return () => window.removeEventListener(APP_TOAST_EVENT, handler as EventListener);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, toast.durationMs ?? 2200),
    );
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  const toneClasses = useMemo<Record<ToastTone, string>>(
    () => ({
      success: "border-[color:var(--success)]/25 bg-[color:var(--success-soft)] text-[color:var(--success)]",
      info: "border-[color:var(--accent)]/25 bg-[color:var(--info-soft)] text-[color:var(--accent)]",
      warning: "border-[color:var(--warn)]/25 bg-[color:var(--warn-soft)] text-[color:var(--warn)]",
      error: "border-[color:var(--danger)]/25 bg-[color:var(--danger-soft)] text-[color:var(--danger)]",
    }),
    [],
  );

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="no-print pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,420px)] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={classNames(
            "pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.12)] backdrop-blur-sm",
            toneClasses[toast.tone ?? "info"],
          )}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
              <p className={classNames("text-sm", toast.title && "mt-0.5")}>{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== toast.id))
              }
              className="rounded-lg border border-current/15 bg-white/70 px-2 py-1 text-xs font-semibold text-current transition hover:bg-white"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

