import { createSampleResume } from "@/lib/sample-data";
import type { ResumeDocument, ResumeEntry, ResumeSectionKey, SkillTag } from "@/types/resume";

export type FlattenedBullet = {
  sectionKey: Extract<ResumeSectionKey, "experience" | "projects" | "leadership">;
  entryId: string;
  entryTitle: string;
  organization: string;
  bulletId: string;
  bulletText: string;
  roleType: string;
  skillTags: SkillTag[];
  originallySelected: boolean;
};

export type BulletMatch = FlattenedBullet & {
  score: number;
  reasons: string[];
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "you",
  "your",
  "our",
  "are",
  "was",
  "were",
  "will",
  "have",
  "has",
  "had",
  "from",
  "into",
  "about",
  "over",
  "across",
  "through",
  "using",
  "used",
  "use",
  "role",
  "team",
  "teams",
  "work",
  "working",
  "experience",
  "preferred",
  "requirements",
  "responsibilities",
  "candidate",
  "ability",
  "skills",
]);

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

export function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function flattenResumeBullets(resume: ResumeDocument): FlattenedBullet[] {
  const sections: Array<Extract<ResumeSectionKey, "experience" | "projects" | "leadership">> = [
    "experience",
    "projects",
    "leadership",
  ];

  const rows: FlattenedBullet[] = [];
  for (const sectionKey of sections) {
    for (const entry of resume[sectionKey]) {
      for (const bullet of entry.bullets) {
        rows.push({
          sectionKey,
          entryId: entry.id,
          entryTitle: entry.title,
          organization: entry.organization,
          bulletId: bullet.id,
          bulletText: bullet.text,
          roleType: bullet.roleType,
          skillTags: bullet.skillTags,
          originallySelected: bullet.selected && entry.selected,
        });
      }
    }
  }
  return rows;
}

export function scoreBulletsAgainstJobDescription(
  resume: ResumeDocument,
  jobDescription: string,
): BulletMatch[] {
  const flattened = flattenResumeBullets(resume);
  const jd = jobDescription.toLowerCase();
  const jdTokens = unique(tokenize(jobDescription));
  const jdTokenSet = new Set(jdTokens);

  const matches = flattened.map((row) => {
    const bulletTokens = unique(tokenize(`${row.bulletText} ${row.entryTitle} ${row.organization}`));
    const overlap = bulletTokens.filter((token) => jdTokenSet.has(token));

    const roleTypeMatched =
      row.roleType && jd.includes(row.roleType.toLowerCase()) ? row.roleType : null;

    const matchingTags = row.skillTags.filter((tag) => {
      const tagTokens = tokenize(tag);
      return tagTokens.some((token) => jdTokenSet.has(token)) || jd.includes(tag.toLowerCase());
    });

    let score = 0;
    const reasons: string[] = [];

    if (overlap.length > 0) {
      const overlapScore = Math.min(8, overlap.length) * 4;
      score += overlapScore;
      reasons.push(`${overlap.length} keyword overlap`);
    }

    if (matchingTags.length > 0) {
      score += matchingTags.length * 5;
      reasons.push(`tag match: ${matchingTags.join(", ")}`);
    }

    if (roleTypeMatched) {
      score += 6;
      reasons.push(`role type: ${roleTypeMatched}`);
    }

    if (row.originallySelected) {
      score += 1;
    }

    return {
      ...row,
      score,
      reasons,
    };
  });

  return matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.originallySelected !== b.originallySelected) {
      return Number(b.originallySelected) - Number(a.originallySelected);
    }
    return a.bulletText.localeCompare(b.bulletText);
  });
}

export function buildTailoredResumeFromSelectedBullets(
  masterResume: ResumeDocument,
  selectedBulletIds: Set<string>,
  versionName: string,
) {
  const clone = structuredCloneIfAvailable(masterResume);

  const mutateEntries = (entries: ResumeEntry[]) =>
    entries.map((entry) => {
      const bullets = entry.bullets.map((bullet) => ({
        ...bullet,
        selected: selectedBulletIds.has(bullet.id),
      }));
      return {
        ...entry,
        selected: bullets.some((bullet) => bullet.selected),
        bullets,
      };
    });

  clone.experience = mutateEntries(clone.experience);
  clone.projects = mutateEntries(clone.projects);
  clone.leadership = mutateEntries(clone.leadership);
  clone.versionName = versionName.trim() || "Tailored Resume Draft";
  clone.updatedAt = new Date().toISOString();

  return clone;
}

function structuredCloneIfAvailable<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export function pickInitialSelections(matches: BulletMatch[]) {
  const positive = matches.filter((match) => match.score > 0);
  const source = positive.length > 0 ? positive : matches;
  return new Set(source.slice(0, 10).map((match) => match.bulletId));
}

export function loadMasterResumeOrSample(): ResumeDocument {
  if (typeof window === "undefined") return createSampleResume();

  try {
    const raw = window.localStorage.getItem("resume-tool.master-resume.v1");
    if (!raw) return createSampleResume();
    const parsed = JSON.parse(raw) as { schemaVersion?: number; data?: ResumeDocument };
    if (parsed?.schemaVersion === 1 && parsed.data) return parsed.data;
    return createSampleResume();
  } catch {
    return createSampleResume();
  }
}

