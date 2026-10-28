// Allocation simulation (FR-026): Voluntree matching vs first-come-first-served.
//
// Shared rules for every method:
// 1. Missions are allocated one at a time, in start-time order, at each mission's start time.
// 2. The candidate pool is the students who want the mission (shared interest table) and who
//    pass the matching engine's own Stage 1 filters right now: no time conflict with a mission
//    they already got, availability, school, minimum CGPA and capacity (DEC-036).
// 3. The only difference between methods is the ORDER in which that pool gets the slots:
//    Voluntree uses the engine's ranking, FCFS uses the pre-generated arrival order.
// 4. A placed student gets a commitment immediately, which blocks overlapping missions.
// 5. Their approval counts towards recentOpportunities only once the mission has finished,
//    i.e. for missions that start at or after its end time.
// 6. Everyone placed attends and is approved; deans approve every pending request.

import type { Commitment, Mission, Student } from "../../src/types/domain";
import { matchStudentsToMission } from "../../src/lib/matching/matching";
import type { Scenario } from "./generate";

export type Method = "voluntree" | "fcfs-random" | "fcfs-engaged";

export const METHODS: Method[] = ["voluntree", "fcfs-random", "fcfs-engaged"];

export interface Placement {
  missionId: string;
  studentId: string;
}

export interface Allocation {
  method: Method;
  /** In allocation order. */
  placements: Placement[];
  /** New simulated placements per student (history not included). */
  newCount: Record<string, number>;
  /** Size of each mission's candidate pool at the moment it was allocated. */
  candidatePool: Record<string, number>;
}

/** Missions in the order they are allocated: start time, then ID. */
export function missionsInOrder(missions: Mission[]): Mission[] {
  return [...missions].sort(
    (a, b) =>
      Date.parse(a.window.start) - Date.parse(b.window.start) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

export function allocate(scenario: Scenario, method: Method): Allocation {
  const commitments: Record<string, Commitment[]> = {};
  const approved: Record<string, number> = {};
  const newCount: Record<string, number> = {};
  for (const s of scenario.students) {
    commitments[s.id] = [];
    approved[s.id] = 0;
    newCount[s.id] = 0;
  }
  const notYetApproved: { end: number; studentIds: string[] }[] = [];
  const placements: Placement[] = [];
  const candidatePool: Record<string, number> = {};

  for (const mission of missionsInOrder(scenario.missions)) {
    const now = Date.parse(mission.window.start);

    // Approvals for missions that have finished by now feed into the ranking from here on.
    for (const done of notYetApproved.filter((p) => p.end <= now)) {
      done.studentIds.forEach((id) => approved[id]++);
      notYetApproved.splice(notYetApproved.indexOf(done), 1);
    }

    const pool = currentCandidatePool(scenario, mission, commitments, approved);
    candidatePool[mission.id] = pool.length;

    const order =
      method === "voluntree"
        ? pool // already in the engine's ranking order
        : arrivalOrder(scenario, method, mission.id).filter((id) => pool.includes(id));
    const chosen = order.slice(0, mission.capacity);

    for (const studentId of chosen) {
      placements.push({ missionId: mission.id, studentId });
      newCount[studentId]++;
      commitments[studentId].push({ missionId: mission.id, window: mission.window, status: "ACCEPTED" });
    }
    notYetApproved.push({ end: Date.parse(mission.window.end), studentIds: chosen });
  }

  return { method, placements, newCount, candidatePool };
}

/**
 * IDs of interested students who pass the engine's Stage 1 filters for this mission now,
 * in the engine's ranking order (highest score first).
 */
function currentCandidatePool(
  scenario: Scenario,
  mission: Mission,
  commitments: Record<string, Commitment[]>,
  approved: Record<string, number>,
): string[] {
  const interested = new Set(scenario.interest[mission.id]);
  const candidates: Student[] = scenario.students
    .filter((s) => interested.has(s.id))
    .map((s) => ({
      ...s,
      recentOpportunities: scenario.history[s.id] + approved[s.id],
      commitments: [...commitments[s.id]],
    }));
  return matchStudentsToMission(mission, candidates).recommendations.map((r) => r.studentId);
}

function arrivalOrder(scenario: Scenario, method: Method, missionId: string): string[] {
  return method === "fcfs-engaged" ? scenario.arrivalEngaged[missionId] : scenario.arrivalRandom[missionId];
}
