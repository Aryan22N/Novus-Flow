"use client";

import { useState } from "react";
import TopSearchBar from "~/components/layout/top-search-bar";
import AppSidebar from "~/components/layout/app-sidebar";
import SentMailList from "~/components/sent/sent-mail-list";
import SentHeader from "~/components/sent/sent-header";
import UpcomingMeetings from "~/components/calendar_inbox/upcoming-meetings";

import AiPanel from "~/components/ai/ai-panel";

export default function SentPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [currentEmails, setCurrentEmails] = useState<{ id: string }[]>([]);

  return (
    <div className="bg-background text-on-background flex h-screen flex-col overflow-hidden">
      <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar isOpen={isSidebarOpen} />
        <main className="bg-surface flex flex-1 flex-col overflow-hidden p-1 transition-all min-w-0">
          <SentHeader
            selectedEmails={selectedEmails}
            setSelectedEmails={setSelectedEmails}
            emails={currentEmails}
          />
          <div className="flex min-h-0 flex-1 gap-4">
            <SentMailList
              selectedEmails={selectedEmails}
              setSelectedEmails={setSelectedEmails}
              onEmailsChange={setCurrentEmails}
            />
            {/* <div className="flex min-w-0 flex-[0.28] flex-col gap-6">
              <UpcomingMeetings />
              
            </div> */}
          </div>
        </main>
        <AiPanel />
      </div>
    </div>
  );
}
