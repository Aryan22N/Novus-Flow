"use client";

import { useState } from "react";
import TopSearchBar from "~/components/layout/top-search-bar";
import AppSidebar from "~/components/layout/app-sidebar";
import SentMailList from "~/components/sent/sent-mail-list";
import UpcomingMeetings from "~/components/calendar_inbox/upcoming-meetings";

import AiPanel from "~/components/ai/ai-panel";

export default function SentPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="bg-background text-on-background flex h-screen flex-col overflow-hidden">
      <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar isOpen={isSidebarOpen} />
        <main className="bg-surface flex flex-1 flex-col overflow-hidden p-6 transition-all">
          <div className="mb-4 flex shrink-0 flex-col gap-4 rounded-lg bg-[#ffffff]">
            <div className="flex items-center justify-between">
              <h1 className="px-2 py-2 text-xl font-semibold">Sent Mail</h1>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 gap-6">
            <SentMailList />
            <div className="flex min-w-0 flex-[0.28] flex-col gap-6">
              <UpcomingMeetings />
              
            </div>
          </div>
        </main>
        <AiPanel />
      </div>
    </div>
  );
}
