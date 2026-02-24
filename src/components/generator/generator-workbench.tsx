"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { ResumePreviewShell } from "@/components/preview/resume-preview-shell";
import { createSampleResume } from "@/lib/sample-data";
import {
  buildTailoredResumeFromSelectedBullets,
  loadMasterResumeOrSample,
  pickInitialSelections,
  scoreBulletsAgainstJobDescription,
  type BulletMatch,
} from "@/lib/generator";
import { derivePreviewResume } from "@/lib/selectors";
import { getLocalRepositories } from "@/lib/stores";
import { emitToast } from "@/lib/toast-events";
import type { ResumeVersionRecord } from "@/types/data/platform";
import { SECTION_LABELS } from "@/types/resume";

type MobilePane = "controls" | "preview";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const SAMPLE_JOB_DESCRIPTIONS = [
  {
    label: "Product Intern",
    company: "Northstar Health",
    role: "Product Strategy Intern",
    text: `Northstar Health is seeking a Product Strategy Intern to support market analysis, roadmap planning, and cross-functional initiatives. Responsibilities include analyzing funnel data in SQL, building Excel models, synthesizing insights into presentations, partnering with engineering and operations, and communicating recommendations to stakeholders. Candidates should demonstrate strong problem solving, communication, data analysis, and project management skills.`,
  },
  {
    label: "Consulting Analyst",
    company: "Helio Advisory",
    role: "Analyst",
    text: `Helio Advisory is hiring an Analyst to support strategy engagements for growth-stage companies. The role includes market sizing, competitor benchmarking, customer research, synthesis of findings, and executive presentations. Ideal candidates have leadership experience, structured thinking, Excel proficiency, communication skills, and comfort working on fast-paced cross-functional teams.`,
  },
  {
    label: "Data/Product Analyst",
    company: "Pulse Labs",
    role: "Product Data Analyst Intern",
    text: `Pulse Labs is looking for a Product Data Analyst Intern to help evaluate user behavior, identify drop-off points, and support experiment design. You will query product data using SQL, create dashboards, present insights, and collaborate with product managers and engineers. Strong analytical thinking, SQL, Excel, communication, and stakeholder alignment are required.`,
  },
] as const;

export function GeneratorWorkbench() {
  const repositories = useMemo(() => getLocalRepositories(), []);
  const jobDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const [masterResume, setMasterResume] = useState(() => createSampleResume());
  const [jobDescription, setJobDescription] = useState("");
  const [versionName, setVersionName] = useState("Tailored Resume Draft");
  const [matches, setMatches] = useState<BulletMatch[]>([]);
  const [selectedBulletIds, setSelectedBulletIds] = useState<Set<string>>(new Set());
  const [draftResume, setDraftResume] = useState<ReturnType<
    typeof buildTailoredResumeFromSelectedBullets
  > | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [mobilePane, setMobilePane] = useState<MobilePane>("controls");
  const [hydrated, setHydrated] = useState(false);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersionRecord[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  const scrollPreviewIntoView = () => {
    window.setTimeout(() => {
      previewPaneRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 40);
  };

  useEffect(() => {
    // Client-only refresh to ensure latest builder changes from localStorage are picked up.
    setMasterResume(loadMasterResumeOrSample());
    setHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadVersions() {
      const rows = await repositories.resumeVersions.list();
      if (!cancelled) {
        setResumeVersions(rows);
      }
    }
    void loadVersions();
    return () => {
      cancelled = true;
    };
  }, [repositories]);

  useEffect(() => {
    if (!saveMessage) return;
    const timeout = window.setTimeout(() => setSaveMessage(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [saveMessage]);

  const selectedCount = selectedBulletIds.size;
  const positiveMatches = useMemo(
    () => matches.filter((match) => match.score > 0).length,
    [matches],
  );

  const liveDraftResume = useMemo(() => {
    if (!draftResume) return null;
    return buildTailoredResumeFromSelectedBullets(masterResume, selectedBulletIds, versionName);
  }, [draftResume, masterResume, selectedBulletIds, versionName]);

  const previewResume = useMemo(
    () => (liveDraftResume ? derivePreviewResume(liveDraftResume) : null),
    [liveDraftResume],
  );

  const topMatches = matches.slice(0, 40);

  const activeVersionRecord = useMemo(
    () => resumeVersions.find((version) => version.id === activeVersionId) ?? null,
    [resumeVersions, activeVersionId],
  );

  const handleMatch = () => {
    const nextMatches = scoreBulletsAgainstJobDescription(masterResume, jobDescription);
    setMatches(nextMatches);
    setSelectedBulletIds(pickInitialSelections(nextMatches));
    emitToast({
      tone: "info",
      title: "Bullets Matched",
      message: `Scored ${nextMatches.length} bullets against the pasted job description.`,
    });
  };

  const handleGenerate = () => {
    const draft = buildTailoredResumeFromSelectedBullets(
      masterResume,
      selectedBulletIds,
      versionName,
    );
    setDraftResume(draft);
    setActiveVersionId(null);
    setMobilePane("preview");
    scrollPreviewIntoView();
    emitToast({
      tone: "success",
      title: "Draft Generated",
      message: `Built a tailored resume draft with ${selectedBulletIds.size} selected bullets.`,
    });
  };

  const refreshResumeVersions = async () => {
    const rows = await repositories.resumeVersions.list();
    setResumeVersions(rows);
  };

  const handleSaveVersion = async () => {
    if (!liveDraftResume) return;
    setIsSavingVersion(true);
    try {
      const record: ResumeVersionRecord = {
        id: activeVersionId ?? "",
        versionName: (versionName || "Tailored Resume Draft").trim() || "Tailored Resume Draft",
        jobDescriptionSnapshot: jobDescription,
        selectedBulletIds: Array.from(selectedBulletIds),
        finalResumeContent: liveDraftResume,
        timestamp: new Date().toISOString(),
      };
      const saved = await repositories.resumeVersions.save(record);
      setActiveVersionId(saved.id);
      setVersionName(saved.versionName);
      setDraftResume(saved.finalResumeContent);
      await refreshResumeVersions();
      setSaveMessage("Version saved");
      emitToast({
        tone: "success",
        title: "Resume Version Saved",
        message: `"${saved.versionName}" was saved locally.`,
      });
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleShortcutEvent = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isTyping =
      tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (draftResume && !isSavingVersion) {
        void handleSaveVersion();
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "Enter") {
      event.preventDefault();
      if (selectedBulletIds.size > 0) handleGenerate();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (jobDescription.trim()) handleMatch();
      return;
    }

    if (!isTyping && event.key === "/") {
      event.preventDefault();
      jobDescriptionRef.current?.focus();
    }
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleShortcutEvent(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleOpenVersion = (version: ResumeVersionRecord) => {
    setActiveVersionId(version.id);
    setVersionName(version.versionName);
    setJobDescription(version.jobDescriptionSnapshot);
    setSelectedBulletIds(new Set(version.selectedBulletIds));
    setDraftResume(version.finalResumeContent);
    setMatches(
      scoreBulletsAgainstJobDescription(masterResume, version.jobDescriptionSnapshot),
    );
    setMobilePane("preview");
    scrollPreviewIntoView();
    emitToast({
      tone: "info",
      title: "Version Loaded",
      message: `Opened "${version.versionName}" for preview and export.`,
    });
  };

  const handleDeleteVersion = async (versionId: string) => {
    await repositories.resumeVersions.remove(versionId);
    if (activeVersionId === versionId) {
      setActiveVersionId(null);
    }
    await refreshResumeVersions();
    setSaveMessage("Version deleted");
    emitToast({
      tone: "warning",
      title: "Version Deleted",
      message: "Removed the saved resume version from local storage.",
    });
  };

  const reloadFromBuilder = () => {
    const next = loadMasterResumeOrSample();
    setMasterResume(next);
    setMatches([]);
    setSelectedBulletIds(new Set());
    setDraftResume(null);
    setActiveVersionId(null);
    emitToast({
      tone: "info",
      title: "Master Resume Reloaded",
      message: "Loaded the latest local master resume from the Builder.",
    });
  };

  const toggleBullet = (bulletId: string) => {
    setSelectedBulletIds((prev) => {
      const next = new Set(prev);
      if (next.has(bulletId)) {
        next.delete(bulletId);
      } else {
        next.add(bulletId);
      }
      return next;
    });
  };

  const selectTop = (count: number) => {
    const next = new Set(matches.slice(0, count).map((match) => match.bulletId));
    setSelectedBulletIds(next);
  };

  const clearSelection = () => setSelectedBulletIds(new Set());

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 shadow-[var(--shadow-soft)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Tailored Resume Generator
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl leading-tight text-[color:var(--text)] md:text-4xl">
              Match Job Descriptions to Your Master Resume
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--muted)] md:text-base">
              Paste a job description, rank your stored bullets by relevance, choose what to include,
              and generate a tailored one-page draft locally.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reloadFromBuilder}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2 text-sm font-medium text-[color:var(--text)]"
            >
              Reload from Builder
            </button>
            <span className="inline-flex items-center rounded-full bg-[color:var(--info-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent)]">
              {hydrated ? "Loaded local master resume" : "Loading local master resume..."}
            </span>
          </div>
        </div>
      </section>

      <div className="no-print flex items-center justify-between gap-2 lg:hidden">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-1">
            <button
              type="button"
              onClick={() => setMobilePane("controls")}
              className={classNames(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                mobilePane === "controls"
                  ? "bg-[color:var(--panel)] text-[color:var(--text)] shadow-[inset_0_0_0_1px_var(--border)]"
                  : "text-[color:var(--muted)]",
              )}
            >
              Matching
            </button>
            <button
              type="button"
              onClick={() => setMobilePane("preview")}
              className={classNames(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                mobilePane === "preview"
                  ? "bg-[color:var(--panel)] text-[color:var(--text)] shadow-[inset_0_0_0_1px_var(--border)]"
                  : "text-[color:var(--muted)]",
              )}
            >
              Preview
            </button>
          </div>
          <button
            type="button"
            onClick={handleMatch}
            disabled={!jobDescription.trim()}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm font-medium text-[color:var(--text)] disabled:opacity-50"
          >
            Match
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={selectedCount === 0}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm font-medium text-[color:var(--text)] disabled:opacity-50"
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => void handleSaveVersion()}
            disabled={!draftResume || isSavingVersion}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm font-medium text-[color:var(--text)] disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid min-h-[calc(100svh-16rem)] gap-4 lg:grid-cols-[minmax(420px,520px)_minmax(0,1fr)]">
        <section
          className={classNames(
            "min-h-0 flex-col rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-[var(--shadow-soft)]",
            mobilePane === "controls" ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="border-b border-[color:var(--border)] p-4">
            <div className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  Version name
                </span>
                <input
                  value={versionName}
                  onChange={(event) => setVersionName(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  Job description (paste text)
                </span>
                <textarea
                  ref={jobDescriptionRef}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  rows={8}
                  placeholder="Paste the job description here to match against your master resume bullets..."
                  className="min-h-40 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2.5 text-sm leading-6 text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                />
              </label>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                    Sample job descriptions
                  </span>
                  <span className="text-xs text-[color:var(--muted)]">
                    One-click demo content
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_JOB_DESCRIPTIONS.map((sample) => (
                    <button
                      key={`${sample.company}-${sample.role}`}
                      type="button"
                      onClick={() => {
                        setJobDescription(sample.text);
                        setVersionName(`${sample.company} - ${sample.role}`);
                        emitToast({
                          tone: "info",
                          title: "Sample Loaded",
                          message: `Inserted ${sample.label} sample job description.`,
                          durationMs: 1600,
                        });
                      }}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm font-medium text-[color:var(--text)] transition hover:border-[color:var(--border-strong)]"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleMatch}
                  disabled={!jobDescription.trim()}
                  className="rounded-xl border border-[color:var(--accent-strong)] bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Match Bullets
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={selectedCount === 0}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2 text-sm font-medium text-[color:var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Generate Draft
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveVersion()}
                  disabled={!draftResume || isSavingVersion}
                  className="rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--panel)] px-3 py-2 text-sm font-medium text-[color:var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingVersion ? "Saving..." : activeVersionId ? "Update Version" : "Save Version"}
                </button>
              </div>
              {saveMessage && (
                <p className="text-xs font-medium text-[color:var(--accent)]">{saveMessage}</p>
              )}
              <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 text-xs leading-5 text-[color:var(--muted)]">
                Demo flow: paste or load a sample JD, match bullets, generate a draft, then save a
                version. Shortcuts: <span className="font-semibold">/</span> focus JD,{" "}
                <span className="font-semibold">Ctrl/Cmd+Enter</span> match,{" "}
                <span className="font-semibold">Ctrl/Cmd+Shift+Enter</span> generate,{" "}
                <span className="font-semibold">Ctrl/Cmd+S</span> save version.
              </div>
            </div>
          </div>

          <div className="border-b border-[color:var(--border)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <MetricChip label="Master bullets" value={countMasterBullets(masterResume)} />
              <MetricChip label="Scored" value={matches.length} />
              <MetricChip label="Positive matches" value={positiveMatches} />
              <MetricChip label="Selected" value={selectedCount} tone="accent" />
              <MetricChip label="Saved Versions" value={resumeVersions.length} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => selectTop(8)}
                disabled={matches.length === 0}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)] disabled:opacity-50"
              >
                Select Top 8
              </button>
              <button
                type="button"
                onClick={() => selectTop(12)}
                disabled={matches.length === 0}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)] disabled:opacity-50"
              >
                Select Top 12
              </button>
              <button
                type="button"
                onClick={() => setSelectedBulletIds(new Set(matches.filter((m) => m.score > 0).map((m) => m.bulletId)))}
                disabled={matches.length === 0}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)] disabled:opacity-50"
              >
                Select Positive Scores
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedCount === 0}
                className="rounded-lg border border-[color:var(--warn-border)] bg-[color:var(--warn-soft)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--warn)] disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="border-b border-[color:var(--border)] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  Resume Versions
                </p>
                <p className="text-sm text-[color:var(--muted)]">
                  Saved local snapshots from generated drafts
                </p>
              </div>
              {activeVersionRecord && (
                <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent)]">
                  Active version loaded
                </span>
              )}
            </div>

            {resumeVersions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-3 text-sm text-[color:var(--muted)]">
                Generate a tailored draft, then click <span className="font-semibold">Save Version</span>.
                Saved versions keep the job description snapshot, selected bullet IDs, and final resume
                content for later reopening and export.
              </div>
            ) : (
              <div className="max-h-56 space-y-2 overflow-auto pr-1">
                {resumeVersions.map((version) => {
                  const isActive = activeVersionId === version.id;
                  return (
                    <article
                      key={version.id}
                      className={classNames(
                        "rounded-xl border p-3",
                        isActive
                          ? "border-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]/45"
                          : "border-[color:var(--border)] bg-[color:var(--panel-elevated)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--text)]">
                            {version.versionName}
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--muted)]">
                            {formatVersionTimestamp(version.timestamp)}
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--muted)]">
                            {version.selectedBulletIds.length} selected bullets | JD{" "}
                            {version.jobDescriptionSnapshot.trim().length} chars
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenVersion(version)}
                            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)]"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteVersion(version.id)}
                            className="rounded-lg border border-[color:var(--warn-border)] bg-[color:var(--warn-soft)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--warn)]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {version.jobDescriptionSnapshot.trim() && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[color:var(--muted)]">
                          {version.jobDescriptionSnapshot.trim()}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-4 text-sm leading-6 text-[color:var(--muted)]">
                Paste a job description and click <span className="font-semibold">Match Bullets</span>.
                The system will score bullets using keyword overlap plus your bullet tags (role type and
                skill tags).
              </div>
            ) : (
              <div className="space-y-3">
                {topMatches.map((match, index) => {
                  const checked = selectedBulletIds.has(match.bulletId);
                  return (
                    <article
                      key={match.bulletId}
                      className={classNames(
                        "rounded-2xl border p-3 transition",
                        checked
                          ? "border-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]/50"
                          : "border-[color:var(--border)] bg-[color:var(--panel-elevated)]",
                      )}
                    >
                      <div className="mb-2 flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBullet(match.bulletId)}
                          className="mt-1 h-4 w-4 accent-[color:var(--accent)]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[color:var(--panel)] px-2 py-0.5 text-xs font-semibold text-[color:var(--muted)]">
                              #{index + 1}
                            </span>
                            <span className="rounded-full bg-[color:var(--panel)] px-2 py-0.5 text-xs font-semibold text-[color:var(--text)]">
                              Score {match.score}
                            </span>
                            <span className="rounded-full bg-[color:var(--panel)] px-2 py-0.5 text-xs text-[color:var(--muted)]">
                              {SECTION_LABELS[match.sectionKey]}
                            </span>
                            <span className="rounded-full bg-[color:var(--panel)] px-2 py-0.5 text-xs text-[color:var(--muted)]">
                              {match.roleType}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[color:var(--text)]">
                            {match.entryTitle}
                            {match.organization ? ` | ${match.organization}` : ""}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[color:var(--text)]">
                            {match.bulletText}
                          </p>
                          {match.reasons.length > 0 && (
                            <p className="mt-2 text-xs text-[color:var(--muted)]">
                              {match.reasons.join(" | ")}
                            </p>
                          )}
                          {match.skillTags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {match.skillTags.map((tag) => (
                                <span
                                  key={`${match.bulletId}-${tag}`}
                                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-2 py-0.5 text-xs text-[color:var(--muted)]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {matches.length > topMatches.length && (
                  <p className="text-center text-xs text-[color:var(--muted)]">
                    Showing top {topMatches.length} of {matches.length} bullets.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <div
          ref={previewPaneRef}
          className={classNames(mobilePane === "preview" ? "block" : "hidden lg:block")}
        >
          {previewResume ? (
            <div className="grid h-full min-h-[32rem] gap-2 lg:grid-rows-[auto_minmax(0,1fr)]">
              <section className="no-print rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 shadow-[var(--shadow-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                      Draft
                    </p>
                    <p className="truncate text-sm font-semibold text-[color:var(--text)]">
                      {previewResume.versionName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[color:var(--panel-elevated)] px-2 py-1 text-xs font-medium text-[color:var(--muted)]">
                      {selectedBulletIds.size} bullets
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleSaveVersion()}
                      disabled={isSavingVersion}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-1.5 text-sm font-medium text-[color:var(--text)] disabled:opacity-60"
                    >
                      {isSavingVersion ? "Saving..." : activeVersionId ? "Update Version" : "Save Version"}
                    </button>
                  </div>
                </div>
                <p className="mt-1 truncate text-xs text-[color:var(--muted)]">
                  {activeVersionRecord
                    ? `Loaded saved version • ${formatVersionTimestamp(activeVersionRecord.timestamp)}`
                    : "Unsaved draft • save to reuse this version later"}
                </p>
              </section>

              <div className="min-h-0">
                <ResumePreviewShell
                  resume={previewResume}
                  zoomPercent={zoomPercent}
                  onZoomChange={setZoomPercent}
                />
              </div>
            </div>
          ) : (
            <div className="grid h-full min-h-[32rem] place-items-center rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 text-center shadow-[var(--shadow-soft)]">
              <div className="max-w-md">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Draft Preview
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-serif)] text-3xl text-[color:var(--text)]">
                  Generate a Tailored Draft
                </h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  Match bullets first, review the ranked results, then click{" "}
                  <span className="font-semibold text-[color:var(--text)]">Generate Draft</span>
                  . The preview will appear here and use the same exportable PDF view as the builder.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatVersionTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MetricChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "accent";
}) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "accent"
          ? "bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
          : "bg-[color:var(--panel-elevated)] text-[color:var(--muted)]",
      )}
    >
      <span>{label}</span>
      <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[11px] font-semibold text-[color:var(--text)]">
        {value}
      </span>
    </span>
  );
}

function countMasterBullets(resume: {
  experience: { bullets: unknown[] }[];
  projects: { bullets: unknown[] }[];
  leadership: { bullets: unknown[] }[];
}) {
  return [...resume.experience, ...resume.projects, ...resume.leadership].reduce(
    (sum, entry) => sum + entry.bullets.length,
    0,
  );
}
