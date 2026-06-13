"use client";

import InboxRow from "../ui/InboxRow";
import { api } from "~/trpc/react";
import Link from "next/link";
import IsometricLoader from "../ui/isometric-loader";
import { useState, useEffect } from "react";
import { format, isToday } from "date-fns";

interface EmailListProps {
  page: number;
  category?: string;
  isStarredOnly?: boolean;
  onTotalChange?: (total: number) => void;
}

export default function EmailList({
  page,
  category,
  isStarredOnly,
  onTotalChange,
}: EmailListProps) {
  const { data, isPending } = api.email.getInboxThreads.useQuery({
    page,
    category,
    isStarred: isStarredOnly,
  });
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Surface total count to parent for the pagination label in InboxHeader
  useEffect(() => {
    if (data?.total !== undefined) {
      onTotalChange?.(data.total);
    }
  }, [data?.total, onTotalChange]);

  useEffect(() => {
    const saved = localStorage.getItem("readEmails");
    if (saved) {
      try {
        setReadIds(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Failed to parse readEmails from localStorage");
      }
    }
  }, []);

  const utils = api.useUtils();
  const { mutate: refreshInbox } = api.email.refreshInbox.useMutation({
    onSuccess: () => {
      void utils.email.getInboxThreads.invalidate();
    },
  });

  useEffect(() => {
    refreshInbox();
  }, [refreshInbox]);

  const markReadMutation = api.email.markThreadAsRead.useMutation({
    onSuccess: () => {
      void utils.email.getUnreadCount.invalidate();
      void utils.email.getInboxThreads.invalidate();
    },
  });

  const toggleStarMutation = api.email.toggleStar.useMutation({
    onMutate: async ({ messageId, isStarred }) => {
      await utils.email.getInboxThreads.cancel({
        page,
        category,
        isStarred: isStarredOnly,
      });
      const previousData = utils.email.getInboxThreads.getData({
        page,
        category,
        isStarred: isStarredOnly,
      });
      utils.email.getInboxThreads.setData(
        { page, category, isStarred: isStarredOnly },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            emails: old.emails.map((e) =>
              e.id === messageId ? { ...e, isStarred } : e,
            ),
          };
        },
      );
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      utils.email.getInboxThreads.setData(
        { page, category, isStarred: isStarredOnly },
        context?.previousData,
      );
    },
    onSettled: () => {
      void utils.email.getInboxThreads.invalidate();
    },
  });

  const handleToggleStar = (
    e: React.MouseEvent,
    messageId: string,
    currentIsStarred: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    toggleStarMutation.mutate({ messageId, isStarred: !currentIsStarred });
  };

  const handleEmailClick = (threadId: string, isUnread: boolean) => {
    // Persist read state to localStorage immediately
    setReadIds((prev) => {
      const next = new Set(prev).add(threadId);
      localStorage.setItem("readEmails", JSON.stringify(Array.from(next)));
      return next;
    });

    // Fire DB + Gmail mutation only if it was unread
    if (isUnread) {
      markReadMutation.mutate({ threadId });
    }
  };

  const emails = data?.emails;

  return (
    <div className="h-full flex-1 overflow-y-auto rounded-xl bg-[#F3F6FB]">
      {isPending ? (
        <div className="flex h-full items-center justify-center">
          <IsometricLoader />
        </div>
      ) : emails?.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-gray-500">
          No threads found
        </div>
      ) : (
        emails?.map((email) => {
          const threadId = email.threadId || email.id;
          const isUnread = email.unread && !readIds.has(threadId);
          return (
            <Link
              key={email.id}
              href={`/inbox/${threadId}`}
              onClick={() => handleEmailClick(threadId, !!isUnread)}
            >
              <InboxRow
                sender={email.sender}
                subject={email.subject}
                snippet={email.snippet}
                date={
                  isToday(email.date)
                    ? format(email.date, "h:mm a").toLowerCase()
                    : format(email.date, "MMM d")
                }
                unread={!!isUnread}
                isStarred={email.isStarred}
                onToggleStar={(e) =>
                  handleToggleStar(e, email.id, !!email.isStarred)
                }
              />
            </Link>
          );
        })
      )}
    </div>
  );
}
