// Admin inbox (FR-012, DEC-058).

import { Inbox } from "@/components/inbox";
import { loadNotifications } from "@/lib/db/notifications";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";

export default async function InboxPage() {
  await requireRole("admin");
  return <Inbox notifications={await loadNotifications(await createClient())} />;
}
