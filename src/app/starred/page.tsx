"use client";

import { useState } from "react";
import TopSearchBar from "~/components/layout/top-search-bar";
import AppSidebar from "~/components/layout/app-sidebar";
import InboxHeader from "~/components/inbox/inbox-header";
import EmailList from "~/components/inbox/email-list";
import UpcomingMeetings from "~/components/calendar_inbox/upcoming-meetings";
import AiRecommendations from "~/components/ai/ai-recommendations";
import AiPanel from "~/components/ai/ai-panel";

export default function StarredPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("primary");

  return (
    <div className="bg-background text-on-background flex h-screen flex-col overflow-hidden">
      <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar isOpen={isSidebarOpen} />
        <main className="bg-surface flex flex-1 flex-col overflow-hidden p-6 transition-all">
          <InboxHeader
            page={page}
            onPageChange={setPage}
            total={total}
            category={category}
            onCategoryChange={setCategory}
          />
          <div className="flex min-h-0 flex-1 gap-6">
            <EmailList
              page={page}
              category={category}
              isStarredOnly={true}
              onTotalChange={setTotal}
            />
            <div className="flex min-w-0 flex-[0.42] flex-col gap-6">
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
