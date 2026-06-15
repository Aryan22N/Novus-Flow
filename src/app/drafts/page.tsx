"use client";

import { useState } from "react";
import TopSearchBar from "~/components/layout/top-search-bar";
import AppSidebar from "~/components/layout/app-sidebar";
import DraftMailList from "~/components/drafts/draft-mail-list";
import DraftsHeader from "~/components/drafts/drafts-header";
import UpcomingMeetings from "~/components/calendar_inbox/upcoming-meetings";

import AiPanel from "~/components/ai/ai-panel";

export default function DraftsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [currentDrafts, setCurrentDrafts] = useState<{ id: string }[]>([]);

  return (
    <div className="bg-background text-on-background flex flex-col h-screen overflow-hidden">
      <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar isOpen={isSidebarOpen} />
        <main className="flex-1 overflow-hidden p-1 bg-surface transition-all flex flex-col min-w-0">
          <DraftsHeader
            selectedDrafts={selectedDrafts}
            setSelectedDrafts={setSelectedDrafts}
            drafts={currentDrafts}
          />
          <div className="flex gap-4 flex-1 min-h-0">
            <DraftMailList
              selectedDrafts={selectedDrafts}
              setSelectedDrafts={setSelectedDrafts}
              onDraftsChange={setCurrentDrafts}
            />
            {/* <div className="flex-[0.28] flex flex-col gap-6 min-w-0">
              <UpcomingMeetings />
              
            </div> */}
          </div>
        </main>
        <AiPanel />
      </div>
    </div>
  );
}
