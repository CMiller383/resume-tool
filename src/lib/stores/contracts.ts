import type {
  ApplicationRecord,
  CommentRecord,
  ResumeVersionRecord,
} from "@/types/data/platform";

export interface ResumeVersionStore {
  list(): Promise<ResumeVersionRecord[]>;
  getById(id: string): Promise<ResumeVersionRecord | null>;
  save(record: ResumeVersionRecord): Promise<ResumeVersionRecord>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ApplicationStore {
  list(): Promise<ApplicationRecord[]>;
  getById(id: string): Promise<ApplicationRecord | null>;
  save(record: ApplicationRecord): Promise<ApplicationRecord>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CommentStore {
  list(): Promise<CommentRecord[]>;
  listByStudent(studentId: string): Promise<CommentRecord[]>;
  save(record: CommentRecord): Promise<CommentRecord>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export type DataRepositories = {
  resumeVersions: ResumeVersionStore;
  applications: ApplicationStore;
  comments: CommentStore;
};

