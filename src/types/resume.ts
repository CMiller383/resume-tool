export const SECTION_KEYS = [
  "personal",
  "summary",
  "education",
  "experience",
  "projects",
  "leadership",
  "skills",
] as const;

export type ResumeSectionKey = (typeof SECTION_KEYS)[number];
export type EntrySectionKey = Extract<
  ResumeSectionKey,
  "education" | "experience" | "projects" | "leadership"
>;

export const ENTRY_SECTION_KEYS: EntrySectionKey[] = [
  "education",
  "experience",
  "projects",
  "leadership",
];

export const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  personal: "Personal Info",
  summary: "Summary",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  leadership: "Leadership",
  skills: "Skills",
};

export const ROLE_TYPE_TAGS = [
  "Consulting",
  "Product",
  "Engineering",
  "Leadership",
  "Research",
  "Operations",
  "Other",
] as const;

export type RoleTypeTag = (typeof ROLE_TYPE_TAGS)[number];

export const SKILL_TAGS = [
  "Strategy",
  "SQL",
  "Leadership",
  "Data Analysis",
  "Communication",
  "Project Management",
  "Python",
  "Excel",
  "Presentation",
] as const;

export type SkillTag = (typeof SKILL_TAGS)[number];

export type UserRole = "student" | "instructor";

export type ResumeBullet = {
  id: string;
  text: string;
  selected: boolean;
  roleType: RoleTypeTag;
  skillTags: SkillTag[];
  commentCount?: number;
};

export type ResumeEntry = {
  id: string;
  sectionKey: EntrySectionKey;
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  selected: boolean;
  bullets: ResumeBullet[];
};

export type SkillItem = {
  id: string;
  label: string;
  selected: boolean;
};

export type SkillGroup = {
  id: string;
  groupName: string;
  items: SkillItem[];
};

export type PersonalInfo = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  selected: boolean;
};

export type SummarySection = {
  text: string;
  selected: boolean;
};

export type ResumeDocument = {
  id: string;
  versionName: string;
  personal: PersonalInfo;
  summary: SummarySection;
  education: ResumeEntry[];
  experience: ResumeEntry[];
  projects: ResumeEntry[];
  leadership: ResumeEntry[];
  skills: SkillGroup[];
  updatedAt: string;
};

export type BuilderUIState = {
  activeSection: ResumeSectionKey;
  expandedSectionIds: string[];
  zoomPercent: number;
  showTagFilters: boolean;
};

export type PersistedStateV1 = {
  schemaVersion: 1;
  resume: ResumeDocument;
  ui: BuilderUIState;
};

export function isEntrySectionKey(value: ResumeSectionKey): value is EntrySectionKey {
  return ENTRY_SECTION_KEYS.includes(value as EntrySectionKey);
}
