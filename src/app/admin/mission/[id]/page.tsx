// Admin view of one mission's attendance, with revoke (FR-010).

import { AttendanceReview } from "@/components/attendance-review";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

export default async function AdminMission({ params }: PageProps<"/admin/mission/[id]">) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();
  return <AttendanceReview supabase={supabase} missionId={id} admin />;
}
