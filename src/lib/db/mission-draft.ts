// Turns a saved mission into the form's starting values, in Malaysia time.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MissionDraft } from "@/components/mission-form";
import { MISSION_COLUMNS, type MissionRow } from "./student";

const TZ = "Asia/Kuala_Lumpur";
const dateOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
const timeOf = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

export async function loadDraft(supabase: SupabaseClient, id: string | undefined) {
  if (!id) return { draft: undefined, locked: false };
  const [{ data }, { count }] = await Promise.all([
    supabase.from("missions").select(MISSION_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("mission_assignments").select("id", { count: "exact", head: true }).eq("mission_id", id),
  ]);
  if (!data) return { draft: undefined, locked: false };
  const m = data as MissionRow;
  const draft: MissionDraft = {
    id: m.id,
    title: m.title ?? "",
    description: m.description ?? "",
    place: m.place ?? "",
    skills: m.required_skills.join(", "),
    date: m.starts_at ? dateOf(m.starts_at) : "",
    start: m.starts_at ? timeOf(m.starts_at) : "",
    end: m.ends_at ? timeOf(m.ends_at) : "",
    capacity: m.capacity,
    safety: m.safety_notes ?? "",
    eligibleSchools: m.eligible_schools,
    minCgpa: m.min_cgpa === null ? null : Number(m.min_cgpa),
    dean: m.dean_approval_required,
  };
  return { draft, locked: (count ?? 0) > 0 };
}
