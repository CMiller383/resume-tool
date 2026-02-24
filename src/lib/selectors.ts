import type {
  BuilderUIState,
  ResumeDocument,
  ResumeSectionKey,
  SkillGroup,
} from "@/types/resume";

export type PreviewResume = ResumeDocument;

export function derivePreviewResume(resume: ResumeDocument): PreviewResume {
  const education = resume.education
    .filter((entry) => entry.selected)
    .map((entry) => ({
      ...entry,
      bullets: entry.bullets.filter((bullet) => bullet.selected && bullet.text.trim()),
    }));
  const experience = resume.experience
    .filter((entry) => entry.selected)
    .map((entry) => ({
      ...entry,
      bullets: entry.bullets.filter((bullet) => bullet.selected && bullet.text.trim()),
    }));
  const projects = resume.projects
    .filter((entry) => entry.selected)
    .map((entry) => ({
      ...entry,
      bullets: entry.bullets.filter((bullet) => bullet.selected && bullet.text.trim()),
    }));
  const leadership = resume.leadership
    .filter((entry) => entry.selected)
    .map((entry) => ({
      ...entry,
      bullets: entry.bullets.filter((bullet) => bullet.selected && bullet.text.trim()),
    }));

  const skills: SkillGroup[] = resume.skills
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.selected && item.label.trim()),
    }))
    .filter((group) => group.groupName.trim() && group.items.length > 0);

  return {
    ...resume,
    personal: {
      ...resume.personal,
      fullName: resume.personal.fullName.trim(),
      email: resume.personal.email.trim(),
      phone: resume.personal.phone.trim(),
      location: resume.personal.location.trim(),
      website: resume.personal.website.trim(),
      linkedin: resume.personal.linkedin.trim(),
    },
    summary: {
      ...resume.summary,
      text: resume.summary.text.trim(),
    },
    education,
    experience,
    projects,
    leadership,
    skills,
  };
}

export function countSelectedForSection(
  resume: ResumeDocument,
  sectionKey: ResumeSectionKey,
): number {
  switch (sectionKey) {
    case "personal":
      return resume.personal.selected ? 1 : 0;
    case "summary":
      return resume.summary.selected && resume.summary.text.trim() ? 1 : 0;
    case "skills":
      return resume.skills.reduce(
        (sum, group) => sum + group.items.filter((item) => item.selected).length,
        0,
      );
    case "experience":
    case "education":
    case "projects":
    case "leadership":
      return resume[sectionKey].filter((entry) => entry.selected).length;
    default:
      return 0;
  }
}

export function ensureValidZoom(ui: BuilderUIState) {
  const allowed = [75, 90, 100, 110, 125];
  if (allowed.includes(ui.zoomPercent)) return ui.zoomPercent;
  return 100;
}
