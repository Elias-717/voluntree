// The five student tab screens share the bottom tab bar and the inbox bell (FR-012), and refresh
// every few seconds (FR-011), which also keeps the bell's count live.

import { AutoRefresh } from "@/components/auto-refresh";
import { NotificationBell } from "@/components/notification-bell";
import { createClient } from "@/lib/db/server";
import { unreadCount } from "@/lib/db/notifications";
import { TabBar } from "./tab-bar";

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const count = await unreadCount(await createClient());
  return (
    <>
      <div className="relative flex flex-1 flex-col px-4 pb-6 pt-5">
        <NotificationBell href="/student/inbox" count={count} className="absolute right-4 top-5 z-10" />
        {children}
      </div>
      <TabBar />
      <AutoRefresh />
    </>
  );
}
