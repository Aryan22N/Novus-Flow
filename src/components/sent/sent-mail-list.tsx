"use client";

import InboxRow from "../ui/InboxRow";
import { api } from "~/trpc/react";
import IsometricLoader from "../ui/isometric-loader";
import { format, isToday } from "date-fns";

import Link from "next/link";
import { useEffect } from "react";

interface SentMailListProps {
  selectedEmails: string[];
  setSelectedEmails: React.Dispatch<React.SetStateAction<string[]>>;
  onEmailsChange: (emails: any[]) => void;
}

export default function SentMailList({
  selectedEmails,
  setSelectedEmails,
  onEmailsChange,
}: SentMailListProps) {
  const { data: emails, isPending } = api.email.getSentEmails.useQuery();

  // Bubble up active emails list to parent
  const emailsIdsStr = JSON.stringify(emails?.map((e) => e.id) || []);
  
  useEffect(() => {
    onEmailsChange(emails || []);
  }, [emailsIdsStr, onEmailsChange]);

  const handleToggleSelect = (e: React.MouseEvent, emailId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedEmails((prev) =>
      prev.includes(emailId)
        ? prev.filter((id) => id !== emailId)
        : [...prev, emailId]
    );
  };

  return (
    <div className="h-full flex-1 overflow-y-auto rounded-xl bg-[#F3F6FB] dark:bg-slate-900/50">
      {isPending ? (
        <div className="flex h-full items-center justify-center">
          <IsometricLoader />
        </div>
      ) : !emails || emails.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-gray-500">
          No sent emails found
        </div>
      ) : (
        emails.map((email: any) => {
          const threadId = email.threadId || email.id;
          return (
            <Link key={email.id} href={`/inbox/${threadId}`} className="block">
              <InboxRow
                sender={`To: ${email.to}`} // For sent mail, we show who we sent it to
                subject={email.subject}
                snippet={email.body.substring(0, 100)} // Create a brief snippet from the body
                date={
                  isToday(email.createdAt)
                    ? format(email.createdAt, "h:mm a").toLowerCase()
                    : format(email.createdAt, "MMM d")
                }
                unread={false} // Sent emails are implicitly read
                selected={selectedEmails.includes(email.id)}
                onToggleSelect={(e) => handleToggleSelect(e, email.id)}
              />
            </Link>
          );
        })
      )}
    </div>
  );
}
