"use server";

// Sign-in (FR-001). Demo accounts only for the Oct 29 build (DEC-041); one tap signs in as a
// demo user with the shared DEMO_PASSWORD, which never leaves the server (DEC-026).

import { randomBytes, randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/db/admin";
import { createClient } from "@/lib/db/server";
import { homeFor, getMe } from "@/lib/db/session";

const DEMO_USERS = {
  student: "farid@voluntree.test",
  organizer: "organizer@voluntree.test",
  admin: "admin@voluntree.test",
} as const;

export async function signInWithEmail(_state: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return "Enter your email and password.";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "That email and password don't match.";
  await goHome();
  return null;
}

export async function signInAsDemo(who: keyof typeof DEMO_USERS) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_USERS[who],
    password: process.env.DEMO_PASSWORD ?? "",
  });
  if (error) throw new Error("Demo sign-in failed. Check DEMO_PASSWORD on the server.");
  await goHome();
}

/**
 * "Try as a new student" (DEC-055): creates a synthetic guest student ("Guest 4821", a made-up
 * @voluntree.test email, a random password nobody sees), signs them in, and starts onboarding at the
 * consent screen. No real student data (AGENTS.md rule 10).
 */
export async function signInAsGuest(): Promise<string | null> {
  const number = randomInt(1000, 10000);
  const email = `guest-${number}-${randomBytes(4).toString("hex")}@voluntree.test`;
  const password = randomBytes(18).toString("base64url");

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw error ?? new Error("no user");
    const id = data.user.id;
    const profile = await admin.from("profiles").insert({ id, role: "student", display_name: `Guest ${number}`, is_guest: true });
    if (profile.error) throw profile.error;
    // A school is required; the guest picks their own on the next onboarding screen.
    const details = await admin.from("student_profiles").insert({ user_id: id, school: "SBSS" });
    if (details.error) throw details.error;
  } catch {
    return "Couldn't create a guest account. Try the demo student instead.";
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "Couldn't sign in the guest account. Try the demo student instead.";
  redirect("/student/welcome");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

async function goHome() {
  const me = await getMe();
  redirect(me ? homeFor(me.role) : "/");
}
