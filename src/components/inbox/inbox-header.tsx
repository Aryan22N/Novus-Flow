"use client";

import {
  MoreVertical,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Archive,
  Trash2,
  MailOpen,
  Mail,
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
  selectedEmails: string[];
  setSelectedEmails: React.Dispatch<React.SetStateAction<string[]>>;
  emails: { id: string }[];
}

export default function InboxHeader({
  page,
  onPageChange,
  total = 0,
  pageSize = 50,
  category,
  onCategoryChange,
  selectedEmails,
  setSelectedEmails,
  emails,
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

  const archiveMutation = api.email.archiveEmails.useMutation({
    onMutate: async ({ ids }) => {
      // Optimistic UI update: remove from getInboxThreads cache immediately!
      await utils.email.getInboxThreads.cancel({ page, category });
      const previousData = utils.email.getInboxThreads.getData({ page, category });
      utils.email.getInboxThreads.setData({ page, category }, (old) => {
        if (!old) return old;
        return {
          ...old,
          emails: old.emails.filter((e) => !ids.includes(e.id)),
          total: Math.max(0, old.total - ids.length),
        };
      });
      // Also invalidate getUnreadCount cache
      await utils.email.getUnreadCount.cancel();
      // Reset selected list
      setSelectedEmails([]);
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      utils.email.getInboxThreads.setData({ page, category }, context?.previousData);
    },
    onSettled: () => {
      void utils.email.getInboxThreads.invalidate();
      void utils.email.getUnreadCount.invalidate();
      void utils.email.getUnreadCounts.invalidate();
    },
  });

  const deleteMutation = api.email.deleteEmails.useMutation({
    onMutate: async ({ ids }) => {
      // Optimistic UI update: remove from getInboxThreads cache immediately!
      await utils.email.getInboxThreads.cancel({ page, category });
      const previousData = utils.email.getInboxThreads.getData({ page, category });
      utils.email.getInboxThreads.setData({ page, category }, (old) => {
        if (!old) return old;
        return {
          ...old,
          emails: old.emails.filter((e) => !ids.includes(e.id)),
          total: Math.max(0, old.total - ids.length),
        };
      });
      // Also invalidate getUnreadCount cache
      await utils.email.getUnreadCount.cancel();
      // Reset selected list
      setSelectedEmails([]);
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      utils.email.getInboxThreads.setData({ page, category }, context?.previousData);
    },
    onSettled: () => {
      void utils.email.getInboxThreads.invalidate();
      void utils.email.getUnreadCount.invalidate();
      void utils.email.getUnreadCounts.invalidate();
    },
  });

  const markReadStatusMutation = api.email.markEmailsReadStatus.useMutation({
    onMutate: async ({ ids, isRead }) => {
      // Optimistic UI update: update read/unread status in list cache
      await utils.email.getInboxThreads.cancel({ page, category });
      const previousData = utils.email.getInboxThreads.getData({ page, category });
      utils.email.getInboxThreads.setData({ page, category }, (old) => {
        if (!old) return old;
        return {
          ...old,
          emails: old.emails.map((e) =>
            ids.includes(e.id) ? { ...e, unread: !isRead } : e
          ),
        };
      });
      // Reset selected list
      setSelectedEmails([]);
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      utils.email.getInboxThreads.setData({ page, category }, context?.previousData);
    },
    onSettled: () => {
      void utils.email.getInboxThreads.invalidate();
      void utils.email.getUnreadCount.invalidate();
      void utils.email.getUnreadCounts.invalidate();
    },
  });

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageCount = Math.ceil(total / pageSize);

  const isFirst = page <= 1;
  const isLast = page >= pageCount || total === 0;

  return (
    <div className="mb-1 flex shrink-0 flex-col gap-4 rounded-xl bg-[#ffffff] p-3">
      <div className="flex items-center justify-between">
        {/* Left Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center p-1.5">
            <div className="relative flex items-center justify-center h-4.5 w-4.5">
              {/* The actual checkbox */}
              <input
                type="checkbox"
                checked={emails.length > 0 && selectedEmails.length === emails.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedEmails(emails.map((m) => m.id));
                  } else {
                    setSelectedEmails([]);
                  }
                }}
                className="appearance-none h-full w-full cursor-pointer rounded border border-gray-300 bg-white checked:bg-gray-300 checked:border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1"
              />

              {/* The custom tick mark */}
              {emails.length > 0 && selectedEmails.length === emails.length && (
                <svg
                  className="absolute pointer-events-none w-3.5 h-3.5 text-gray-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          {selectedEmails.length > 0 ? (
            <>
              <div className="mx-1 h-6 w-px bg-slate-200" />

              <button
                onClick={() => archiveMutation.mutate({ ids: selectedEmails })}
                title="Archive"
                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <Archive size={18} />
              </button>

              <button
                onClick={() => deleteMutation.mutate({ ids: selectedEmails })}
                title="Delete"
                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>

              <button
                onClick={() => markReadStatusMutation.mutate({ ids: selectedEmails, isRead: true })}
                title="Mark as read"
                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <MailOpen size={18} />
              </button>

              <button
                onClick={() => markReadStatusMutation.mutate({ ids: selectedEmails, isRead: false })}
                title="Mark as unread"
                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <Mail size={18} />
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
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
