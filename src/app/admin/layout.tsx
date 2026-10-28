import { StaffShell } from "@/components/staff-shell";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

// Signed-in pages read the session cookie, so they render per request.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const me = await requireRole("admin");
  const supabase = await createClient();
  const { count } = await supabase
    .from("mission_assignments")
    .select("id, missions!inner(status)", { count: "exact", head: true })
    .eq("status", "PENDING_DEAN_APPROVAL")
    .neq("missions.status", "CANCELLED");

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
      ]}
    >
      {children}
    </StaffShell>
  );
}
