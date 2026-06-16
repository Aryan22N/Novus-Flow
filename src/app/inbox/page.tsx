"use client";

import { useState, useEffect } from "react";
import TopSearchBar from "~/components/layout/top-search-bar";
import AppSidebar from "~/components/layout/app-sidebar";
import InboxHeader from "~/components/inbox/inbox-header";
import EmailList from "~/components/inbox/email-list";
import UpcomingMeetings from "~/components/calendar_inbox/upcoming-meetings";

import AiPanel from "~/components/ai/ai-panel";

export default function InboxPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("primary");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [currentEmails, setCurrentEmails] = useState<{ id: string }[]>([]);

  // Clear selection when page or category changes
  useEffect(() => {
    setSelectedEmails([]);
  }, [page, category]);

  return (
    <div className="bg-background text-on-background flex h-screen overflow-hidden flex-col">
      <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <AppSidebar isOpen={isSidebarOpen} />
        <main className="bg-surface flex flex-1 flex-col p-1 transition-all overflow-hidden min-w-0">
          <InboxHeader
            page={page}
            onPageChange={setPage}
            total={total}
            category={category}
            onCategoryChange={setCategory}
            selectedEmails={selectedEmails}
            setSelectedEmails={setSelectedEmails}
            emails={currentEmails}
          />
          <div className="flex min-h-0 flex-1 gap-4">
            <EmailList
              page={page}
              category={category}
              onTotalChange={setTotal}
              selectedEmails={selectedEmails}
              setSelectedEmails={setSelectedEmails}
              onEmailsChange={setCurrentEmails}
            />
            <div className="flex min-w-0 flex-[0.42] flex-col gap-6">
              <UpcomingMeetings />

            </div>
          </div>
        </main>
        {/* <AiPanel /> */}
      </div>
    </div>
  );
}
