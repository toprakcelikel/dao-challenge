// Shared string-literal types and values (SQLite has no enums, so these are
// enforced in app code rather than the database).

export type Role = "STUDENT" | "ADMIN";
export type ChallengeStatus = "LOCKED" | "ACTIVE" | "COMPLETED";
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export const ChallengeStatus = {
  LOCKED: "LOCKED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;

export const SubmissionStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const Role = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
} as const;

// Points awarded per challenge difficulty when a submission is approved.
export const DIFFICULTY_POINTS: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 4,
};
