// In-app notifications (FR-012, DEC-058). The database writes them; row-level security shows each
// person only their own, so these queries need no user filter.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface Notification {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

export async function unreadCount(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  return count ?? 0;
}

export async function loadNotifications(supabase: SupabaseClient): Promise<Notification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Notification[];
}
