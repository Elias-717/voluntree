// Screen 11: review attendance for one mission (FR-008).

import { AttendanceReview } from "@/components/attendance-review";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

export default async function ReviewMission({ params }: PageProps<"/organizer/mission/[id]">) {
  await requireRole("organizer");
  const { id } = await params;
  const supabase = await createClient();
  return <AttendanceReview supabase={supabase} missionId={id} admin={false} />;
}
