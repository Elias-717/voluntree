// Who is signed in, and where their home screen is.

import { redirect } from "next/navigation";
import type { Role } from "@/types/domain";
import { createClient } from "./server";

export interface Me {
  id: string;
  role: Role;
  displayName: string;
  consentVersion: string | null;
}

/** The signed-in user's profile, or null when signed out. */
export async function getMe(): Promise<Me | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, display_name, consent_version")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return { id: data.id, role: data.role, displayName: data.display_name, consentVersion: data.consent_version };
}

/** Signs-out visitors go to sign-in; a user with the wrong role goes to their own home. */
export async function requireRole(role: Role): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (me.role !== role) redirect(homeFor(me.role));
  return me;
}

export function homeFor(role: Role): string {
  if (role === "student") return "/student";
  if (role === "organizer") return "/organizer";
  return "/admin";
}
