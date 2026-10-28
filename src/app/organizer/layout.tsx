import { StaffShell } from "@/components/staff-shell";
import { requireRole } from "@/lib/db/session";

// Signed-in pages read the session cookie, so they render per request.
export const instant = false;

export default async function OrganizerLayout({ children }: LayoutProps<"/organizer">) {
  const me = await requireRole("organizer");
  return (
    <StaffShell
      home="/organizer"
      name={me.displayName}
      roleLabel="Organizer"
      nav={[
        { href: "/organizer", label: "My missions" },
        { href: "/organizer/new", label: "New mission" },
      ]}
    >
      {children}
    </StaffShell>
  );
}
