import { StaffShell } from "@/components/staff-shell";
import { unreadCount } from "@/lib/db/notifications";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

// Signed-in pages read the session cookie, so they render per request.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const me = await requireRole("admin");
  const supabase = await createClient();
  const [{ count }, unread] = await Promise.all([
    supabase
      .from("mission_assignments")
      .select("id, missions!inner(status)", { count: "exact", head: true })
      .eq("status", "PENDING_DEAN_APPROVAL")
      .neq("missions.status", "CANCELLED"),
    unreadCount(supabase),
  ]);

  return (
    <StaffShell
      home="/admin"
      name={me.displayName}
      roleLabel="Admin"
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/missions", label: "Missions" },
        { href: "/admin/dean", label: "Dean approvals", badge: count ?? 0 },
        { href: "/admin/approvals", label: "Approvals" },
        { href: "/admin/inbox", label: "Inbox", badge: unread },
      ]}
    >
      {children}
    </StaffShell>
  );
}
