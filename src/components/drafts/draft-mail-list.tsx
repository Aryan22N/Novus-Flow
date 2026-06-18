"use client";

import { useState } from "react";
import InboxRow from "../ui/InboxRow";
import { api } from "~/trpc/react";
import IsometricLoader from "../ui/isometric-loader";
import { format, isToday } from "date-fns";
import ComposeModal from "../compose/compose-modal";

interface DraftMailListProps {
  selectedDrafts: string[];
  setSelectedDrafts: React.Dispatch<React.SetStateAction<string[]>>;
  onDraftsChange: (drafts: any[]) => void;
}

import { useEffect } from "react";

export default function DraftMailList({
  selectedDrafts,
  setSelectedDrafts,
  onDraftsChange,
}: DraftMailListProps) {
  const { data: drafts, isPending } = api.email.getDrafts.useQuery();
  const [selectedDraft, setSelectedDraft] = useState<typeof drafts extends undefined ? undefined : NonNullable<typeof drafts>[0] | null>(null);

  // Bubble up active drafts list to parent
  const draftsIdsStr = JSON.stringify(drafts?.map((d) => d.id) || []);
  
  useEffect(() => {
    onDraftsChange(drafts || []);
  }, [draftsIdsStr, onDraftsChange]);

  const handleToggleSelect = (e: React.MouseEvent, draftId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDrafts((prev) =>
      prev.includes(draftId)
        ? prev.filter((id) => id !== draftId)
        : [...prev, draftId]
    );
  };

  return (
    <>
      <div className="h-full flex-1 overflow-y-auto rounded-xl bg-[#F3F6FB] dark:bg-slate-900/50">
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
                  selected={selectedDrafts.includes(draft.id)}
                  onToggleSelect={(e) => handleToggleSelect(e, draft.id)}
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
