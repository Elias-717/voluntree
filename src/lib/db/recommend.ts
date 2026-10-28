// Ranked missions for one student: matching first (FR-007), then everything else they can browse (FR-025).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Recommendation } from "@/types/domain";
import { recommendMissionsForStudent } from "@/lib/matching/matching";
import { loadSpotsHeld, loadStudent, loadUpcomingMissions, toMission, type MissionRow } from "./student";

export interface MissionCard {
  row: MissionRow;
  spotsLeft: number;
  recommendation: Recommendation | null;
}

export async function loadMissionCards(supabase: SupabaseClient, studentId: string, displayName: string) {
  const [student, rows, held] = await Promise.all([
    loadStudent(supabase, studentId, displayName),
    loadUpcomingMissions(supabase),
    loadSpotsHeld(supabase),
  ]);
  const missions = rows.map((row) => toMission(row, held.get(row.id) ?? 0));
  const recommendations = recommendMissionsForStudent(student, missions);
  const byMission = new Map(recommendations.map((r) => [r.missionId, r]));

  const cards: MissionCard[] = rows.map((row) => ({
    row,
    spotsLeft: Math.max(0, row.capacity - (held.get(row.id) ?? 0)),
    recommendation: byMission.get(row.id) ?? null,
  }));
  // Recommended missions in matching's order, then the rest by date.
  const rank = new Map(recommendations.map((r, i) => [r.missionId, i]));
  cards.sort((a, b) => (rank.get(a.row.id) ?? 1e6) - (rank.get(b.row.id) ?? 1e6) || a.row.starts_at.localeCompare(b.row.starts_at));
  return { student, cards, recommended: cards.filter((c) => c.recommendation) };
}

/** "Everyone", "SCI only" or "SCI, SBSS". */
export function openTo(row: Pick<MissionRow, "eligible_schools">) {
  const schools = row.eligible_schools;
  if (schools.length === 0) return "Everyone";
  return schools.length === 1 ? `${schools[0]} only` : schools.join(", ");
}
