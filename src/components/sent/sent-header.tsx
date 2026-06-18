"use client";

import { Trash2, Archive, MailOpen, Mail, RefreshCw, MoreVertical } from "lucide-react";
import { api } from "~/trpc/react";

interface SentHeaderProps {
  selectedEmails: string[];
  setSelectedEmails: React.Dispatch<React.SetStateAction<string[]>>;
  emails: { id: string }[];
}

export default function SentHeader({
  selectedEmails,
  setSelectedEmails,
  emails,
}: SentHeaderProps) {
  const utils = api.useUtils();

  const deleteMutation = api.email.deleteEmails.useMutation({
    onSuccess: () => {
      void utils.email.getSentEmails.invalidate();
      setSelectedEmails([]);
    },
  });

  const archiveMutation = api.email.archiveEmails.useMutation({
    onSuccess: () => {
      void utils.email.getSentEmails.invalidate();
      setSelectedEmails([]);
    },
  });

  const markReadStatusMutation = api.email.markEmailsReadStatus.useMutation({
    onSuccess: () => {
      void utils.email.getSentEmails.invalidate();
      setSelectedEmails([]);
    },
  });

  const handleRefresh = async () => {
    await utils.email.getSentEmails.invalidate();
  };

  return (
    <div className="mb-1 flex shrink-0 flex-col gap-4 rounded-xl bg-[#ffffff] dark:bg-slate-900/50 p-3">
      <div className="flex items-center justify-between">
        {/* Left Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center p-1.5">
            <div className="relative flex h-4.5 w-4.5 items-center justify-center">
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
                className="focus:ring-offset-1 h-full w-full appearance-none cursor-pointer rounded border border-gray-300 bg-white checked:border-gray-800 checked:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />

              {emails.length > 0 && selectedEmails.length === emails.length && (
                <svg
                  className="pointer-events-none absolute h-3.5 w-3.5 text-gray-800"
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
              <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

              <button
                onClick={() => archiveMutation.mutate({ ids: selectedEmails })}
                title="Archive"
                className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 rounded p-1.5 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <Archive size={18} />
              </button>

              <button
                onClick={() => deleteMutation.mutate({ ids: selectedEmails })}
                title="Delete"
                className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 rounded p-1.5 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>

              <button
                onClick={() => markReadStatusMutation.mutate({ ids: selectedEmails, isRead: true })}
                title="Mark as read"
                className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 rounded p-1.5 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <MailOpen size={18} />
              </button>

              <button
                onClick={() => markReadStatusMutation.mutate({ ids: selectedEmails, isRead: false })}
                title="Mark as unread"
                className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 rounded p-1.5 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <Mail size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                title="Sync sent emails"
                className="rounded p-1.5 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw size={18} />
              </button>

              <button className="rounded p-1.5 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                <MoreVertical size={18} />
              </button>
            </>
          )}
        </div>

        {/* Right Label */}
        <div className="flex items-center gap-1 text-[13px] font-medium text-[#5f6368] dark:text-slate-400">
          <span className="mr-2 tabular-nums">
            {emails.length === 0 ? "0" : `1–${emails.length}`} of {emails.length}
          </span>
        </div>
      </div>
    </div>
  );
}
