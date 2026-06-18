"use client";

import { useState, useEffect } from "react";
import TopSearchBar from "~/components/layout/top-search-bar";
import AppSidebar from "~/components/layout/app-sidebar";
import InboxHeader from "~/components/inbox/inbox-header";
import EmailList from "~/components/inbox/email-list";
import UpcomingMeetings from "~/components/calendar_inbox/upcoming-meetings";

import AiPanel from "~/components/ai/ai-panel";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function InboxContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("primary");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [currentEmails, setCurrentEmails] = useState<{ id: string }[]>([]);

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  // Clear selection when page, category, or search changes
  useEffect(() => {
    setSelectedEmails([]);
  }, [page, category, searchQuery]);

  return (
    <div className="bg-background text-on-background flex h-screen flex-col overflow-hidden">
      <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar isOpen={isSidebarOpen} />
        <main className="bg-surface flex min-w-0 flex-1 flex-col overflow-hidden p-1 transition-all">
          <InboxHeader
            page={page}
            onPageChange={setPage}
            total={total}
            category={category}
            onCategoryChange={setCategory}
            selectedEmails={selectedEmails}
            setSelectedEmails={setSelectedEmails}
            emails={currentEmails}
            searchQuery={searchQuery}
          />
          <div className="flex min-h-0 flex-1 gap-4">
            <EmailList
              page={page}
              category={category}
              onTotalChange={setTotal}
              selectedEmails={selectedEmails}
              setSelectedEmails={setSelectedEmails}
              onEmailsChange={setCurrentEmails}
              searchQuery={searchQuery}
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

export default function InboxPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InboxContent />
    </Suspense>
  );
}
