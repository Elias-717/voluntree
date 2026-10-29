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
        {/* Positioned by this wrapper: the bell itself is `relative` (for its badge), which would win
            over `absolute` and leave it in the flow, on top of page titles and back buttons. */}
        <div className="absolute right-4 top-5 z-10">
          <NotificationBell href="/student/inbox" count={count} />
        </div>
        {children}
      </div>
      <TabBar />
      <AutoRefresh />
    </>
  );
}
