"use client";

import { useEffect, useMemo, useState } from "react";

import { ResumePreviewShell } from "@/components/preview/resume-preview-shell";
import { useResumeBuilderState } from "@/hooks/use-resume-builder-state";
import { countSelectedForSection, derivePreviewResume } from "@/lib/selectors";
import {
  ENTRY_SECTION_KEYS,
  ROLE_TYPE_TAGS,
  SECTION_KEYS,
  SECTION_LABELS,
  SKILL_TAGS,
} from "@/types/resume";
import type {
  ResumeBullet,
  ResumeEntry,
  ResumeSectionKey,
  RoleTypeTag,
  SkillGroup,
  SkillTag,
} from "@/types/resume";

type MobilePane = "builder" | "preview";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function entryMatchesSearch(entry: ResumeEntry, query: string) {
  if (!query) return true;
  const haystack = [
    entry.title,
    entry.organization,
    entry.location,
    entry.startDate,
    entry.endDate,
    ...entry.bullets.map((bullet) => bullet.text),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function bulletMatchesSearch(bullet: ResumeBullet, query: string) {
  if (!query) return true;
  return (
    bullet.text.toLowerCase().includes(query) ||
    bullet.roleType.toLowerCase().includes(query) ||
    bullet.skillTags.some((tag) => tag.toLowerCase().includes(query))
  );
}

export function ResumeBuilderApp() {
  const { resume, ui, saveStatus, loadWarning, actions } = useResumeBuilderState();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobilePane, setMobilePane] = useState<MobilePane>("builder");
  const query = normalizeSearch(searchQuery);

  const previewResume = useMemo(() => derivePreviewResume(resume), [resume]);

  useEffect(() => {
    const handler = () => {
      actions.resetToSample();
    };
    window.addEventListener("resume-tool:reset-request", handler);
    return () => window.removeEventListener("resume-tool:reset-request", handler);
  }, [actions]);

  const selectedCounts = useMemo(
    () =>
      Object.fromEntries(
        SECTION_KEYS.map((sectionKey) => [
          sectionKey,
          countSelectedForSection(resume, sectionKey),
        ]),
      ) as Record<ResumeSectionKey, number>,
    [resume],
  );

  return (
    <div
      id="builder-page"
      className="min-h-[calc(100svh-5.5rem)] rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-2 shadow-[var(--shadow-soft)] md:p-3 print:min-h-0 print:border-0 print:bg-transparent print:p-0 print:shadow-none"
    >
      <div className="no-print mb-3 flex items-center justify-between gap-2 lg:hidden">
        <div className="inline-flex rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-1">
          <button
            type="button"
            onClick={() => setMobilePane("builder")}
            className={classNames(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              mobilePane === "builder"
                ? "bg-[color:var(--panel)] text-[color:var(--text)] shadow-[inset_0_0_0_1px_var(--border)]"
                : "text-[color:var(--muted)]",
            )}
          >
            Builder
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
          onClick={() => window.print()}
          className="rounded-xl border border-[color:var(--accent-strong)] bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white"
        >
          Export PDF
        </button>
      </div>

      <div
        id="builder-layout"
        className="grid min-h-[calc(100svh-9rem)] gap-3 lg:min-h-[calc(100svh-8.25rem)] lg:grid-cols-[minmax(420px,480px)_minmax(0,1fr)] print:block print:min-h-0"
      >
        <section
          className={classNames(
            "no-print min-h-0 flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] shadow-[var(--shadow-soft)] lg:flex",
            mobilePane === "builder" ? "flex" : "hidden lg:flex",
          )}
        >
          <BuilderSidebarHeader
            versionName={resume.versionName}
            searchQuery={searchQuery}
            saveStatus={saveStatus}
            showTagFilters={ui.showTagFilters}
            onVersionNameChange={actions.setVersionName}
            onSearchQueryChange={setSearchQuery}
            onToggleTagFilters={actions.toggleTagFilters}
            onReset={actions.resetToSample}
          />

          <div className="border-b border-[color:var(--border)] px-3 py-3">
            <SectionNav
              activeSection={ui.activeSection}
              selectedCounts={selectedCounts}
              onSelectSection={actions.setActiveSection}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-auto px-3 py-3">
            {loadWarning && (
              <div className="rounded-2xl border border-[color:var(--warn-border)] bg-[color:var(--warn-soft)] px-4 py-3 text-sm text-[color:var(--warn)]">
                {loadWarning}
                <button
                  type="button"
                  onClick={actions.dismissLoadWarning}
                  className="ml-2 underline decoration-current underline-offset-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            <SectionCard
              section="personal"
              activeSection={ui.activeSection}
              expanded={ui.expandedSectionIds.includes("section-personal")}
              count={selectedCounts.personal}
              onSetActive={actions.setActiveSection}
              onToggleExpanded={actions.toggleExpanded}
              onSelectAll={() => actions.setAllInSection("personal", true)}
              onDeselectAll={() => actions.setAllInSection("personal", false)}
            >
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5">
                  <span className="text-sm font-medium text-[color:var(--text)]">
                    Include in preview
                  </span>
                  <input
                    type="checkbox"
                    checked={resume.personal.selected}
                    onChange={(e) =>
                      actions.setPersonalField("selected", e.target.checked)
                    }
                    className="h-4 w-4 accent-[color:var(--accent)]"
                  />
                </label>
                <Field
                  label="Full name"
                  value={resume.personal.fullName}
                  onChange={(value) => actions.setPersonalField("fullName", value)}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Email"
                    value={resume.personal.email}
                    onChange={(value) => actions.setPersonalField("email", value)}
                  />
                  <Field
                    label="Phone"
                    value={resume.personal.phone}
                    onChange={(value) => actions.setPersonalField("phone", value)}
                  />
                  <Field
                    label="Location"
                    value={resume.personal.location}
                    onChange={(value) => actions.setPersonalField("location", value)}
                  />
                  <Field
                    label="Website"
                    value={resume.personal.website}
                    onChange={(value) => actions.setPersonalField("website", value)}
                  />
                </div>
                <Field
                  label="LinkedIn"
                  value={resume.personal.linkedin}
                  onChange={(value) => actions.setPersonalField("linkedin", value)}
                />
              </div>
            </SectionCard>

            <SectionCard
              section="summary"
              activeSection={ui.activeSection}
              expanded={ui.expandedSectionIds.includes("section-summary")}
              count={selectedCounts.summary}
              onSetActive={actions.setActiveSection}
              onToggleExpanded={actions.toggleExpanded}
              onSelectAll={() => actions.setAllInSection("summary", true)}
              onDeselectAll={() => actions.setAllInSection("summary", false)}
            >
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5">
                  <span className="text-sm font-medium text-[color:var(--text)]">
                    Include in preview
                  </span>
                  <input
                    type="checkbox"
                    checked={resume.summary.selected}
                    onChange={(e) => actions.setSummarySelected(e.target.checked)}
                    className="h-4 w-4 accent-[color:var(--accent)]"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                    Professional summary
                  </span>
                  <textarea
                    value={resume.summary.text}
                    onChange={(e) => actions.setSummaryText(e.target.value)}
                    rows={4}
                    className="min-h-28 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 text-sm leading-6 text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                    placeholder="Summarize the kind of roles you want and what evidence you bring."
                  />
                </label>
              </div>
            </SectionCard>

            {ENTRY_SECTION_KEYS.map((sectionKey) => {
              const allEntries = resume[sectionKey];
              const visibleEntries = allEntries.filter((entry) =>
                entryMatchesSearch(entry, query),
              );

              return (
                <SectionCard
                  key={sectionKey}
                  section={sectionKey}
                  activeSection={ui.activeSection}
                  expanded={ui.expandedSectionIds.includes(`section-${sectionKey}`)}
                  count={selectedCounts[sectionKey]}
                  onSetActive={actions.setActiveSection}
                  onToggleExpanded={actions.toggleExpanded}
                  onSelectAll={() => actions.setAllInSection(sectionKey, true)}
                  onDeselectAll={() => actions.setAllInSection(sectionKey, false)}
                  headerRight={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.addEntry(sectionKey);
                      }}
                      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-1 text-xs font-medium text-[color:var(--text)] transition hover:border-[color:var(--border-strong)]"
                    >
                      + Add
                    </button>
                  }
                >
                  <div className="space-y-3">
                    {visibleEntries.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-4 text-sm text-[color:var(--muted)]">
                        {allEntries.length === 0
                          ? `No ${SECTION_LABELS[sectionKey].toLowerCase()} entries yet. Add one to get started.`
                          : "No entries match your search."}
                      </div>
                    ) : (
                      visibleEntries.map((entry, index) => (
                        <EntryEditor
                          key={entry.id}
                          entry={entry}
                          index={index}
                          total={visibleEntries.length}
                          searchQuery={query}
                          showTagFilters={ui.showTagFilters}
                          onSetField={(field, value) =>
                            actions.updateEntryField(sectionKey, entry.id, field, value)
                          }
                          onRemove={() => actions.removeEntry(sectionKey, entry.id)}
                          onMove={(direction) =>
                            actions.moveEntry(sectionKey, entry.id, direction)
                          }
                          onAddBullet={() => actions.addBullet(sectionKey, entry.id)}
                          onUpdateBulletText={(bulletId, text) =>
                            actions.updateBulletText(sectionKey, entry.id, bulletId, text)
                          }
                          onToggleBullet={(bulletId, selected) =>
                            actions.toggleBulletSelected(
                              sectionKey,
                              entry.id,
                              bulletId,
                              selected,
                            )
                          }
                          onRemoveBullet={(bulletId) =>
                            actions.removeBullet(sectionKey, entry.id, bulletId)
                          }
                          onMoveBullet={(bulletId, direction) =>
                            actions.moveBullet(sectionKey, entry.id, bulletId, direction)
                          }
                          onSetBulletRole={(bulletId, roleType) =>
                            actions.setBulletRoleType(
                              sectionKey,
                              entry.id,
                              bulletId,
                              roleType,
                            )
                          }
                          onToggleBulletSkillTag={(bulletId, tag) =>
                            actions.toggleBulletSkillTag(
                              sectionKey,
                              entry.id,
                              bulletId,
                              tag,
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                </SectionCard>
              );
            })}

            <SectionCard
              section="skills"
              activeSection={ui.activeSection}
              expanded={ui.expandedSectionIds.includes("section-skills")}
              count={selectedCounts.skills}
              onSetActive={actions.setActiveSection}
              onToggleExpanded={actions.toggleExpanded}
              onSelectAll={() => actions.setAllInSection("skills", true)}
              onDeselectAll={() => actions.setAllInSection("skills", false)}
              headerRight={
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.addSkillGroup();
                  }}
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-1 text-xs font-medium text-[color:var(--text)] transition hover:border-[color:var(--border-strong)]"
                >
                  + Group
                </button>
              }
            >
              <div className="space-y-3">
                {resume.skills.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-4 text-sm text-[color:var(--muted)]">
                    No skill groups yet. Add a group like Technical, Languages, or Tools.
                  </div>
                ) : (
                  resume.skills.map((group, index) => (
                    <SkillGroupEditor
                      key={group.id}
                      group={group}
                      index={index}
                      total={resume.skills.length}
                      searchQuery={query}
                      onUpdateGroupName={(name) =>
                        actions.updateSkillGroupName(group.id, name)
                      }
                      onRemoveGroup={() => actions.removeSkillGroup(group.id)}
                      onMoveGroup={(direction) =>
                        actions.moveSkillGroup(group.id, direction)
                      }
                      onAddItem={() => actions.addSkillItem(group.id)}
                      onUpdateItem={(itemId, label) =>
                        actions.updateSkillItem(group.id, itemId, label)
                      }
                      onToggleItem={(itemId, selected) =>
                        actions.toggleSkillItem(group.id, itemId, selected)
                      }
                      onRemoveItem={(itemId) =>
                        actions.removeSkillItem(group.id, itemId)
                      }
                      onMoveItem={(itemId, direction) =>
                        actions.moveSkillItem(group.id, itemId, direction)
                      }
                    />
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </section>

        <div
          id="preview-pane"
          className={classNames(
            "min-h-0 flex-col",
            mobilePane === "preview" ? "flex" : "hidden lg:flex",
            "print:flex",
          )}
        >
          <ResumePreviewShell
            resume={previewResume}
            zoomPercent={ui.zoomPercent}
            onZoomChange={actions.setZoomPercent}
          />
        </div>
      </div>
    </div>
  );
}

function BuilderSidebarHeader({
  versionName,
  searchQuery,
  saveStatus,
  showTagFilters,
  onVersionNameChange,
  onSearchQueryChange,
  onToggleTagFilters,
  onReset,
}: {
  versionName: string;
  searchQuery: string;
  saveStatus: "saved" | "saving" | "reset";
  showTagFilters: boolean;
  onVersionNameChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleTagFilters: () => void;
  onReset: () => void;
}) {
  return (
    <div className="border-b border-[color:var(--border)] px-3 py-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Master Resume
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-serif)] text-2xl leading-none text-[color:var(--text)]">
            Builder
          </h1>
        </div>
        <SaveStatusBadge status={saveStatus} />
      </div>

      <div className="grid gap-3">
        <Field
          label="Version name"
          value={versionName}
          onChange={onVersionNameChange}
          placeholder="Master Resume"
        />
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Search entries / bullets
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Find by title, org, bullet text..."
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleTagFilters}
            className={classNames(
              "rounded-xl border px-3 py-2 text-sm font-medium transition",
              showTagFilters
                ? "border-[color:var(--accent-strong)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                : "border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--muted)]",
            )}
          >
            {showTagFilters ? "Hide Tags" : "Show Tags"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm font-medium text-[color:var(--text)] transition hover:border-[color:var(--border-strong)]"
          >
            Reset to Sample
          </button>
        </div>
      </div>
    </div>
  );
}

function SaveStatusBadge({ status }: { status: "saved" | "saving" | "reset" }) {
  const config =
    status === "saving"
      ? { label: "Saving", className: "bg-[color:var(--info-soft)] text-[color:var(--accent)]" }
      : status === "reset"
        ? { label: "Reset", className: "bg-[color:var(--warn-soft)] text-[color:var(--warn)]" }
        : { label: "Saved", className: "bg-[color:var(--success-soft)] text-[color:var(--success)]" };
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function SectionNav({
  activeSection,
  selectedCounts,
  onSelectSection,
}: {
  activeSection: ResumeSectionKey;
  selectedCounts: Record<ResumeSectionKey, number>;
  onSelectSection: (section: ResumeSectionKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SECTION_KEYS.map((sectionKey) => {
        const active = activeSection === sectionKey;
        return (
          <button
            key={sectionKey}
            type="button"
            onClick={() => onSelectSection(sectionKey)}
            className={classNames(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
              active
                ? "border-[color:var(--accent-strong)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                : "border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--muted)] hover:text-[color:var(--text)]",
            )}
          >
            <span>{SECTION_LABELS[sectionKey]}</span>
            <span className="rounded-full bg-black/6 px-2 py-0.5 text-xs">
              {selectedCounts[sectionKey]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SectionCard({
  section,
  activeSection,
  expanded,
  count,
  onSetActive,
  onToggleExpanded,
  onSelectAll,
  onDeselectAll,
  headerRight,
  children,
}: {
  section: ResumeSectionKey;
  activeSection: ResumeSectionKey;
  expanded: boolean;
  count: number;
  onSetActive: (section: ResumeSectionKey) => void;
  onToggleExpanded: (section: ResumeSectionKey) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = activeSection === section;

  return (
    <section
      className={classNames(
        "rounded-2xl border bg-[color:var(--panel)] shadow-[var(--shadow-soft)] transition",
        active
          ? "border-[color:var(--accent-strong)] shadow-[0_8px_18px_rgba(11,94,215,0.10)]"
          : "border-[color:var(--border)]",
      )}
    >
      <div className="flex items-start gap-2 px-3 py-3">
        <button
          type="button"
          onClick={() => {
            onSetActive(section);
            onToggleExpanded(section);
          }}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[color:var(--text)]">
              {SECTION_LABELS[section]}
            </span>
            <span className="rounded-full bg-[color:var(--panel-elevated)] px-2 py-0.5 text-xs font-semibold text-[color:var(--muted)]">
              {count}
            </span>
            <span className="text-xs text-[color:var(--muted)]" aria-hidden="true">
              {expanded ? "v" : ">"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            {section === "personal" && "Name, contact details, links"}
            {section === "summary" && "A short positioning paragraph"}
            {section === "experience" && "Role entries with bullet-level selection"}
            {section === "projects" && "Projects tailored by bullet relevance"}
            {section === "leadership" && "Leadership and extracurricular impact"}
            {section === "skills" && "Grouped skills with per-item toggles"}
          </p>
        </button>
        <div className="flex shrink-0 items-center gap-2">{headerRight}</div>
      </div>

      {expanded && (
        <div className="border-t border-[color:var(--border)] px-3 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)]"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)]"
            >
              Deselect all
            </button>
          </div>
          {children}
        </div>
      )}
    </section>
  );
}

function EntryEditor({
  entry,
  index,
  total,
  searchQuery,
  showTagFilters,
  onSetField,
  onRemove,
  onMove,
  onAddBullet,
  onUpdateBulletText,
  onToggleBullet,
  onRemoveBullet,
  onMoveBullet,
  onSetBulletRole,
  onToggleBulletSkillTag,
}: {
  entry: ResumeEntry;
  index: number;
  total: number;
  searchQuery: string;
  showTagFilters: boolean;
  onSetField: (
    field: keyof Omit<ResumeEntry, "id" | "sectionKey" | "bullets">,
    value: string | boolean,
  ) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddBullet: () => void;
  onUpdateBulletText: (bulletId: string, text: string) => void;
  onToggleBullet: (bulletId: string, selected: boolean) => void;
  onRemoveBullet: (bulletId: string) => void;
  onMoveBullet: (bulletId: string, direction: -1 | 1) => void;
  onSetBulletRole: (bulletId: string, roleType: RoleTypeTag) => void;
  onToggleBulletSkillTag: (bulletId: string, tag: SkillTag) => void;
}) {
  const headerMatch = !searchQuery
    ? true
    : [entry.title, entry.organization, entry.location]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery);
  const visibleBullets = entry.bullets.filter((bullet) =>
    headerMatch ? true : bulletMatchesSearch(bullet, searchQuery),
  );

  return (
    <article className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={entry.selected}
            onChange={(e) => onSetField("selected", e.target.checked)}
            className="h-4 w-4 accent-[color:var(--accent)]"
          />
          <span className="text-sm font-semibold text-[color:var(--text)]">
            Include entry
          </span>
        </label>
        <div className="flex items-center gap-1">
          <IconButton
            label="Move entry up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ^
          </IconButton>
          <IconButton
            label="Move entry down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            v
          </IconButton>
          <IconButton label="Delete entry" tone="danger" onClick={onRemove}>
            x
          </IconButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" value={entry.title} onChange={(v) => onSetField("title", v)} />
        <Field
          label="Organization"
          value={entry.organization}
          onChange={(v) => onSetField("organization", v)}
        />
        <Field
          label="Location"
          value={entry.location}
          onChange={(v) => onSetField("location", v)}
        />
        <Field
          label="Start (YYYY-MM)"
          value={entry.startDate}
          onChange={(v) => onSetField("startDate", v)}
          type="month"
        />
        <div className="sm:col-span-2">
          <Field
            label="End (YYYY-MM or Present)"
            value={entry.endDate}
            onChange={(v) => onSetField("endDate", v)}
            placeholder="Present"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Bullets ({entry.bullets.length})
          </h4>
          <button
            type="button"
            onClick={onAddBullet}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-1 text-xs font-medium text-[color:var(--text)]"
          >
            + Bullet
          </button>
        </div>

        <div className="space-y-2.5">
          {visibleBullets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-3 text-sm text-[color:var(--muted)]">
              No bullets match your search.
            </div>
          ) : (
            visibleBullets.map((bullet, bulletIndex) => (
              <BulletEditor
                key={bullet.id}
                bullet={bullet}
                index={bulletIndex}
                total={visibleBullets.length}
                showTagFilters={showTagFilters}
                onTextChange={(text) => onUpdateBulletText(bullet.id, text)}
                onToggleSelected={(selected) => onToggleBullet(bullet.id, selected)}
                onRemove={() => onRemoveBullet(bullet.id)}
                onMove={(direction) => onMoveBullet(bullet.id, direction)}
                onSetRoleType={(roleType) => onSetBulletRole(bullet.id, roleType)}
                onToggleSkillTag={(tag) => onToggleBulletSkillTag(bullet.id, tag)}
              />
            ))
          )}
        </div>
      </div>
    </article>
  );
}

function BulletEditor({
  bullet,
  index,
  total,
  showTagFilters,
  onTextChange,
  onToggleSelected,
  onRemove,
  onMove,
  onSetRoleType,
  onToggleSkillTag,
}: {
  bullet: ResumeBullet;
  index: number;
  total: number;
  showTagFilters: boolean;
  onTextChange: (text: string) => void;
  onToggleSelected: (selected: boolean) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onSetRoleType: (roleType: RoleTypeTag) => void;
  onToggleSkillTag: (tag: SkillTag) => void;
}) {
  return (
    <div
      className={classNames(
        "rounded-xl border p-3 transition",
        bullet.selected
          ? "border-[color:var(--border)] bg-[color:var(--panel)]"
          : "border-[color:var(--border)] bg-[color:var(--panel-elevated)] opacity-85",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={bullet.selected}
            onChange={(e) => onToggleSelected(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--accent)]"
          />
          <span className="text-sm font-medium text-[color:var(--text)]">
            Include bullet
          </span>
        </label>
        <div className="flex items-center gap-1">
          <IconButton
            label="Move bullet up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ^
          </IconButton>
          <IconButton
            label="Move bullet down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            v
          </IconButton>
          <IconButton label="Delete bullet" tone="danger" onClick={onRemove}>
            x
          </IconButton>
        </div>
      </div>

      <textarea
        value={bullet.text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2.5 text-sm leading-6 text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
        placeholder="Write an impact-focused bullet point."
      />

      {showTagFilters && (
        <div className="mt-3 space-y-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
              Role type
            </span>
            <select
              value={bullet.roleType}
              onChange={(e) => onSetRoleType(e.target.value as RoleTypeTag)}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
            >
              {ROLE_TYPE_TAGS.map((roleType) => (
                <option key={roleType} value={roleType}>
                  {roleType}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
              Skill tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_TAGS.map((tag) => {
                const selected = bullet.skillTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleSkillTag(tag)}
                    className={classNames(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                      selected
                        ? "border-[color:var(--accent-strong)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                        : "border-[color:var(--border)] bg-[color:var(--panel-elevated)] text-[color:var(--muted)] hover:text-[color:var(--text)]",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillGroupEditor({
  group,
  index,
  total,
  searchQuery,
  onUpdateGroupName,
  onRemoveGroup,
  onMoveGroup,
  onAddItem,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
  onMoveItem,
}: {
  group: SkillGroup;
  index: number;
  total: number;
  searchQuery: string;
  onUpdateGroupName: (name: string) => void;
  onRemoveGroup: () => void;
  onMoveGroup: (direction: -1 | 1) => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, label: string) => void;
  onToggleItem: (itemId: string, selected: boolean) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: -1 | 1) => void;
}) {
  const matchesGroupHeader = !searchQuery
    ? true
    : group.groupName.toLowerCase().includes(searchQuery);
  const visibleItems = group.items.filter((item) =>
    matchesGroupHeader ? true : item.label.toLowerCase().includes(searchQuery),
  );

  return (
    <article className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Field
            label="Group name"
            value={group.groupName}
            onChange={onUpdateGroupName}
            placeholder="Technical"
          />
        </div>
        <div className="mt-5 flex items-center gap-1">
          <IconButton
            label="Move group up"
            disabled={index === 0}
            onClick={() => onMoveGroup(-1)}
          >
            ^
          </IconButton>
          <IconButton
            label="Move group down"
            disabled={index === total - 1}
            onClick={() => onMoveGroup(1)}
          >
            v
          </IconButton>
          <IconButton label="Delete group" tone="danger" onClick={onRemoveGroup}>
            x
          </IconButton>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
          Items ({group.items.length})
        </h4>
        <button
          type="button"
          onClick={onAddItem}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-1 text-xs font-medium text-[color:var(--text)]"
        >
          + Skill
        </button>
      </div>

      <div className="space-y-2">
        {visibleItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-3 text-sm text-[color:var(--muted)]">
            No skill items match your search.
          </div>
        ) : (
          visibleItems.map((item, itemIndex) => (
            <div
              key={item.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-2"
            >
              <input
                type="checkbox"
                checked={item.selected}
                onChange={(e) => onToggleItem(item.id, e.target.checked)}
                className="h-4 w-4 accent-[color:var(--accent)]"
              />
              <input
                value={item.label}
                onChange={(e) => onUpdateItem(item.id, e.target.value)}
                className="min-w-0 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-2.5 py-1.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
              />
              <div className="flex items-center gap-1">
                <IconButton
                  label="Move skill up"
                  disabled={itemIndex === 0}
                  onClick={() => onMoveItem(item.id, -1)}
                >
                  ^
                </IconButton>
                <IconButton
                  label="Move skill down"
                  disabled={itemIndex === visibleItems.length - 1}
                  onClick={() => onMoveItem(item.id, 1)}
                >
                  v
                </IconButton>
                <IconButton
                  label="Delete skill"
                  tone="danger"
                  onClick={() => onRemoveItem(item.id)}
                >
                  x
                </IconButton>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
      />
    </label>
  );
}

function IconButton({
  label,
  tone = "default",
  disabled,
  onClick,
  children,
}: {
  label: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        "grid h-7 w-7 place-items-center rounded-md border text-xs font-semibold transition",
        disabled
          ? "cursor-not-allowed border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--muted)] opacity-50"
          : tone === "danger"
            ? "border-[color:var(--warn-border)] bg-[color:var(--panel)] text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)]"
            : "border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--text)] hover:border-[color:var(--border-strong)]",
      )}
    >
      {children}
    </button>
  );
}

