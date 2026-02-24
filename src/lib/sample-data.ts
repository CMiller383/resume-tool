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
      sectionKey === "education"
        ? "B.S. in Business Administration"
        : sectionKey === "projects"
        ? "Project Title"
        : sectionKey === "leadership"
          ? "Leadership Role"
          : "Role Title",
    organization:
      sectionKey === "education"
        ? "Georgia Institute of Technology"
        : sectionKey === "projects"
        ? "Organization / Class / Personal"
        : "Organization Name",
    location: sectionKey === "education" ? "Atlanta, GA" : "City, ST",
    startDate: sectionKey === "education" ? "2023-08" : "2025-01",
    endDate: sectionKey === "education" ? "2027-05" : "Present",
    selected: true,
    bullets: sectionKey === "education" ? [] : [createEmptyBullet()],
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
      fullName: "Tobe Chanow",
      email: "tchanow@gatech.edu",
      phone: "(404) 555-0184",
      location: "Atlanta, GA",
      website: "tobechanow.com",
      linkedin: "linkedin.com/in/tobechanow",
      selected: true,
    },
    summary: {
      selected: false,
      text: "Georgia Tech business student with experience in product strategy, operations, and student consulting. Strong in structured problem solving, stakeholder communication, and data-backed recommendations using SQL and Excel.",
    },
    education: [
      entry(
        "edu-1",
        "education",
        "B.S. in Business Administration (Strategy & Innovation / Finance)",
        "Georgia Institute of Technology, Scheller College of Business",
        "Atlanta, GA",
        "2023-08",
        "2027-05",
        [
          bullet(
            "edu-1-b1",
            "GPA: 3.8/4.0. Dean's List (3 semesters). Relevant coursework: Corporate Finance, Marketing Research, Operations, Data & Visual Analytics, Business Law.",
            "Research",
            ["Data Analysis", "Excel", "Communication"],
          ),
          bullet(
            "edu-1-b2",
            "Selected for CREATE-X startup practicum cohort to develop and pitch a student productivity concept with cross-functional teammates.",
            "Leadership",
            ["Presentation", "Leadership", "Project Management"],
          ),
        ],
      ),
    ],
    experience: [
      entry(
        "exp-1",
        "experience",
        "Business Operations Intern",
        "Peachtree Mobility",
        "Atlanta, GA",
        "2025-06",
        "2025-08",
        [
          bullet(
            "exp-1-b1",
            "Built weekly KPI tracker for sales, fulfillment, and support teams and used trend analysis to highlight bottlenecks, helping managers cut order-to-ship time by 14%.",
            "Operations",
            ["Strategy", "Excel", "Presentation", "Data Analysis"],
          ),
          bullet(
            "exp-1-b2",
            "Queried CRM and support data in SQL to identify high-volume issue categories, informing process changes that reduced repeat tickets during peak weeks.",
            "Operations",
            ["SQL", "Data Analysis", "Communication"],
          ),
          bullet(
            "exp-1-b3",
            "Partnered with product and operations leads to document requirements for a route scheduling automation pilot and coordinate rollout updates across teams.",
            "Product",
            ["Leadership", "Project Management", "Communication"],
          ),
        ],
      ),
      entry(
        "exp-2",
        "experience",
        "Analyst, Student Consulting Practicum",
        "Georgia Tech Student Consulting",
        "Atlanta, GA",
        "2024-09",
        "2025-05",
        [
          bullet(
            "exp-2-b1",
            "Led a 5-student team delivering go-to-market recommendations for an Atlanta startup through customer interviews, competitor benchmarking, and pricing analysis.",
            "Consulting",
            ["Strategy", "Leadership", "Communication"],
          ),
          bullet(
            "exp-2-b2",
            "Built Excel scenario models and presented trade-offs to the client leadership team, influencing phased market launch decisions.",
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
        "Campus Event Demand Forecasting Model",
        "Georgia Tech Coursework / Personal Extension",
        "Remote",
        "2025-10",
        "Present",
        [
          bullet(
            "proj-1-b1",
            "Built a forecasting model for student event attendance using historical sign-up and turnout data to improve staffing and supply planning for club events.",
            "Research",
            ["Excel", "Data Analysis", "Presentation"],
          ),
          bullet(
            "proj-1-b2",
            "Presented demand planning recommendations to student organization officers and created a reusable planning template for semester programming.",
            "Leadership",
            ["Project Management", "Communication", "Presentation"],
          ),
        ],
      ),
      entry(
        "proj-2",
        "projects",
        "Internship Application Tracker + Resume Tailoring Tool",
        "Personal Project",
        "Atlanta, GA",
        "2025-11",
        "Present",
        [
          bullet(
            "proj-2-b1",
            "Designed a structured resume database with taggable bullets to support tailored resume generation and application tracking workflows.",
            "Product",
            ["Project Management", "Strategy", "Communication"],
          ),
          bullet(
            "proj-2-b2",
            "Prototyped local-first workflow for generating and saving resume versions linked to job descriptions and application status tracking.",
            "Product",
            ["Data Analysis", "Excel", "Leadership"],
          ),
        ],
      ),
    ],
    leadership: [
      entry(
        "lead-1",
        "leadership",
        "Vice President, Professional Development",
        "Georgia Tech Undergraduate Consulting Club",
        "Atlanta, GA",
        "2024-05",
        "Present",
        [
          bullet(
            "lead-1-b1",
            "Expanded active membership from 55 to 130 students by launching case prep workshops, alumni panels, and first-year onboarding sessions.",
            "Leadership",
            ["Leadership", "Communication", "Presentation"],
          ),
          bullet(
            "lead-1-b2",
            "Managed a 10-person executive board and coordinated semester programming with campus partners, alumni mentors, and recruiting organizations.",
            "Leadership",
            ["Leadership", "Project Management"],
          ),
        ],
      ),
    ],
    skills: [
      {
        id: "skills-1",
        groupName: "Analytics & Tools",
        items: [
          { id: "skills-1-i1", label: "SQL", selected: true },
          { id: "skills-1-i2", label: "Python (basic)", selected: true },
          { id: "skills-1-i3", label: "Excel / Sheets", selected: true },
          { id: "skills-1-i4", label: "Tableau", selected: true },
        ],
      },
      {
        id: "skills-2",
        groupName: "Business & Strategy",
        items: [
          { id: "skills-2-i1", label: "Market Sizing", selected: true },
          { id: "skills-2-i2", label: "Go-to-Market Strategy", selected: true },
          { id: "skills-2-i3", label: "Operations Analysis", selected: true },
          { id: "skills-2-i4", label: "Scenario Modeling", selected: true },
        ],
      },
      {
        id: "skills-3",
        groupName: "Communication",
        items: [
          { id: "skills-3-i1", label: "Executive Presentations", selected: true },
          { id: "skills-3-i2", label: "Stakeholder Alignment", selected: true },
          { id: "skills-3-i3", label: "Client Interviews", selected: true },
        ],
      },
    ],
    updatedAt: nowIso(),
  };
}

export function normalizeResumeDocumentShape(raw: unknown): ResumeDocument {
  const sample = createSampleResume();
  const candidate =
    raw && typeof raw === "object" ? (raw as Partial<ResumeDocument>) : ({} as Partial<ResumeDocument>);

  return {
    ...sample,
    ...candidate,
    personal: {
      ...sample.personal,
      ...(candidate.personal ?? {}),
    },
    summary: {
      ...sample.summary,
      ...(candidate.summary ?? {}),
    },
    education: Array.isArray(candidate.education) ? candidate.education : sample.education,
    experience: Array.isArray(candidate.experience) ? candidate.experience : sample.experience,
    projects: Array.isArray(candidate.projects) ? candidate.projects : sample.projects,
    leadership: Array.isArray(candidate.leadership) ? candidate.leadership : sample.leadership,
    skills: Array.isArray(candidate.skills) ? candidate.skills : sample.skills,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : sample.updatedAt,
  };
}

export function createDefaultUIState(): BuilderUIState {
  return {
    activeSection: "experience",
    expandedSectionIds: [
      "section-personal",
      "section-summary",
      "section-education",
      "section-experience",
      "section-projects",
      "section-leadership",
      "section-skills",
    ],
    zoomPercent: 100,
    showTagFilters: true,
  };
}
