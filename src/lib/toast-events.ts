"use client";

export const APP_TOAST_EVENT = "resume-tool:toast";

export type ToastTone = "success" | "info" | "warning" | "error";

export type ToastEventDetail = {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
};

export function emitToast(detail: ToastEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastEventDetail>(APP_TOAST_EVENT, { detail }));
}

