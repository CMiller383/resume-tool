"use client";

import { useEffect, useMemo, useState } from "react";

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
import { SECTION_LABELS } from "@/types/resume";

type MobilePane = "controls" | "preview";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function GeneratorWorkbench() {
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

  useEffect(() => {
    // Client-only refresh to ensure latest builder changes from localStorage are picked up.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMasterResume(loadMasterResumeOrSample());
    setHydrated(true);
  }, []);

  const selectedCount = selectedBulletIds.size;
  const positiveMatches = useMemo(
    () => matches.filter((match) => match.score > 0).length,
    [matches],
  );

  const previewResume = useMemo(
    () => (draftResume ? derivePreviewResume(draftResume) : null),
    [draftResume],
  );

  const topMatches = matches.slice(0, 40);

  const handleMatch = () => {
    const nextMatches = scoreBulletsAgainstJobDescription(masterResume, jobDescription);
    setMatches(nextMatches);
    setSelectedBulletIds(pickInitialSelections(nextMatches));
  };

  const handleGenerate = () => {
    const draft = buildTailoredResumeFromSelectedBullets(
      masterResume,
      selectedBulletIds,
      versionName,
    );
    setDraftResume(draft);
    setMobilePane("preview");
  };

  const reloadFromBuilder = () => {
    const next = loadMasterResumeOrSample();
    setMasterResume(next);
    setMatches([]);
    setSelectedBulletIds(new Set());
    setDraftResume(null);
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
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  rows={8}
                  placeholder="Paste the job description here to match against your master resume bullets..."
                  className="min-h-40 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2.5 text-sm leading-6 text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                />
              </label>
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
              </div>
            </div>
          </div>

          <div className="border-b border-[color:var(--border)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <MetricChip label="Master bullets" value={countMasterBullets(masterResume)} />
              <MetricChip label="Scored" value={matches.length} />
              <MetricChip label="Positive matches" value={positiveMatches} />
              <MetricChip label="Selected" value={selectedCount} tone="accent" />
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

        <div className={classNames(mobilePane === "preview" ? "block" : "hidden lg:block")}>
          {previewResume ? (
            <ResumePreviewShell
              resume={previewResume}
              zoomPercent={zoomPercent}
              onZoomChange={setZoomPercent}
            />
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

function countMasterBullets(resume: { experience: { bullets: unknown[] }[]; projects: { bullets: unknown[] }[]; leadership: { bullets: unknown[] }[] }) {
  return [...resume.experience, ...resume.projects, ...resume.leadership].reduce(
    (sum, entry) => sum + entry.bullets.length,
    0,
  );
}
