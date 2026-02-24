"use client";

export const RESUME_EXPORT_EVENT = "resume-tool:export-request";

type ExportRequestDetail = {
  fileName?: string;
};

export function requestResumePdfExport(detail?: ExportRequestDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ExportRequestDetail>(RESUME_EXPORT_EVENT, { detail }));
}

function sanitizeFileName(input: string) {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "resume";
}

export function buildResumePdfFileName(name?: string) {
  const base = sanitizeFileName(name ?? "resume");
  return base.endsWith(".pdf") ? base : `${base}.pdf`;
}

export async function exportResumeElementToPdf(
  element: HTMLElement,
  options?: { fileName?: string },
) {
  if (typeof window === "undefined") return;

  if ("fonts" in document) {
    try {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    } catch {
      // Continue even if font readiness fails.
    }
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale,
    useCORS: true,
    logging: false,
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  pdf.save(buildResumePdfFileName(options?.fileName));
}

