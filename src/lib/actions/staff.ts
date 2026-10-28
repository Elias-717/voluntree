"use server";

// Organizer and admin actions. The database enforces the rules: who may create or edit a mission,
// admin-only eligibility criteria locked after the first acceptance (BR-14), idempotent approval
// (FR-009) and revocation with a reason (FR-010).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { School } from "@/types/domain";
import { createClient } from "@/lib/db/server";
import { getMe, homeFor } from "@/lib/db/session";
import { myOrganizationIds } from "@/lib/db/staff";

const SCHOOLS: School[] = ["SBSS", "SEHS", "SCI", "CFGS", "LC"];

async function requireStaff() {
  const me = await getMe();
  if (!me || me.role === "student") redirect("/sign-in");
  return me;
}

/** "2026-11-07" + "09:00" → Malaysia time ISO string. */
function toIso(date: string, time: string) {
  return date && time ? `${date}T${time}:00+08:00` : null;
}

export async function saveMission(_state: string | null, form: FormData): Promise<string | null> {
  const me = await requireStaff();
  const supabase = await createClient();
  const publish = form.get("intent") === "publish";
  const text = (name: string) => String(form.get(name) ?? "").trim();

  const startsAt = toIso(text("date"), text("start"));
  const endsAt = toIso(text("date"), text("end"));
  const capacity = text("capacity") === "" ? null : Number(text("capacity"));
  const fields: Record<string, unknown> = {
    title: text("title") || null,
    description: text("description") || null,
    place: text("place") || null,
    required_skills: text("skills").split(",").map((s) => s.trim()).filter(Boolean),
    starts_at: startsAt,
    ends_at: endsAt,
    capacity,
    safety_notes: text("safety") || null,
  };

  if (capacity !== null && !(Number.isInteger(capacity) && capacity > 0)) return "Slots must be a whole number above 0.";
  if (startsAt && endsAt && endsAt <= startsAt) return "The end time must be after the start time.";
  if (publish) {
    const missing = ["title", "description", "place", "starts_at", "capacity"].filter((k) => !fields[k]);
    if (missing.length > 0) return "Fill in title, description, place, date, times and slots to publish.";
    if (new Date(startsAt!) <= new Date()) return "A published mission must start in the future.";
  }

  // Eligibility criteria: admins only (FR-029). The database also rejects them from organizers.
  if (me.role === "admin") {
    fields.eligible_schools = SCHOOLS.filter((s) => form.get(`school-${s}`) === "on");
    fields.min_cgpa = text("minCgpa") === "" ? null : Number(text("minCgpa"));
    fields.dean_approval_required = form.get("dean") === "on";
    if (fields.min_cgpa !== null && !((fields.min_cgpa as number) >= 0 && (fields.min_cgpa as number) <= 4)) {
      return "Minimum CGPA must be between 0.00 and 4.00.";
    }
  }
  if (publish) {
    fields.status = "PUBLISHED";
    fields.published_at = new Date().toISOString();
  }

  const id = text("id");
  let error;
  if (id) {
    ({ error } = await supabase.from("missions").update(fields).eq("id", id));
  } else {
    const organizationId =
      me.role === "admin" ? text("organization") : (await myOrganizationIds(supabase, me.id))[0];
    if (!organizationId) return "You are not a member of any organization.";
    ({ error } = await supabase
      .from("missions")
      .insert({ ...fields, organization_id: organizationId, created_by: me.id, status: publish ? "PUBLISHED" : "DRAFT" }));
  }
  if (error) {
    if (error.message.startsWith("CRITERIA_LOCKED")) return "Eligibility can't change after a student has accepted.";
    if (error.message.startsWith("FORBIDDEN")) return "Only an admin can set eligibility criteria.";
    return "Couldn't save the mission. Please check the fields.";
  }
  revalidatePath(homeFor(me.role), "layout");
  redirect(homeFor(me.role) + (me.role === "admin" ? "/missions" : ""));
}

const REVIEW_ERRORS: Record<string, string> = {
  ALREADY_APPROVED: "Already approved. Only an admin can undo an approval.",
  NOT_ACCEPTED: "This student isn't confirmed on the mission.",
  FORBIDDEN: "Only this mission's organizer or an admin can review attendance.",
};

/** Present: one watering and one certificate, exactly once however often it is pressed (FR-008, FR-009). */
export async function markPresent(assignmentId: string, missionId: string): Promise<string | null> {
  return review("approve_completion", { p_assignment_id: assignmentId, p_note: null }, missionId);
}

/** Absent: no watering, no certificate. */
export async function markAbsent(assignmentId: string, missionId: string): Promise<string | null> {
  return review("reject_completion", { p_assignment_id: assignmentId, p_note: null }, missionId);
}

/** Admin revocation with a required reason (FR-010): removes one watering and revokes the certificate. */
export async function revokeApproval(completionId: string, missionId: string, reason: string): Promise<string | null> {
  if (!reason.trim()) return "Give a reason for the revocation.";
  return review("revoke_completion", { p_completion_id: completionId, p_reason: reason }, missionId);
}

/** The admin records the dean's decision on a pending request (FR-030). */
export async function recordDeanDecision(assignmentId: string, approved: boolean, note: string): Promise<string | null> {
  const me = await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_dean_decision", {
    p_assignment_id: assignmentId, p_approved: approved, p_note: note.trim() || null,
  });
  if (error) return error.message.startsWith("NOT_PENDING") ? "This request was already decided." : "Couldn't save the decision.";
  revalidatePath(homeFor(me.role), "layout");
  return null;
}

async function review(fn: string, args: Record<string, unknown>, missionId: string): Promise<string | null> {
  const me = await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return REVIEW_ERRORS[error.message.split(":")[0]] ?? "Couldn't save. Please try again.";
  revalidatePath(`${homeFor(me.role)}/mission/${missionId}`);
  revalidatePath(homeFor(me.role), "layout");
  return null;
}
