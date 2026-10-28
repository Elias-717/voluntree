"use server";

// Sign-in (FR-001). Demo accounts only for the Oct 29 build (DEC-041); one tap signs in as a
// demo user with the shared DEMO_PASSWORD, which never leaves the server (DEC-026).

import { redirect } from "next/navigation";
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
  await supabase.auth.signOut();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_USERS[who],
    password: process.env.DEMO_PASSWORD ?? "",
  });
  if (error) throw new Error("Demo sign-in failed. Check DEMO_PASSWORD on the server.");
  await goHome();
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
