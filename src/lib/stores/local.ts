import { generateId, normalizeResumeDocumentShape } from "@/lib/sample-data";
import type {
  ApplicationRecord,
  CommentRecord,
  ResumeVersionRecord,
} from "@/types/data/platform";

import type {
  ApplicationStore,
  CommentStore,
  DataRepositories,
  ResumeVersionStore,
} from "./contracts";

const STORAGE_KEYS = {
  resumeVersions: "resume-tool.resume-versions.v1",
  applications: "resume-tool.applications.v1",
  comments: "resume-tool.comments.v1",
} as const;

type Envelope<T> = {
  schemaVersion: 1;
  data: T[];
};

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadArray<T>(key: string): T[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Envelope<T> | T[];
    if (Array.isArray(parsed)) return parsed;
    if (parsed && parsed.schemaVersion === 1 && Array.isArray(parsed.data)) {
      return parsed.data;
    }
    return [];
  } catch {
    return [];
  }
}

function saveArray<T>(key: string, rows: T[]) {
  if (!hasStorage()) return;
  const payload: Envelope<T> = { schemaVersion: 1, data: rows };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

function sortByTimestampDesc<T extends { timestamp?: string; createdAt?: string }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const aTime = a.timestamp ?? a.createdAt ?? "";
    const bTime = b.timestamp ?? b.createdAt ?? "";
    return bTime.localeCompare(aTime);
  });
}

class LocalResumeVersionStore implements ResumeVersionStore {
  async list(): Promise<ResumeVersionRecord[]> {
    return sortByTimestampDesc(
      loadArray<ResumeVersionRecord>(STORAGE_KEYS.resumeVersions).map((row) => ({
        ...row,
        finalResumeContent: normalizeResumeDocumentShape(row.finalResumeContent),
      })),
    );
  }

  async getById(id: string): Promise<ResumeVersionRecord | null> {
    const rows = loadArray<ResumeVersionRecord>(STORAGE_KEYS.resumeVersions);
    const row = rows.find((candidate) => candidate.id === id) ?? null;
    if (!row) return null;
    return {
      ...row,
      finalResumeContent: normalizeResumeDocumentShape(row.finalResumeContent),
    };
  }

  async save(record: ResumeVersionRecord): Promise<ResumeVersionRecord> {
    const rows = loadArray<ResumeVersionRecord>(STORAGE_KEYS.resumeVersions);
    const timestamp = record.timestamp || new Date().toISOString();
    const normalized: ResumeVersionRecord = {
      ...record,
      id: record.id || generateId("resume-version"),
      timestamp,
      finalResumeContent: normalizeResumeDocumentShape(record.finalResumeContent),
    };

    const nextRows = [normalized, ...rows.filter((row) => row.id !== normalized.id)];
    saveArray(STORAGE_KEYS.resumeVersions, nextRows);
    return normalized;
  }

  async remove(id: string): Promise<void> {
    const rows = loadArray<ResumeVersionRecord>(STORAGE_KEYS.resumeVersions);
    saveArray(
      STORAGE_KEYS.resumeVersions,
      rows.filter((row) => row.id !== id),
    );
  }

  async clear(): Promise<void> {
    saveArray(STORAGE_KEYS.resumeVersions, []);
  }
}

class LocalApplicationStore implements ApplicationStore {
  async list(): Promise<ApplicationRecord[]> {
    return loadArray<ApplicationRecord>(STORAGE_KEYS.applications);
  }

  async getById(id: string): Promise<ApplicationRecord | null> {
    const rows = loadArray<ApplicationRecord>(STORAGE_KEYS.applications);
    return rows.find((row) => row.id === id) ?? null;
  }

  async save(record: ApplicationRecord): Promise<ApplicationRecord> {
    const rows = loadArray<ApplicationRecord>(STORAGE_KEYS.applications);
    const normalized: ApplicationRecord = {
      ...record,
      id: record.id || generateId("application"),
    };
    saveArray(STORAGE_KEYS.applications, [
      normalized,
      ...rows.filter((row) => row.id !== normalized.id),
    ]);
    return normalized;
  }

  async remove(id: string): Promise<void> {
    const rows = loadArray<ApplicationRecord>(STORAGE_KEYS.applications);
    saveArray(
      STORAGE_KEYS.applications,
      rows.filter((row) => row.id !== id),
    );
  }

  async clear(): Promise<void> {
    saveArray(STORAGE_KEYS.applications, []);
  }
}

class LocalCommentStore implements CommentStore {
  async list(): Promise<CommentRecord[]> {
    return sortByTimestampDesc(loadArray<CommentRecord>(STORAGE_KEYS.comments));
  }

  async listByStudent(studentId: string): Promise<CommentRecord[]> {
    const rows = await this.list();
    return rows.filter((row) => row.targetStudentId === studentId);
  }

  async save(record: CommentRecord): Promise<CommentRecord> {
    const rows = loadArray<CommentRecord>(STORAGE_KEYS.comments);
    const normalized: CommentRecord = {
      ...record,
      id: record.id || generateId("comment"),
      createdAt: record.createdAt || new Date().toISOString(),
    };
    saveArray(STORAGE_KEYS.comments, [
      normalized,
      ...rows.filter((row) => row.id !== normalized.id),
    ]);
    return normalized;
  }

  async remove(id: string): Promise<void> {
    const rows = loadArray<CommentRecord>(STORAGE_KEYS.comments);
    saveArray(
      STORAGE_KEYS.comments,
      rows.filter((row) => row.id !== id),
    );
  }

  async clear(): Promise<void> {
    saveArray(STORAGE_KEYS.comments, []);
  }
}

let cachedRepositories: DataRepositories | null = null;

export function getLocalRepositories(): DataRepositories {
  if (cachedRepositories) return cachedRepositories;
  cachedRepositories = {
    resumeVersions: new LocalResumeVersionStore(),
    applications: new LocalApplicationStore(),
    comments: new LocalCommentStore(),
  };
  return cachedRepositories;
}
