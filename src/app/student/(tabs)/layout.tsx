// The five student tab screens share the bottom tab bar, and refresh every few seconds (FR-011).

import { AutoRefresh } from "@/components/auto-refresh";
import { TabBar } from "./tab-bar";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-1 flex-col px-4 pb-6 pt-5">{children}</div>
      <TabBar />
      <AutoRefresh />
    </>
  );
}
