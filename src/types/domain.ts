// Shared types for matching (FR-007, FR-024; SRS §10).
// Matching inputs and outputs only. Database row types are generated separately.
// Only Elias's sessions edit this file.

export type Role = "student" | "organizer" | "admin";

/** ISO 8601 timestamp string, e.g. "2026-11-02T09:00:00+08:00". */
export type ISODateTime = string;

export interface TimeWindow {
  start: ISODateTime;
  end: ISODateTime;
}

/** A mission the student has already accepted, used for time-conflict checks. */
export interface Commitment {
  missionId: string;
  window: TimeWindow;
}

export interface Student {
  id: string;
  displayName: string;
  skills: string[];
  availability: TimeWindow[];
  matchingOptOut: boolean;
  /** Approved participations in the look-back window (FR-024). */
  recentOpportunities: number;
  /** 0..1. null means a new student, who gets the neutral default (cold start). */
  reliability: number | null;
  /** Coarse 0..1 score, never an exact location. Omitted when unavailable; weights re-normalize. */
  proximity?: number;
  commitments: Commitment[];
}

/** Oct 29 build states (FR-005). Intermediate states are Stretch. */
export type MissionStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";

export interface Mission {
  id: string;
  organizationId: string;
  title: string;
  requiredSkills: string[];
  window: TimeWindow;
  capacity: number;
  acceptedCount: number;
  status: MissionStatus;
  source: "manual" | "ai_draft";
}

export type FactorName =
  | "skill"
  | "availability"
  | "opportunityBalance"
  | "proximity"
  | "reliability";

/** One line of the "Why recommended" panel. */
export interface Factor {
  name: FactorName;
  /** Weight after re-normalization, 0..1. */
  weight: number;
  /** Raw factor value, 0..1. */
  value: number;
  /** weight * value. */
  contribution: number;
  explanation: string;
}

export interface Recommendation {
  missionId: string;
  studentId: string;
  /** Sum of factor contributions, 0..1. */
  score: number;
  factors: Factor[];
  algorithmVersion: string;
}

export type ExclusionReason =
  | "TIME_CONFLICT"
  | "MISSING_ELIGIBILITY"
  | "OPTED_OUT"
  | "MISSION_FULL";

export interface Exclusion {
  studentId: string;
  /** Every hard filter the student failed. */
  reasons: ExclusionReason[];
}

/** What the matching function returns. */
export interface MatchResult {
  recommendations: Recommendation[];
  exclusions: Exclusion[];
}
