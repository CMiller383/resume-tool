"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useRef, useState, type RefObject } from "react";

import { derivePreviewResume } from "@/lib/selectors";
import { getLocalRepositories } from "@/lib/stores";
import { emitToast } from "@/lib/toast-events";
import { buildResumePdfFileName } from "@/lib/export-pdf";
import {
  APPLICATION_STATUSES,
  type ApplicationRecord,
  type ApplicationStatus,
  type ResumeVersionRecord,
} from "@/types/data/platform";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyApplicationDraft(): ApplicationRecord {
  return {
    id: "",
    company: "",
    role: "",
    jobLink: "",
    dateApplied: todayDateInputValue(),
    status: "Wishlist",
    resumeVersionId: null,
    notes: "",
    jobDescriptionSnapshot: "",
  };
}

function cloneApplication(record: ApplicationRecord): ApplicationRecord {
  return {
    ...record,
    jobDescriptionSnapshot: record.jobDescriptionSnapshot ?? "",
  };
}

type MobilePane = "table" | "details";

export function ApplicationsWorkbench() {
  const repositories = useMemo(() => getLocalRepositories(), []);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersionRecord[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ApplicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<MobilePane>("table");

  const selectedApplication = useMemo(
    () => applications.find((app) => app.id === selectedApplicationId) ?? null,
    [applications, selectedApplicationId],
  );

  const linkedVersion = useMemo(() => {
    if (!draft?.resumeVersionId) return null;
    return resumeVersions.find((version) => version.id === draft.resumeVersionId) ?? null;
  }, [resumeVersions, draft?.resumeVersionId]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setIsLoading(true);
      const [loadedApplications, loadedVersions] = await Promise.all([
        repositories.applications.list(),
        repositories.resumeVersions.list(),
      ]);
      if (cancelled) return;
      setApplications(loadedApplications);
      setResumeVersions(loadedVersions);

      if (loadedApplications.length > 0) {
        setSelectedApplicationId(loadedApplications[0].id);
        setDraft(cloneApplication(loadedApplications[0]));
      } else {
        setSelectedApplicationId(null);
        setDraft(createEmptyApplicationDraft());
      }
      setIsLoading(false);
    }
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [repositories]);

  useEffect(() => {
    if (!flashMessage) return;
    const timeout = window.setTimeout(() => setFlashMessage(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  const versionById = useMemo(
    () => new Map(resumeVersions.map((version) => [version.id, version] as const)),
    [resumeVersions],
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!draft) return false;
    if (!selectedApplication) return true;
    return JSON.stringify(cloneApplication(selectedApplication)) !== JSON.stringify(draft);
  }, [draft, selectedApplication]);

  const refreshApplications = async () => {
    const rows = await repositories.applications.list();
    setApplications(rows);
    return rows;
  };

  const refreshResumeVersions = async () => {
    const rows = await repositories.resumeVersions.list();
    setResumeVersions(rows);
    return rows;
  };

  const handleNew = () => {
    setSelectedApplicationId(null);
    setDraft(createEmptyApplicationDraft());
    setMobilePane("details");
    window.setTimeout(() => companyInputRef.current?.focus(), 60);
    emitToast({
      tone: "info",
      title: "New Application",
      message: "Started a new application draft.",
      durationMs: 1400,
    });
  };

  const handleSelectApplication = (record: ApplicationRecord) => {
    setSelectedApplicationId(record.id);
    setDraft(cloneApplication(record));
    setMobilePane("details");
  };

  const handleDraftField = <K extends keyof ApplicationRecord>(
    key: K,
    value: ApplicationRecord[K],
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleLinkVersion = (versionId: string) => {
    if (!draft) return;
    if (!versionId) {
      setDraft({ ...draft, resumeVersionId: null });
      return;
    }
    const version = versionById.get(versionId) ?? null;
    const existingSnapshot = (draft.jobDescriptionSnapshot ?? "").trim();
    setDraft({
      ...draft,
      resumeVersionId: versionId,
      jobDescriptionSnapshot: existingSnapshot
        ? draft.jobDescriptionSnapshot ?? ""
        : (version?.jobDescriptionSnapshot ?? ""),
    });
  };

  const handleRefreshSnapshotFromVersion = () => {
    if (!draft || !linkedVersion) return;
    setDraft({
      ...draft,
      jobDescriptionSnapshot: linkedVersion.jobDescriptionSnapshot,
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const linked = draft.resumeVersionId ? versionById.get(draft.resumeVersionId) ?? null : null;
      const payload: ApplicationRecord = {
        ...draft,
        id: draft.id || "",
        company: draft.company.trim(),
        role: draft.role.trim(),
        jobLink: draft.jobLink.trim(),
        notes: draft.notes.trim(),
        jobDescriptionSnapshot:
          (draft.jobDescriptionSnapshot ?? "").trim() ||
          linked?.jobDescriptionSnapshot ||
          "",
      };

      const saved = await repositories.applications.save(payload);
      await refreshApplications();
      await refreshResumeVersions();
      setSelectedApplicationId(saved.id);
      setDraft(cloneApplication(saved));
      setFlashMessage(saved.id === draft.id && draft.id ? "Application updated" : "Application saved");
      setMobilePane("details");
      emitToast({
        tone: "success",
        title: saved.id === draft.id && draft.id ? "Application Updated" : "Application Saved",
        message: `${saved.company || "Application"} ${saved.role ? `- ${saved.role}` : ""}`.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft?.id) return;
    const deletingId = draft.id;
    await repositories.applications.remove(deletingId);
    const rows = await refreshApplications();
    if (rows.length > 0) {
      setSelectedApplicationId(rows[0].id);
      setDraft(cloneApplication(rows[0]));
    } else {
      setSelectedApplicationId(null);
      setDraft(createEmptyApplicationDraft());
    }
    setFlashMessage("Application deleted");
    setMobilePane("table");
    emitToast({
      tone: "warning",
      title: "Application Deleted",
      message: "Removed the application from local tracking.",
    });
  };

  const handleResetDraft = () => {
    if (selectedApplication) {
      setDraft(cloneApplication(selectedApplication));
      setFlashMessage("Changes discarded");
      emitToast({
        tone: "info",
        title: "Changes Discarded",
        message: "Reverted to the saved application values.",
        durationMs: 1500,
      });
      return;
    }
    setDraft(createEmptyApplicationDraft());
  };

  const handleShortcutEvent = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isTyping =
      tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void handleSave();
      return;
    }

    if (!isTyping && event.key.toLowerCase() === "n") {
      event.preventDefault();
      handleNew();
      return;
    }

    if (!isTyping && event.key === "/") {
      event.preventDefault();
      setMobilePane("details");
      window.setTimeout(() => companyInputRef.current?.focus(), 40);
    }
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleShortcutEvent(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 shadow-[var(--shadow-soft)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Application Tracker
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl leading-tight text-[color:var(--text)] md:text-4xl">
              Track Every Application and the Resume Version Used
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--muted)] md:text-base">
              Local-only MVP tracker with linked resume versions, stored job description snapshots,
              and a details panel for quick updates before backend sync is added.
            </p>
            <div className="mt-3 rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2.5 text-xs leading-5 text-[color:var(--muted)]">
              Demo tip: save a few resume versions in <span className="font-semibold">Generator</span>,
              then link them here. Shortcuts: <span className="font-semibold">N</span> new
              application, <span className="font-semibold">/</span> focus details,{" "}
              <span className="font-semibold">Ctrl/Cmd+S</span> save.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refreshResumeVersions()}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2 text-sm font-medium text-[color:var(--text)]"
            >
              Refresh Resume Versions
            </button>
            <button
              type="button"
              onClick={handleNew}
              className="rounded-xl border border-[color:var(--accent-strong)] bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white"
            >
              + New Application
            </button>
          </div>
        </div>
      </section>

      <div className="no-print flex items-center gap-2 lg:hidden">
        <div className="inline-flex rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-1">
          <button
            type="button"
            onClick={() => setMobilePane("table")}
            className={classNames(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              mobilePane === "table"
                ? "bg-[color:var(--panel)] text-[color:var(--text)] shadow-[inset_0_0_0_1px_var(--border)]"
                : "text-[color:var(--muted)]",
            )}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setMobilePane("details")}
            className={classNames(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              mobilePane === "details"
                ? "bg-[color:var(--panel)] text-[color:var(--text)] shadow-[inset_0_0_0_1px_var(--border)]"
                : "text-[color:var(--muted)]",
            )}
          >
            Details
          </button>
        </div>
        {flashMessage && (
          <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent)]">
            {flashMessage}
          </span>
        )}
      </div>

      <div className="grid min-h-[calc(100svh-16rem)] gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <section
          className={classNames(
            "min-h-0 rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-[var(--shadow-soft)]",
            mobilePane === "table" ? "block" : "hidden lg:block",
          )}
        >
          <ApplicationsTablePane
            applications={applications}
            isLoading={isLoading}
            selectedApplicationId={selectedApplicationId}
            versionById={versionById}
            flashMessage={flashMessage}
            onSelect={handleSelectApplication}
            onNew={handleNew}
          />
        </section>

        <section
          className={classNames(
            "min-h-0 rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-[var(--shadow-soft)]",
            mobilePane === "details" ? "block" : "hidden lg:block",
          )}
        >
          <ApplicationDetailPane
            draft={draft}
            linkedVersion={linkedVersion}
            resumeVersions={resumeVersions}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            onFieldChange={handleDraftField}
            onLinkVersion={handleLinkVersion}
            onRefreshSnapshotFromVersion={handleRefreshSnapshotFromVersion}
            onSave={handleSave}
            onDelete={handleDelete}
            onReset={handleResetDraft}
            companyInputRef={companyInputRef}
          />
        </section>
      </div>
    </div>
  );
}

type ApplicationsTablePaneProps = {
  applications: ApplicationRecord[];
  isLoading: boolean;
  selectedApplicationId: string | null;
  versionById: Map<string, ResumeVersionRecord>;
  flashMessage: string | null;
  onSelect: (record: ApplicationRecord) => void;
  onNew: () => void;
};

function ApplicationsTablePane({
  applications,
  isLoading,
  selectedApplicationId,
  versionById,
  flashMessage,
  onSelect,
  onNew,
}: ApplicationsTablePaneProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Applications
          </p>
          <p className="text-sm text-[color:var(--muted)]">
            Company, role, status, linked resume version, and notes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {flashMessage && (
            <span className="hidden rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent)] md:inline-flex">
              {flashMessage}
            </span>
          )}
          <button
            type="button"
            onClick={onNew}
            className="rounded-xl border border-[color:var(--accent-strong)] bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white"
          >
            + New
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 text-sm text-[color:var(--muted)]">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-4">
            <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-4 text-sm leading-6 text-[color:var(--muted)]">
              No applications yet. Create one and link it to a saved resume version from{" "}
              <Link href="/generator" className="font-semibold text-[color:var(--accent)] underline">
                Generator
              </Link>
              .
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 p-3 lg:hidden">
              {applications.map((app) => {
                const selected = app.id === selectedApplicationId;
                const linkedVersion = app.resumeVersionId
                  ? versionById.get(app.resumeVersionId) ?? null
                  : null;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => onSelect(app)}
                    className={classNames(
                      "w-full rounded-2xl border p-3 text-left transition",
                      selected
                        ? "border-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]/55"
                        : "border-[color:var(--border)] bg-[color:var(--panel-elevated)]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--text)]">
                          {app.company || "Untitled"}
                        </p>
                        <p className="truncate text-xs text-[color:var(--muted)]">
                          {app.role || "No role specified"}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-[color:var(--muted)]">
                      <p>Date: {app.dateApplied || "-"}</p>
                      <p className="truncate">Version: {linkedVersion?.versionName || "Unlinked"}</p>
                      {app.jobLink && <p className="truncate">Link: {simplifyUrl(app.jobLink)}</p>}
                      {app.notes && <p className="truncate">Notes: {app.notes}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="hidden min-w-[980px] lg:block">
              <div className="grid grid-cols-[1.2fr_1.1fr_1fr_0.8fr_0.9fr_1.2fr_1.6fr] gap-3 border-b border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--muted)]">
                <span>Company</span>
                <span>Role</span>
                <span>Job Link</span>
                <span>Date Applied</span>
                <span>Status</span>
                <span>Resume Version</span>
                <span>Notes</span>
              </div>
              <div className="divide-y divide-[color:var(--border)]">
                {applications.map((app) => {
                  const selected = app.id === selectedApplicationId;
                  const linkedVersion = app.resumeVersionId
                    ? versionById.get(app.resumeVersionId) ?? null
                    : null;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => onSelect(app)}
                      className={classNames(
                        "grid w-full grid-cols-[1.2fr_1.1fr_1fr_0.8fr_0.9fr_1.2fr_1.6fr] gap-3 px-4 py-3 text-left transition hover:bg-[color:var(--panel-elevated)]",
                        selected && "bg-[color:var(--accent-soft)]/55",
                      )}
                    >
                      <span className="truncate text-sm font-semibold text-[color:var(--text)]">
                        {app.company || "Untitled"}
                      </span>
                      <span className="truncate text-sm text-[color:var(--text)]">
                        {app.role || "-"}
                      </span>
                      <span className="truncate text-sm text-[color:var(--muted)]">
                        {app.jobLink ? simplifyUrl(app.jobLink) : "-"}
                      </span>
                      <span className="truncate text-sm text-[color:var(--muted)]">
                        {app.dateApplied || "-"}
                      </span>
                      <span>
                        <StatusBadge status={app.status} />
                      </span>
                      <span className="truncate text-sm text-[color:var(--muted)]">
                        {linkedVersion?.versionName || "Unlinked"}
                      </span>
                      <span className="truncate text-sm text-[color:var(--muted)]">
                        {app.notes || "-"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type ApplicationDetailPaneProps = {
  draft: ApplicationRecord | null;
  linkedVersion: ResumeVersionRecord | null;
  resumeVersions: ResumeVersionRecord[];
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onFieldChange: <K extends keyof ApplicationRecord>(
    key: K,
    value: ApplicationRecord[K],
  ) => void;
  onLinkVersion: (versionId: string) => void;
  onRefreshSnapshotFromVersion: () => void;
  onSave: () => void;
  onDelete: () => void;
  onReset: () => void;
  companyInputRef: RefObject<HTMLInputElement | null>;
};

function ApplicationDetailPane({
  draft,
  linkedVersion,
  resumeVersions,
  hasUnsavedChanges,
  isSaving,
  onFieldChange,
  onLinkVersion,
  onRefreshSnapshotFromVersion,
  onSave,
  onDelete,
  onReset,
  companyInputRef,
}: ApplicationDetailPaneProps) {
  if (!draft) {
    return (
      <div className="grid h-full min-h-[24rem] place-items-center p-6 text-center">
        <div className="max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Application Details
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-serif)] text-2xl text-[color:var(--text)]">
            Select an Application
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Choose a row from the tracker table or create a new application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[color:var(--border)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
              Application Detail
            </p>
            <p className="text-sm font-semibold text-[color:var(--text)]">
              {draft.company || "New Application"}
              {draft.role ? ` | ${draft.role}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="rounded-full bg-[color:var(--warn-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--warn)]">
                Unsaved changes
              </span>
            )}
            {!hasUnsavedChanges && (
              <span className="rounded-full bg-[color:var(--success-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--success)]">
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <div className="space-y-4">
          <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[color:var(--text)]">
              Application Info
            </h3>
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Company"
                  value={draft.company}
                  onChange={(value) => onFieldChange("company", value)}
                  placeholder="Northstar Health"
                  inputRef={companyInputRef}
                />
                <TextField
                  label="Role"
                  value={draft.role}
                  onChange={(value) => onFieldChange("role", value)}
                  placeholder="Product Intern"
                />
              </div>

              <TextField
                label="Job Link"
                value={draft.jobLink}
                onChange={(value) => onFieldChange("jobLink", value)}
                placeholder="https://company.com/jobs/..."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Date Applied"
                  value={draft.dateApplied}
                  onChange={(value) => onFieldChange("dateApplied", value)}
                  type="date"
                />
                <SelectField<ApplicationStatus>
                  label="Status"
                  value={draft.status}
                  options={[...APPLICATION_STATUSES]}
                  onChange={(value) => onFieldChange("status", value)}
                />
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  Notes
                </span>
                <textarea
                  value={draft.notes}
                  onChange={(event) => onFieldChange("notes", event.target.value)}
                  rows={3}
                  placeholder="Interview round notes, referral info, timing, etc."
                  className="min-h-24 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 text-sm leading-6 text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--text)]">
                  Linked Resume Version
                </h3>
                <p className="text-xs text-[color:var(--muted)]">
                  Choose which generated version was used for this application
                </p>
              </div>
              <Link
                href="/generator"
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)]"
              >
                Open Generator
              </Link>
            </div>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                Resume version used
              </span>
              <select
                value={draft.resumeVersionId ?? ""}
                onChange={(event) => onLinkVersion(event.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
              >
                <option value="">Unlinked</option>
                {resumeVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.versionName} ({formatTimestamp(version.timestamp)})
                  </option>
                ))}
              </select>
            </label>

            {resumeVersions.length === 0 && (
              <p className="mt-2 text-xs text-[color:var(--warn)]">
                No saved resume versions yet. Create and save one in Generator first.
              </p>
            )}

            <div className="mt-4">
              {linkedVersion ? (
                <ResumeVersionSummaryCard version={linkedVersion} />
              ) : (
                <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel)] p-3 text-sm text-[color:var(--muted)]">
                  No resume version linked to this application yet.
                </div>
              )}
            </div>
            {linkedVersion && (
              <p className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-xs text-[color:var(--muted)]">
                Suggested export filename:{" "}
                <span className="font-semibold text-[color:var(--text)]">
                  {suggestApplicationExportFileName(
                    draft.company,
                    draft.role,
                    draft.dateApplied,
                    linkedVersion.versionName,
                  )}
                </span>
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--text)]">
                  Stored Job Description Snapshot
                </h3>
                <p className="text-xs text-[color:var(--muted)]">
                  Saved with the application so the exact context is preserved
                </p>
              </div>
              <button
                type="button"
                onClick={onRefreshSnapshotFromVersion}
                disabled={!linkedVersion}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Load from linked version
              </button>
            </div>
            <textarea
              value={draft.jobDescriptionSnapshot ?? ""}
              onChange={(event) => onFieldChange("jobDescriptionSnapshot", event.target.value)}
              rows={8}
              placeholder="Paste or retain the job description used when you applied."
              className="min-h-40 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 text-sm leading-6 text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
            />
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              {`${(draft.jobDescriptionSnapshot ?? "").trim().length} characters`}
            </p>
          </section>
        </div>
      </div>

      <div className="border-t border-[color:var(--border)] px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={isSaving}
            className="rounded-xl border border-[color:var(--accent-strong)] bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Application"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm font-medium text-[color:var(--text)]"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={!draft.id}
            className="rounded-xl border border-[color:var(--warn-border)] bg-[color:var(--warn-soft)] px-3 py-2 text-sm font-medium text-[color:var(--warn)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete Application
          </button>
        </div>
      </div>
    </div>
  );
}

function ResumeVersionSummaryCard({ version }: { version: ResumeVersionRecord }) {
  const preview = derivePreviewResume(version.finalResumeContent);
  const counts = {
    educationEntries: preview.education.length,
    experienceEntries: preview.experience.length,
    projectEntries: preview.projects.length,
    leadershipEntries: preview.leadership.length,
    selectedBullets:
      [...preview.education, ...preview.experience, ...preview.projects, ...preview.leadership].reduce(
        (sum, entry) => sum + entry.bullets.length,
        0,
      ),
    skillItems: preview.skills.reduce((sum, group) => sum + group.items.length, 0),
  };

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[color:var(--text)]">{version.versionName}</p>
          <p className="text-xs text-[color:var(--muted)]">
            Saved {formatTimestamp(version.timestamp)}
          </p>
        </div>
        <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent)]">
          {version.selectedBulletIds.length} selected bullets
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <SummaryStat label="Education" value={counts.educationEntries} />
        <SummaryStat label="Experience" value={counts.experienceEntries} />
        <SummaryStat label="Projects" value={counts.projectEntries} />
        <SummaryStat label="Leadership" value={counts.leadershipEntries} />
        <SummaryStat label="Skills" value={counts.skillItems} />
      </div>

      {preview.summary.selected && preview.summary.text && (
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-[color:var(--muted)]">
          {preview.summary.text}
        </p>
      )}

      {version.jobDescriptionSnapshot.trim() && (
        <details className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-[color:var(--text)]">
            View saved JD snapshot preview
          </summary>
          <p className="mt-2 line-clamp-4 text-xs leading-5 text-[color:var(--muted)]">
            {version.jobDescriptionSnapshot.trim()}
          </p>
        </details>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[color:var(--text)]">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
        {label}
      </span>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const tones: Record<ApplicationStatus, string> = {
    Wishlist: "bg-[color:var(--warn-soft)] text-[color:var(--warn)]",
    Applied: "bg-[color:var(--info-soft)] text-[color:var(--accent)]",
    Interview: "bg-[color:var(--accent-soft)] text-[color:var(--accent)]",
    Offer: "bg-[color:var(--success-soft)] text-[color:var(--success)]",
    Rejected: "bg-[color:var(--danger-soft)] text-[color:var(--danger)]",
  };
  return (
    <span className={classNames("rounded-full px-2 py-0.5 text-xs font-semibold", tones[status])}>
      {status}
    </span>
  );
}

function simplifyUrl(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function suggestApplicationExportFileName(
  company: string,
  role: string,
  dateApplied: string,
  fallbackVersionName: string,
) {
  const base = [company, role, dateApplied].filter((part) => part.trim()).join(" ");
  return buildResumePdfFileName(base || fallbackVersionName);
}
