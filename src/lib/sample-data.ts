import type {
  BuilderUIState,
  EntrySectionKey,
  ResumeBullet,
  ResumeDocument,
  ResumeEntry,
  RoleTypeTag,
  SkillGroup,
  SkillItem,
  SkillTag,
} from "@/types/resume";

function nowIso() {
  return new Date().toISOString();
}

export function generateId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

export function createEmptyBullet(overrides?: Partial<ResumeBullet>): ResumeBullet {
  return {
    id: generateId("bullet"),
    text: "Describe impact using action + scope + measurable result.",
    selected: true,
    roleType: "Other",
    skillTags: [],
    ...overrides,
  };
}

export function createEmptyEntry(sectionKey: EntrySectionKey): ResumeEntry {
  return {
    id: generateId(sectionKey),
    sectionKey,
    title:
      sectionKey === "projects"
        ? "Project Title"
        : sectionKey === "leadership"
          ? "Leadership Role"
          : "Role Title",
    organization:
      sectionKey === "projects"
        ? "Organization / Class / Personal"
        : "Organization Name",
    location: "City, ST",
    startDate: "2025-01",
    endDate: "Present",
    selected: true,
    bullets: [createEmptyBullet()],
  };
}

export function createSkillItem(label = "New Skill"): SkillItem {
  return {
    id: generateId("skill-item"),
    label,
    selected: true,
  };
}

export function createSkillGroup(name = "New Group"): SkillGroup {
  return {
    id: generateId("skill-group"),
    groupName: name,
    items: [createSkillItem()],
  };
}

function bullet(
  id: string,
  text: string,
  roleType: RoleTypeTag,
  skillTags: SkillTag[],
  selected = true,
): ResumeBullet {
  return { id, text, roleType, skillTags, selected };
}

function entry(
  id: string,
  sectionKey: EntrySectionKey,
  title: string,
  organization: string,
  location: string,
  startDate: string,
  endDate: string,
  bullets: ResumeBullet[],
  selected = true,
): ResumeEntry {
  return {
    id,
    sectionKey,
    title,
    organization,
    location,
    startDate,
    endDate,
    selected,
    bullets,
  };
}

export function createSampleResume(): ResumeDocument {
  return {
    id: "resume-master-001",
    versionName: "Master Resume",
    personal: {
      fullName: "Jordan Lee",
      email: "jordan.lee@email.edu",
      phone: "(555) 314-2718",
      location: "Boston, MA",
      website: "jordanlee.dev",
      linkedin: "linkedin.com/in/jordanlee",
      selected: true,
    },
    summary: {
      selected: true,
      text: "Analytical business and technology student with experience leading cross-functional projects, building data-driven recommendations, and translating messy problems into clear action plans.",
    },
    experience: [
      entry(
        "exp-1",
        "experience",
        "Product Strategy Intern",
        "Northstar Health",
        "Boston, MA",
        "2025-06",
        "2025-08",
        [
          bullet(
            "exp-1-b1",
            "Built market sizing model across three service lines and synthesized findings into a recommendation deck used by directors to prioritize Q4 pilot expansion.",
            "Product",
            ["Strategy", "Excel", "Presentation", "Data Analysis"],
          ),
          bullet(
            "exp-1-b2",
            "Analyzed patient onboarding funnel data in SQL and identified drop-off drivers, informing UX changes that improved completion rate by 11% in A/B follow-up testing.",
            "Product",
            ["SQL", "Data Analysis", "Communication"],
          ),
          bullet(
            "exp-1-b3",
            "Partnered with engineering and operations to document requirements for a scheduling workflow automation initiative.",
            "Product",
            ["Leadership", "Project Management", "Communication"],
          ),
        ],
      ),
      entry(
        "exp-2",
        "experience",
        "Business Analyst, Student Consulting Team",
        "University Career Accelerator",
        "Cambridge, MA",
        "2024-09",
        "2025-05",
        [
          bullet(
            "exp-2-b1",
            "Led a 5-student team delivering go-to-market recommendations for a local startup through customer interviews, competitor benchmarking, and pricing analysis.",
            "Consulting",
            ["Strategy", "Leadership", "Communication"],
          ),
          bullet(
            "exp-2-b2",
            "Built Excel scenario models and presented trade-offs to the client CEO, influencing phased launch decisions.",
            "Consulting",
            ["Excel", "Presentation", "Data Analysis"],
          ),
        ],
      ),
    ],
    projects: [
      entry(
        "proj-1",
        "projects",
        "Resume Relevance Scoring Prototype",
        "Personal Project",
        "Remote",
        "2025-10",
        "Present",
        [
          bullet(
            "proj-1-b1",
            "Developed a prototype that ranks resume bullets against job descriptions using keyword weighting and semantic similarity heuristics.",
            "Engineering",
            ["Python", "SQL", "Data Analysis"],
          ),
          bullet(
            "proj-1-b2",
            "Designed a structured data schema for resume sections, entries, and taggable bullets to support future tailoring workflows.",
            "Engineering",
            ["Project Management", "Communication"],
          ),
        ],
      ),
    ],
    leadership: [
      entry(
        "lead-1",
        "leadership",
        "President",
        "Product Club",
        "Boston, MA",
        "2024-05",
        "Present",
        [
          bullet(
            "lead-1-b1",
            "Grew active membership from 40 to 115 students by launching skill workshops and alumni panels tailored to internship recruiting cycles.",
            "Leadership",
            ["Leadership", "Communication", "Presentation"],
          ),
          bullet(
            "lead-1-b2",
            "Managed a 9-person executive board and coordinated semester programming with the career center and industry mentors.",
            "Leadership",
            ["Leadership", "Project Management"],
          ),
        ],
      ),
    ],
    skills: [
      {
        id: "skills-1",
        groupName: "Technical",
        items: [
          { id: "skills-1-i1", label: "SQL", selected: true },
          { id: "skills-1-i2", label: "Python", selected: true },
          { id: "skills-1-i3", label: "Excel / Sheets", selected: true },
          { id: "skills-1-i4", label: "Tableau", selected: false },
        ],
      },
      {
        id: "skills-2",
        groupName: "Business",
        items: [
          { id: "skills-2-i1", label: "Market Sizing", selected: true },
          { id: "skills-2-i2", label: "Roadmapping", selected: true },
          { id: "skills-2-i3", label: "Experiment Design", selected: true },
        ],
      },
      {
        id: "skills-3",
        groupName: "Communication",
        items: [
          { id: "skills-3-i1", label: "Executive Presentations", selected: true },
          { id: "skills-3-i2", label: "Stakeholder Alignment", selected: true },
        ],
      },
    ],
    updatedAt: nowIso(),
  };
}

export function createDefaultUIState(): BuilderUIState {
  return {
    activeSection: "experience",
    expandedSectionIds: [
      "section-personal",
      "section-summary",
      "section-experience",
      "section-projects",
      "section-leadership",
      "section-skills",
    ],
    zoomPercent: 100,
    showTagFilters: true,
  };
}

