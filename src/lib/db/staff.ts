// Reads for organizer and admin screens. Row-level security limits organizers to their own
// organization's missions and the students on them; admins see everything.

import type { SupabaseClient } from "@supabase/supabase-js";
import { MISSION_COLUMNS, type MissionRow } from "./student";

export interface StaffMission extends MissionRow {
  held: number;
  toReview: number;
  approved: number;
}

type AssignmentRow = {
  mission_id: string;
  status: "PENDING_DEAN_APPROVAL" | "ACCEPTED" | "DEAN_REJECTED";
  completions: { status: string } | { status: string }[] | null;
};

/** Missions with their spot and review counts. Pass organization ids to limit the list. */
export async function loadStaffMissions(supabase: SupabaseClient, organizationIds?: string[]): Promise<StaffMission[]> {
  let query = supabase.from("missions").select(MISSION_COLUMNS).neq("status", "CANCELLED").order("starts_at", { ascending: false });
  if (organizationIds) query = query.in("organization_id", organizationIds);
  const { data: missions } = await query;
  const rows = (missions ?? []) as MissionRow[];
  if (rows.length === 0) return [];

  const { data: assignments } = await supabase
    .from("mission_assignments")
    .select("mission_id, status, completions(status)")
    .in("mission_id", rows.map((m) => m.id));

  const now = new Date().toISOString();
  return rows.map((m) => {
    const mine = ((assignments ?? []) as AssignmentRow[]).filter((a) => a.mission_id === m.id);
    const completionOf = (a: AssignmentRow) => (Array.isArray(a.completions) ? a.completions[0] : a.completions);
    return {
      ...m,
      held: mine.filter((a) => a.status !== "DEAN_REJECTED").length,
      // Ended missions whose accepted students have no attendance decision yet.
      toReview: m.ends_at && m.ends_at <= now ? mine.filter((a) => a.status === "ACCEPTED" && !completionOf(a)).length : 0,
      approved: mine.filter((a) => completionOf(a)?.status === "APPROVED").length,
    };
  });
}

/** The organizations this organizer belongs to. */
export async function myOrganizationIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await supabase.from("organization_members").select("organization_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.organization_id as string);
}
