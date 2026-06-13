"use client";

import { useState } from "react";
import TopSearchBar from "~/components/layout/top-search-bar";
import AppSidebar from "~/components/layout/app-sidebar";
import DraftMailList from "~/components/drafts/draft-mail-list";
import UpcomingMeetings from "~/components/calendar_inbox/upcoming-meetings";
import AiRecommendations from "~/components/ai/ai-recommendations";
import AiPanel from "~/components/ai/ai-panel";

export default function DraftsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="bg-background text-on-background flex flex-col h-screen overflow-hidden">
      <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar isOpen={isSidebarOpen} />
        <main className="flex-1 overflow-hidden p-6 bg-surface transition-all flex flex-col">
          <div className="mb-4 rounded-lg bg-[#ffffff] flex shrink-0 flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold px-2 py-2">Drafts</h1>
            </div>
          </div>
          <div className="flex gap-6 flex-1 min-h-0">
            <DraftMailList />
            <div className="flex-[0.28] flex flex-col gap-6 min-w-0">
              <UpcomingMeetings />
              <AiRecommendations />
            </div>
          </div>
        </main>
        <AiPanel />
      </div>
    </div>
  );
}
