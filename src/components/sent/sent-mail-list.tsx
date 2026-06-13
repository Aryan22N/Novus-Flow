"use client";

import InboxRow from "../ui/InboxRow";
import { api } from "~/trpc/react";
import IsometricLoader from "../ui/isometric-loader";
import { format, isToday } from "date-fns";

export default function SentMailList() {
  const { data: emails, isPending } = api.email.getSentEmails.useQuery();

  return (
    <div className="h-full flex-1 overflow-y-auto rounded-xl bg-[#F3F6FB]">
      {isPending ? (
        <div className="flex h-full items-center justify-center">
          <IsometricLoader />
        </div>
      ) : !emails || emails.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-gray-500">
          No sent emails found
        </div>
      ) : (
        emails.map((email) => {
          return (
            <div key={email.id}>
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
              />
            </div>
          );
        })
      )}
    </div>
  );
}
