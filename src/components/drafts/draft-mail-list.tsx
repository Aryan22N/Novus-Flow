"use client";

import { useState } from "react";
import InboxRow from "../ui/InboxRow";
import { api } from "~/trpc/react";
import IsometricLoader from "../ui/isometric-loader";
import { format, isToday } from "date-fns";
import ComposeModal from "../compose/compose-modal";

export default function DraftMailList() {
  const { data: drafts, isPending } = api.email.getDrafts.useQuery();
  const [selectedDraft, setSelectedDraft] = useState<typeof drafts extends undefined ? undefined : NonNullable<typeof drafts>[0] | null>(null);

  return (
    <>
      <div className="h-full flex-1 overflow-y-auto rounded-xl bg-[#F3F6FB]">
        {isPending ? (
          <div className="flex h-full items-center justify-center">
            <IsometricLoader />
          </div>
        ) : !drafts || drafts.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-gray-500">
            No drafts found
          </div>
        ) : (
          drafts.map((draft) => {
            return (
              <div key={draft.id} onClick={() => setSelectedDraft(draft)} className="cursor-pointer">
                <InboxRow
                  sender={draft.to ? `To: ${draft.to}` : "To: (no recipient)"}
                  subject={draft.subject || "(no subject)"}
                  snippet={draft.body?.substring(0, 100) || ""}
                  date={
                    isToday(draft.updatedAt)
                      ? format(draft.updatedAt, "h:mm a").toLowerCase()
                      : format(draft.updatedAt, "MMM d")
                  }
                  unread={false} // Drafts don't have unread status
                />
              </div>
            );
          })
        )}
      </div>

      {selectedDraft && (
        <ComposeModal 
          initialDraft={selectedDraft} 
          onClose={() => setSelectedDraft(null)} 
        />
      )}
    </>
  );
}
