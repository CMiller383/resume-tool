import type { BuilderUIState, ResumeDocument } from "@/types/resume";

export const RESUME_STORAGE_KEY = "resume-tool.master-resume.v1";
export const UI_STORAGE_KEY = "resume-tool.ui.v1";

type PersistedEnvelope<T> = {
  schemaVersion: 1;
  data: T;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isEnvelope<T>(value: unknown): value is PersistedEnvelope<T> {
  return (
    !!value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    "data" in value &&
    (value as { schemaVersion?: unknown }).schemaVersion === 1
  );
}

export function loadPersistedResume(): {
  resume: ResumeDocument | null;
  corrupted: boolean;
} {
  if (!canUseStorage()) return { resume: null, corrupted: false };
  const parsed = safeParse<unknown>(window.localStorage.getItem(RESUME_STORAGE_KEY));
  if (!parsed) {
    const hasRaw = window.localStorage.getItem(RESUME_STORAGE_KEY) !== null;
    return { resume: null, corrupted: hasRaw };
  }
  if (!isEnvelope<ResumeDocument>(parsed)) return { resume: null, corrupted: true };
  return { resume: parsed.data, corrupted: false };
}

export function loadPersistedUI(): {
  ui: BuilderUIState | null;
  corrupted: boolean;
} {
  if (!canUseStorage()) return { ui: null, corrupted: false };
  const parsed = safeParse<unknown>(window.localStorage.getItem(UI_STORAGE_KEY));
  if (!parsed) {
    const hasRaw = window.localStorage.getItem(UI_STORAGE_KEY) !== null;
    return { ui: null, corrupted: hasRaw };
  }
  if (!isEnvelope<BuilderUIState>(parsed)) return { ui: null, corrupted: true };
  return { ui: parsed.data, corrupted: false };
}

export function savePersistedResume(resume: ResumeDocument) {
  if (!canUseStorage()) return;
  const payload: PersistedEnvelope<ResumeDocument> = { schemaVersion: 1, data: resume };
  window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(payload));
}

export function savePersistedUI(ui: BuilderUIState) {
  if (!canUseStorage()) return;
  const payload: PersistedEnvelope<BuilderUIState> = { schemaVersion: 1, data: ui };
  window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedState() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(RESUME_STORAGE_KEY);
  window.localStorage.removeItem(UI_STORAGE_KEY);
}

