"use client";

import {
  MoreVertical,
  RefreshCw,
  Square,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import InboxFilters from "./inbox-filters";
import { api } from "~/trpc/react";

interface InboxHeaderProps {
  page: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
  category: string;
  onCategoryChange: (category: string) => void;
}

export default function InboxHeader({
  page,
  onPageChange,
  total = 0,
  pageSize = 50,
  category,
  onCategoryChange,
}: InboxHeaderProps) {
  const utils = api.useUtils();

  const { mutate: refreshInbox, isPending: isRefreshing } =
    api.email.refreshInbox.useMutation({
      onSuccess: () => {
        // Re-fetch the inbox list and reset to page 1
        void utils.email.getInboxThreads.invalidate();
        onPageChange(1);
      },
    });

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageCount = Math.ceil(total / pageSize);

  const isFirst = page <= 1;
  const isLast = page >= pageCount || total === 0;

  return (
    <div className="mb-4 flex shrink-0 flex-col gap-4 rounded-lg bg-[#ffffff] p-3">
      <div className="flex items-center justify-between">
        {/* Left Actions */}
        <div className="flex items-center gap-2">
          <button className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100">
            <Square size={18} />
          </button>

          <button
            onClick={() => refreshInbox()}
            disabled={isRefreshing}
            title="Sync inbox from Gmail"
            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>

          <button className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Right Pagination */}
        <div className="flex items-center gap-1 text-[13px] font-medium text-[#5f6368]">
          <span className="mr-2 tabular-nums">
            {total === 0 ? "0" : `${start}–${end}`} of {total}
          </span>

          <button
            onClick={() => onPageChange(page - 1)}
            disabled={isFirst}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#f1f3f4] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={isLast}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#f1f3f4] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <InboxFilters category={category} onCategoryChange={onCategoryChange} />
    </div>
  );
}
