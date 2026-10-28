"use server";

// Student onboarding: consent (FR-025), then school, CGPA and phone (FR-028, DEC-040).

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
  redirect("/student/planted");
}
