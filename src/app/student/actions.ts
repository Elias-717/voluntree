"use server";

// Student onboarding: consent (FR-025), then school, CGPA and phone (FR-028, DEC-040).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { School } from "@/types/domain";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

/** Bump this when the notice text changes, so every student sees it again. */
const CONSENT_VERSION = "2026-10-v1";

const SCHOOLS: School[] = ["SBSS", "SEHS", "SCI", "CFGS", "LC"];
const PHONE = /^\+?[0-9][0-9 ()-]{6,19}$/;

export async function giveConsent(form: FormData) {
  await requireRole("student");
  const suggest = form.get("suggest") === "on";
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_consent", { p_version: CONSENT_VERSION, p_opt_out: !suggest });
  if (error) throw new Error(error.message);
  redirect("/student/school");
}

export async function saveSchool(_state: string | null, form: FormData): Promise<string | null> {
  const me = await requireRole("student");
  const school = String(form.get("school") ?? "") as School;
  // "Skip CGPA for now" saves the rest without a CGPA.
  const cgpaText = form.get("skip") ? "" : String(form.get("cgpa") ?? "").trim();
  const phoneText = String(form.get("phone") ?? "").trim();

  if (!SCHOOLS.includes(school)) return "Pick your school.";
  const cgpa = cgpaText === "" ? null : Number(cgpaText);
  if (cgpa !== null && !(cgpa >= 0 && cgpa <= 4)) return "CGPA must be between 0.00 and 4.00.";
  if (phoneText !== "" && !PHONE.test(phoneText)) return "That phone number doesn't look right.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("student_profiles")
    .update({
      school,
      cgpa: cgpa === null ? null : Math.round(cgpa * 100) / 100,
      phone: phoneText === "" ? null : phoneText,
    })
    .eq("user_id", me.id);
  if (error) return "Couldn't save. Please try again.";
  // From Me, go back to Me; during onboarding, on to the seed screen.
  redirect(form.get("back") === "me" ? "/student/me" : "/student/planted");
}

/** The "Suggest missions for me" switch in Me: the same consent record, with the new choice (FR-025). */
export async function setSuggestions(on: boolean) {
  await requireRole("student");
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_consent", { p_version: CONSENT_VERSION, p_opt_out: !on });
  if (error) throw new Error(error.message);
  revalidatePath("/student", "layout");
}

// accept_mission enforces capacity, eligibility, overlap and duplicates (FR-006, FR-029, FR-030).
const ACCEPT_ERRORS: Record<string, string> = {
  MISSION_FULL: "All spots were just taken.",
  TIME_CONFLICT: "This overlaps another mission you joined.",
  NOT_ELIGIBLE: "This mission isn't open to you.",
  NOT_PUBLISHED: "This mission is no longer open.",
  ALREADY_REJECTED: "The dean didn't approve this one, so you can't join it again.",
};

const CHECK_IN_ERRORS: Record<string, string> = {
  BAD_CODE: "This code has expired. Scan the QR on the organizer's screen again.",
  NOT_ACCEPTED: "You aren't confirmed on this mission.",
  NOT_OPEN: "Check-in isn't running for this mission right now.",
};

/** QR check-in (FR-016, DEC-052): records that the student is here. The organizer still approves attendance. */
export async function checkIn(missionId: string, code: string): Promise<string | null> {
  await requireRole("student");
  const supabase = await createClient();
  const { error } = await supabase.rpc("check_in", { p_mission_id: missionId, p_code: code });
  if (error) return CHECK_IN_ERRORS[error.message.split(":")[0]] ?? "Couldn't check in. Please try again.";
  revalidatePath(`/student/check-in/${missionId}`);
  return null;
}

export async function acceptMission(missionId: string): Promise<string | null> {
  await requireRole("student");
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_mission", { p_mission_id: missionId });
  if (error) return ACCEPT_ERRORS[error.message.split(":")[0]] ?? "Couldn't join. Please try again.";
  redirect("/student/missions?joined=1");
}
