// Reads a student's data and builds the inputs for Khathera's matching engine (DEC-036).
// Every query runs as the signed-in student, so row-level security decides what is visible.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Commitment, Mission, Student } from "@/types/domain";

export interface MissionRow {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  required_skills: string[];
  place: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: Mission["status"];
  source: Mission["source"];
  eligible_schools: Mission["eligibleSchools"];
  min_cgpa: number | null;
  dean_approval_required: boolean;
  safety_notes: string | null;
}

export const MISSION_COLUMNS =
  "id, organization_id, title, description, required_skills, place, starts_at, ends_at, capacity, status, source, eligible_schools, min_cgpa, dean_approval_required, safety_notes";

/** Spots held (accepted plus pending dean approval) on each published mission. */
export async function loadSpotsHeld(supabase: SupabaseClient): Promise<Map<string, number>> {
  const { data } = await supabase.rpc("mission_spots");
  return new Map(((data ?? []) as { mission_id: string; held: number }[]).map((r) => [r.mission_id, r.held]));
}

export function toMission(row: MissionRow, held: number): Mission {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    // Skills are shown to students but not ranked on (DEC-050): students have no way to declare
    // theirs yet, so matching skips the skill factor and shares its weight among the others.
    requiredSkills: [],
    window: { start: row.starts_at, end: row.ends_at },
    capacity: row.capacity,
    acceptedCount: held,
    status: row.status,
    source: row.source,
    eligibleSchools: row.eligible_schools,
    minCgpa: row.min_cgpa === null ? null : Number(row.min_cgpa),
    deanApprovalRequired: row.dean_approval_required,
  };
}

/** Published missions that have not started yet. Matching has no clock, so we filter here. */
export async function loadUpcomingMissions(supabase: SupabaseClient): Promise<MissionRow[]> {
  const { data } = await supabase
    .from("missions")
    .select(MISSION_COLUMNS)
    .eq("status", "PUBLISHED")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at");
  return (data ?? []) as MissionRow[];
}

/** The student as matching sees them. */
export async function loadStudent(supabase: SupabaseClient, studentId: string, displayName: string): Promise<Student> {
  const [{ data: details }, { data: assignments }, { count: approved }] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("skills, matching_opt_out, school, cgpa")
      .eq("user_id", studentId)
      .single(),
    // Every assignment, in all three statuses (DEC-036).
    supabase
      .from("mission_assignments")
      .select("mission_id, status, missions(starts_at, ends_at, status)")
      .eq("student_id", studentId),
    // All of the student's approved participations, all time (DEC-036).
    supabase
      .from("completions")
      .select("id, mission_assignments!inner(student_id)", { count: "exact", head: true })
      .eq("status", "APPROVED")
      .eq("mission_assignments.student_id", studentId),
  ]);

  // Cancelled missions no longer hold the student's time (DEC-047).
  const commitments: Commitment[] = ((assignments ?? []) as unknown as {
    mission_id: string;
    status: Commitment["status"];
    missions: { starts_at: string; ends_at: string; status: string };
  }[]).filter((a) => a.missions.status !== "CANCELLED").map((a) => ({
    missionId: a.mission_id,
    status: a.status,
    window: { start: a.missions.starts_at, end: a.missions.ends_at },
  }));

  return {
    id: studentId,
    displayName,
    skills: details?.skills ?? [],
    // No declared availability (DEC-048): students only accept missions they can attend.
    // Matching reads an empty list as unknown and excludes no one for it.
    availability: [],
    matchingOptOut: details?.matching_opt_out ?? false,
    school: details?.school ?? "SBSS",
    cgpa: details?.cgpa === null || details?.cgpa === undefined ? null : Number(details.cgpa),
    recentOpportunities: approved ?? 0,
    // No verified reliability data exists yet, so everyone gets the neutral cold-start value.
    reliability: null,
    commitments,
  };
}

/** Net waterings from the append-only ledger (FR-009). */
export async function loadWaterings(supabase: SupabaseClient, studentId: string): Promise<number> {
  const { data } = await supabase.from("watering_totals").select("waterings").eq("student_id", studentId).maybeSingle();
  return Math.max(0, data?.waterings ?? 0);
}
