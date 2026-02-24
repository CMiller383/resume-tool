"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import {
  RESUME_EXPORT_EVENT,
  exportResumeElementToPdf,
} from "@/lib/export-pdf";
import { emitToast } from "@/lib/toast-events";
import type { PreviewResume } from "@/lib/selectors";

import { ResumePage } from "./resume-page";

type ResumePreviewShellProps = {
  resume: PreviewResume;
  zoomPercent: number;
  onZoomChange: (nextZoom: number) => void;
};

const ZOOMS = [75, 90, 100, 110, 125];
const BASE_WIDTH = 816;
const BASE_HEIGHT = 1056;

function formatExportError(error: unknown) {
  if (error instanceof Error) {
    const stack = error.stack ? `\n\nStack:\n${error.stack}` : "";
    return `${error.name}: ${error.message}${stack}`;
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export function ResumePreviewShell({
  resume,
  zoomPercent,
  onZoomChange,
}: ResumePreviewShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportDebugError, setExportDebugError] = useState<string | null>(null);
  const scale = zoomPercent / 100;

  const handleExport = async (requestedFileName?: string) => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);
    setExportDebugError(null);
    try {
      const exportTarget =
        (contentRef.current.closest("[data-resume-page]") as HTMLElement | null) ??
        contentRef.current;
      const savedName = await exportResumeElementToPdf(exportTarget, {
        fileName: requestedFileName || resume.versionName,
      });
      emitToast({
        tone: "success",
        title: "PDF Exported",
        message: `Saved ${savedName}`,
      });
    } catch (error) {
      const formatted = formatExportError(error);
      const targetInfo = contentRef.current
        ? `\n\nDebug:\nzoom=${zoomPercent}\ndevicePixelRatio=${window.devicePixelRatio}\ncontentNode=${contentRef.current.tagName}.${contentRef.current.className}`
        : "";
      const fullDiagnostic = `${formatted}${targetInfo}`;

      setExportDebugError(fullDiagnostic);
      console.error("[Resume PDF Export] Failed", error);
      emitToast({
        tone: "error",
        title: "Export Failed",
        message:
          error instanceof Error
            ? `Could not generate PDF: ${error.message}`
            : "Could not generate the PDF. See export debug panel.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportEvent = useEffectEvent((requestedFileName?: string) => {
    void handleExport(requestedFileName);
  });

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const check = () => {
      setIsOverflowing(node.scrollHeight > node.clientHeight + 2);
    };

    check();
    const observer = new ResizeObserver(() => check());
    observer.observe(node);
    const mutation = new MutationObserver(() => check());
    mutation.observe(node, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, [resume]);

  useEffect(() => {
    const onExportRequest = (event: Event) => {
      const custom = event as CustomEvent<{ fileName?: string }>;
      handleExportEvent(custom.detail?.fileName);
    };
    window.addEventListener(RESUME_EXPORT_EVENT, onExportRequest as EventListener);
    return () => window.removeEventListener(RESUME_EXPORT_EVENT, onExportRequest);
  }, []);

  const previewMeta = useMemo(
    () => ({
      dimensions: {
        width: `${BASE_WIDTH * scale}px`,
        height: `${BASE_HEIGHT * scale}px`,
      },
    }),
    [scale],
  );

  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-[var(--shadow-soft)] print:border-0 print:bg-transparent print:shadow-none">
      <div className="no-print flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Resume Preview
          </p>
          <p className="text-sm text-[color:var(--muted)]">
            US Letter | 1 page target
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-2 py-1 text-xs font-medium text-[color:var(--muted)] sm:inline-flex">
            Page 1 / 1
          </span>
          <label className="sr-only" htmlFor="zoom-select">
            Preview zoom
          </label>
          <select
            id="zoom-select"
            value={zoomPercent}
            onChange={(event) => onZoomChange(Number(event.target.value))}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-2.5 py-2 text-sm text-[color:var(--text)] outline-none ring-0 focus:border-[color:var(--accent)]"
          >
            {ZOOMS.map((zoom) => (
              <option key={zoom} value={zoom}>
                {zoom}%
              </option>
            ))}
          </select>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isExporting}
              className="rounded-lg border border-[color:var(--accent-strong)] bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="no-print flex items-center justify-between gap-3 border-b border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[color:var(--danger-soft)] px-2.5 py-1 text-xs font-medium text-[color:var(--danger)]">
            {isOverflowing ? "Overflowing" : "Within 1 page"}
          </span>
          {isOverflowing && (
            <span className="text-xs text-[color:var(--muted)]">
              Deselect bullets or shorten text to fit one page.
            </span>
          )}
        </div>
        <p className="text-xs text-[color:var(--muted)]">
          Preview updates live as you edit sections
        </p>
      </div>

      {exportDebugError && (
        <div className="no-print border-b border-[color:var(--danger)]/20 bg-[color:var(--danger-soft)] px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--danger)]">
              Export Debug (send this back)
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportDebugError);
                  emitToast({
                    tone: "info",
                    title: "Copied",
                    message: "Export debug text copied to clipboard.",
                    durationMs: 1400,
                  });
                } catch {
                  // Ignore clipboard failures; text is still visible in the panel.
                }
              }}
              className="rounded-lg border border-[color:var(--danger)]/25 bg-white/70 px-2.5 py-1 text-xs font-medium text-[color:var(--danger)]"
            >
              Copy
            </button>
          </div>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[color:var(--danger)]/15 bg-white/65 p-2 text-[11px] leading-4 text-[color:var(--danger)]">
            {exportDebugError}
          </pre>
        </div>
      )}

      <div className="preview-workspace min-h-0 flex-1 overflow-auto p-4 md:p-6 print:overflow-visible print:p-0">
        <div className="mx-auto flex w-full min-w-max justify-center print:min-w-0">
          <div
            className="preview-page-frame print:w-auto print:h-auto"
            style={{
              width: previewMeta.dimensions.width,
              height: previewMeta.dimensions.height,
            }}
          >
            <div
              data-preview-scaled
              className="origin-top-left transition-transform duration-200 motion-reduce:transition-none"
              style={{ transform: `scale(${scale})`, width: `${BASE_WIDTH}px`, height: `${BASE_HEIGHT}px` }}
            >
              <ResumePage ref={contentRef} resume={resume} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


