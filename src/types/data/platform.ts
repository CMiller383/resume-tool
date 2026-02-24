import type { ResumeDocument } from "@/types/resume";

export const APPLICATION_STATUSES = [
  "Wishlist",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
] as const;

export type ResumeVersionRecord = {
  id: string;
  versionName: string;
  jobDescriptionSnapshot: string;
  selectedBulletIds: string[];
  finalResumeContent: ResumeDocument;
  timestamp: string;
};

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationRecord = {
  id: string;
  company: string;
  role: string;
  jobLink: string;
  dateApplied: string;
  status: ApplicationStatus;
  resumeVersionId: string | null;
  notes: string;
  jobDescriptionSnapshot?: string;
};

export type CommentAnchor =
  | { scope: "resume" }
  | { scope: "bullet"; bulletId: string };

export type CommentRecord = {
  id: string;
  targetStudentId: string;
  resumeVersionId: string | null;
  anchor: CommentAnchor;
  authorName: string;
  body: string;
  createdAt: string;
  reviewed: boolean;
};
