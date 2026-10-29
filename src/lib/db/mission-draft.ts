// Turns a saved mission into the form's starting values, in Malaysia time.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MissionDraft } from "@/components/mission-form";
import { MISSION_COLUMNS, type MissionRow } from "./student";

/** The certificate design chosen for the mission (DEC-063); only the form needs these. */
const CERTIFICATE_COLUMNS = "certificate_template, certificate_accent, certificate_description";

const TZ = "Asia/Kuala_Lumpur";
const dateOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
const timeOf = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

export async function loadDraft(supabase: SupabaseClient, id: string | undefined) {
  if (!id) return { draft: undefined, locked: false, held: 0, published: false, started: false };
  const [{ data }, { data: assignments }] = await Promise.all([
    supabase.from("missions").select(`${MISSION_COLUMNS}, ${CERTIFICATE_COLUMNS}`).eq("id", id).maybeSingle(),
    supabase.from("mission_assignments").select("status").eq("mission_id", id),
  ]);
  if (!data) return { draft: undefined, locked: false, held: 0, published: false, started: false };
  const m = data as unknown as MissionRow & { certificate_template: string; certificate_accent: string; certificate_description: string | null };
  const rows = (assignments ?? []) as { status: string }[];
  // Students holding a spot (pending dean approval or accepted). Any one locks the date and time (DEC-057).
  const held = rows.filter((a) => a.status !== "DEAN_REJECTED").length;
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
    certTemplate: m.certificate_template,
    certAccent: m.certificate_accent,
    certDescription: m.certificate_description ?? "",
  };
  return {
    draft,
    locked: rows.length > 0,
    held,
    published: m.status === "PUBLISHED",
    started: m.starts_at !== null && new Date(m.starts_at) <= new Date(),
  };
}
