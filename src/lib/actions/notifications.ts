"use server";

// Opening the inbox marks everything in it as read (FR-012, DEC-058). Row-level security limits the
// update to the signed-in person's own notifications; only read_at can change.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";

export async function markAllRead() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  revalidatePath("/", "layout");
}
