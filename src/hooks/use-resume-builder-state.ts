"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  createDefaultUIState,
  createEmptyBullet,
  createEmptyEntry,
  createSampleResume,
  createSkillGroup,
  createSkillItem,
} from "@/lib/sample-data";
import {
  clearPersistedState,
  loadPersistedResume,
  loadPersistedUI,
  savePersistedResume,
  savePersistedUI,
} from "@/lib/persistence";
import { ensureValidZoom } from "@/lib/selectors";
import { emitToast } from "@/lib/toast-events";
import type {
  BuilderUIState,
  EntrySectionKey,
  ResumeBullet,
  ResumeDocument,
  ResumeEntry,
  ResumeSectionKey,
  RoleTypeTag,
  SkillTag,
} from "@/types/resume";

type SaveStatus = "saved" | "saving" | "reset";

function touch(resume: ResumeDocument): ResumeDocument {
  return { ...resume, updatedAt: new Date().toISOString() };
}

function reorder<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

function updateEntrySection(
  resume: ResumeDocument,
  section: EntrySectionKey,
  updater: (entries: ResumeEntry[]) => ResumeEntry[],
): ResumeDocument {
  return touch({
    ...resume,
    [section]: updater(resume[section]),
  });
}

function updateEntryById(
  resume: ResumeDocument,
  section: EntrySectionKey,
  entryId: string,
  updater: (entry: ResumeEntry) => ResumeEntry,
): ResumeDocument {
  return updateEntrySection(resume, section, (entries) =>
    entries.map((entry) => (entry.id === entryId ? updater(entry) : entry)),
  );
}

function updateBulletById(
  resume: ResumeDocument,
  section: EntrySectionKey,
  entryId: string,
  bulletId: string,
  updater: (bullet: ResumeBullet) => ResumeBullet,
): ResumeDocument {
  return updateEntryById(resume, section, entryId, (entry) => ({
    ...entry,
    bullets: entry.bullets.map((bullet) =>
      bullet.id === bulletId ? updater(bullet) : bullet,
    ),
  }));
}

export function useResumeBuilderState() {
  const [resume, setResume] = useState<ResumeDocument>(() => createSampleResume());
  const [ui, setUi] = useState<BuilderUIState>(() => createDefaultUIState());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [hydrated, setHydrated] = useState(false);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const { resume: persistedResume, corrupted: resumeCorrupted } = loadPersistedResume();
    const { ui: persistedUi, corrupted: uiCorrupted } = loadPersistedUI();

    // Hydrate client-side local draft after SSR fallback render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (persistedResume) setResume(persistedResume);
    if (persistedUi) {
      setUi({
        ...createDefaultUIState(),
        ...persistedUi,
        zoomPercent: ensureValidZoom(persistedUi),
      });
    }
    if (resumeCorrupted || uiCorrupted) {
      setLoadWarning("Saved local data was invalid and was safely reset to sample content.");
      clearPersistedState();
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // This drives a transient autosave indicator tied to persistence side effects.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveStatus("saving");

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      savePersistedResume(resume);
      savePersistedUI(ui);
      setSaveStatus("saved");
    }, 350);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [resume, ui, hydrated]);

  const actions = useMemo(
    () => ({
      setVersionName(value: string) {
        setResume((prev) => touch({ ...prev, versionName: value }));
      },
      setActiveSection(section: ResumeSectionKey) {
        setUi((prev) => ({ ...prev, activeSection: section }));
      },
      toggleExpanded(section: ResumeSectionKey) {
        const id = `section-${section}`;
        setUi((prev) => {
          const exists = prev.expandedSectionIds.includes(id);
          return {
            ...prev,
            expandedSectionIds: exists
              ? prev.expandedSectionIds.filter((item) => item !== id)
              : [...prev.expandedSectionIds, id],
          };
        });
      },
      setZoomPercent(value: number) {
        const allowed = [75, 90, 100, 110, 125];
        if (!allowed.includes(value)) return;
        setUi((prev) => ({ ...prev, zoomPercent: value }));
      },
      toggleTagFilters() {
        setUi((prev) => ({ ...prev, showTagFilters: !prev.showTagFilters }));
      },
      setPersonalField(field: keyof ResumeDocument["personal"], value: string | boolean) {
        setResume((prev) =>
          touch({
            ...prev,
            personal: {
              ...prev.personal,
              [field]: value,
            },
          }),
        );
      },
      setSummaryText(text: string) {
        setResume((prev) => touch({ ...prev, summary: { ...prev.summary, text } }));
      },
      setSummarySelected(selected: boolean) {
        setResume((prev) =>
          touch({ ...prev, summary: { ...prev.summary, selected } }),
        );
      },
      addEntry(section: EntrySectionKey) {
        setResume((prev) =>
          updateEntrySection(prev, section, (entries) => [...entries, createEmptyEntry(section)]),
        );
      },
      updateEntryField(
        section: EntrySectionKey,
        entryId: string,
        field: keyof Omit<ResumeEntry, "id" | "sectionKey" | "bullets">,
        value: string | boolean,
      ) {
        setResume((prev) =>
          updateEntryById(prev, section, entryId, (entry) => ({ ...entry, [field]: value })),
        );
      },
      removeEntry(section: EntrySectionKey, entryId: string) {
        setResume((prev) =>
          updateEntrySection(prev, section, (entries) =>
            entries.filter((entry) => entry.id !== entryId),
          ),
        );
      },
      moveEntry(section: EntrySectionKey, entryId: string, direction: -1 | 1) {
        setResume((prev) =>
          updateEntrySection(prev, section, (entries) => {
            const index = entries.findIndex((entry) => entry.id === entryId);
            if (index === -1) return entries;
            return reorder(entries, index, direction);
          }),
        );
      },
      setAllInSection(section: ResumeSectionKey, selected: boolean) {
        setResume((prev) => {
          if (section === "personal") {
            return touch({ ...prev, personal: { ...prev.personal, selected } });
          }
          if (section === "summary") {
            return touch({ ...prev, summary: { ...prev.summary, selected } });
          }
          if (section === "skills") {
            return touch({
              ...prev,
              skills: prev.skills.map((group) => ({
                ...group,
                items: group.items.map((item) => ({ ...item, selected })),
              })),
            });
          }
          return touch({
            ...prev,
            [section]: prev[section].map((entry) => ({
              ...entry,
              selected,
              bullets: entry.bullets.map((bullet) => ({ ...bullet, selected })),
            })),
          });
        });
      },
      addBullet(section: EntrySectionKey, entryId: string) {
        setResume((prev) =>
          updateEntryById(prev, section, entryId, (entry) => ({
            ...entry,
            bullets: [...entry.bullets, createEmptyBullet()],
          })),
        );
      },
      updateBulletText(section: EntrySectionKey, entryId: string, bulletId: string, text: string) {
        setResume((prev) =>
          updateBulletById(prev, section, entryId, bulletId, (bullet) => ({ ...bullet, text })),
        );
      },
      toggleBulletSelected(
        section: EntrySectionKey,
        entryId: string,
        bulletId: string,
        selected: boolean,
      ) {
        setResume((prev) =>
          updateBulletById(prev, section, entryId, bulletId, (bullet) => ({
            ...bullet,
            selected,
          })),
        );
      },
      removeBullet(section: EntrySectionKey, entryId: string, bulletId: string) {
        setResume((prev) =>
          updateEntryById(prev, section, entryId, (entry) => ({
            ...entry,
            bullets: entry.bullets.filter((bullet) => bullet.id !== bulletId),
          })),
        );
      },
      moveBullet(
        section: EntrySectionKey,
        entryId: string,
        bulletId: string,
        direction: -1 | 1,
      ) {
        setResume((prev) =>
          updateEntryById(prev, section, entryId, (entry) => {
            const index = entry.bullets.findIndex((bullet) => bullet.id === bulletId);
            if (index === -1) return entry;
            return { ...entry, bullets: reorder(entry.bullets, index, direction) };
          }),
        );
      },
      setBulletRoleType(
        section: EntrySectionKey,
        entryId: string,
        bulletId: string,
        roleType: RoleTypeTag,
      ) {
        setResume((prev) =>
          updateBulletById(prev, section, entryId, bulletId, (bullet) => ({
            ...bullet,
            roleType,
          })),
        );
      },
      toggleBulletSkillTag(
        section: EntrySectionKey,
        entryId: string,
        bulletId: string,
        tag: SkillTag,
      ) {
        setResume((prev) =>
          updateBulletById(prev, section, entryId, bulletId, (bullet) => ({
            ...bullet,
            skillTags: bullet.skillTags.includes(tag)
              ? bullet.skillTags.filter((item) => item !== tag)
              : [...bullet.skillTags, tag],
          })),
        );
      },
      addSkillGroup() {
        setResume((prev) => touch({ ...prev, skills: [...prev.skills, createSkillGroup()] }));
      },
      updateSkillGroupName(groupId: string, groupName: string) {
        setResume((prev) =>
          touch({
            ...prev,
            skills: prev.skills.map((group) =>
              group.id === groupId ? { ...group, groupName } : group,
            ),
          }),
        );
      },
      removeSkillGroup(groupId: string) {
        setResume((prev) =>
          touch({ ...prev, skills: prev.skills.filter((group) => group.id !== groupId) }),
        );
      },
      moveSkillGroup(groupId: string, direction: -1 | 1) {
        setResume((prev) => {
          const index = prev.skills.findIndex((group) => group.id === groupId);
          if (index === -1) return prev;
          return touch({ ...prev, skills: reorder(prev.skills, index, direction) });
        });
      },
      addSkillItem(groupId: string) {
        setResume((prev) =>
          touch({
            ...prev,
            skills: prev.skills.map((group) =>
              group.id === groupId
                ? { ...group, items: [...group.items, createSkillItem()] }
                : group,
            ),
          }),
        );
      },
      updateSkillItem(groupId: string, itemId: string, label: string) {
        setResume((prev) =>
          touch({
            ...prev,
            skills: prev.skills.map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    items: group.items.map((item) =>
                      item.id === itemId ? { ...item, label } : item,
                    ),
                  }
                : group,
            ),
          }),
        );
      },
      toggleSkillItem(groupId: string, itemId: string, selected: boolean) {
        setResume((prev) =>
          touch({
            ...prev,
            skills: prev.skills.map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    items: group.items.map((item) =>
                      item.id === itemId ? { ...item, selected } : item,
                    ),
                  }
                : group,
            ),
          }),
        );
      },
      removeSkillItem(groupId: string, itemId: string) {
        setResume((prev) =>
          touch({
            ...prev,
            skills: prev.skills.map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    items: group.items.filter((item) => item.id !== itemId),
                  }
                : group,
            ),
          }),
        );
      },
      moveSkillItem(groupId: string, itemId: string, direction: -1 | 1) {
        setResume((prev) =>
          touch({
            ...prev,
            skills: prev.skills.map((group) => {
              if (group.id !== groupId) return group;
              const index = group.items.findIndex((item) => item.id === itemId);
              if (index === -1) return group;
              return { ...group, items: reorder(group.items, index, direction) };
            }),
          }),
        );
      },
      resetToSample() {
        setResume(createSampleResume());
        setUi(createDefaultUIState());
        clearPersistedState();
        setSaveStatus("reset");
        emitToast({
          tone: "info",
          title: "Builder Reset",
          message: "Restored the sample master resume content.",
        });
        window.setTimeout(() => setSaveStatus("saved"), 700);
      },
      dismissLoadWarning() {
        setLoadWarning(null);
      },
    }),
    [],
  );

  return {
    resume,
    ui,
    saveStatus,
    hydrated,
    loadWarning,
    actions,
  };
}
