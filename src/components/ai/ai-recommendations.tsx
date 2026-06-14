import {
  Sparkles,
  FileEdit,
  CalendarDays,
  ListChecks,
  FileSearch,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useState, useRef } from "react";
import { api } from "~/trpc/react";
import ComposeModal from "../compose/compose-modal";

export default function NexusAssistant() {
  const [prompt, setPrompt] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState<{
    id: string;
    to: string | null;
    cc: string | null;
    bcc: string | null;
    subject: string | null;
    body: string | null;
    aiDraftText?: string | null;
    threadId?: string | null;
  } | null>(null);

  const [summaryResult, setSummaryResult] = useState<{
    updates: string[];
    tasks: string[];
    meetings: string[];
    deadlines: string[];
  } | null>(null);

  const createEventMutation = api.calendar.createEvent.useMutation();
  const utils = api.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [matchingContacts, setMatchingContacts] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmContact = (contact: any) => {
    generateDraftMutation.mutate({
      prompt: prompt,
      recipientEmail: contact.email,
    });
    setIsConfirming(false);
    setMatchingContacts([]);
  };

  const handleEditPrompt = () => {
    setIsConfirming(false);
    setMatchingContacts([]);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const summarizeEmailsMutation = api.ai.summarizeRecentEmails.useMutation({
    onSuccess: (data) => {
      setSummaryResult(data);
    },
  });

  const generateDraftMutation = api.ai.generateGlobalDraft.useMutation({
    onSuccess: (data) => {
      // Auto-schedule meeting if requested
      if (data.isMeetingRelated && data.meetingDetails) {
        createEventMutation.mutate({
          summary: data.meetingDetails.summary,
          meetingTime: data.meetingDetails.meetingTime,
        });
      }

      // Open the compose modal with the drafted email
      setGeneratedDraft({
        id: crypto.randomUUID(),
        to: data.to,
        cc: null,
        bcc: null,
        subject: data.subject,
        body: data.draft,
        aiDraftText: data.draft,
      });
      setPrompt(""); // Clear input
    },
  });

  const handleSubmit = async () => {
    if (!prompt.trim() || generateDraftMutation.isPending) return;

    // Check if user is asking to draft an email to a specific person
    const draftMatch = prompt.trim().match(/^(?:draft\s+)?(?:mail\s+|email\s+)?to\s+([a-zA-Z0-9._%+-]+|[a-zA-Z\s]+)$/i);
    if (draftMatch?.[1]) {
      const contactQuery = draftMatch[1].trim();
      try {
        const list = await utils.email.searchContacts.fetch({ query: contactQuery });
        if (list.length > 0) {
          setMatchingContacts(list);
          setIsConfirming(true);
          return;
        }
      } catch (err) {
        console.error("Failed to search contacts in Nexus Assistant:", err);
      }
    }

    generateDraftMutation.mutate({ prompt });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleDraftClick = () => {
    if (!prompt.startsWith("/draft ")) {
      setPrompt("/draft " + prompt);
    }
  };

  const handleSummarizeClick = () => {
    summarizeEmailsMutation.mutate();
  };

  return (
    <div className=" border-outline-variant relative flex flex-col overflow-hidden rounded-xl border p-3" style={{
      backgroundImage: 'linear-gradient(to top, #dfe9f3 0%, white 100%)'
    }}>
      {/* Background Blur */}
      {/* <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px]"></div> */}

      <div className="relative z-10 flex flex-col">
        {/* Header */}
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h3 className="text-title-sm font-title-sm text-primary flex items-center gap-2">
            <Sparkles size={20} />
            Nexus Assistant
          </h3>
        </div>

        {/* Chat History / Welcome Message */}
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <div className="text-body-sm rounded-lg border border-white bg-white/80 p-3 shadow-sm">
              How can I help you optimize your workflow today?
            </div>

            {isConfirming && matchingContacts.length > 0 && (
              <div className="text-body-sm flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50/95 p-3.5 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="font-semibold text-blue-800">Did you mean:</div>
                <div className="flex flex-col gap-2">
                  {matchingContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between gap-4 rounded-lg bg-white p-2.5 shadow-sm border border-slate-100"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {contact.name || contact.email.split("@")[0]}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {contact.email}
                        </span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleConfirmContact(contact)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={handleEditPrompt}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summarizeEmailsMutation.isPending && (
              <div className="text-body-sm flex items-center gap-2 rounded-lg border border-white bg-white/80 p-3 shadow-sm text-on-surface-variant">
                <Loader2 size={16} className="animate-spin" />
                Summarizing recent unread emails...
              </div>
            )}

            {summaryResult && (
              <div className="text-body-sm rounded-lg border border-white bg-white/80 p-3 shadow-sm flex flex-col gap-3">
                <div className="font-bold text-primary">Today's Summary</div>

                {summaryResult.updates.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {summaryResult.updates.map((update, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{update}</span>
                      </div>
                    ))}
                  </div>
                )}

                {summaryResult.meetings.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="font-bold text-on-surface text-[12px] uppercase">Meetings</div>
                    {summaryResult.meetings.map((meeting, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{meeting}</span>
                      </div>
                    ))}
                  </div>
                )}

                {summaryResult.deadlines.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="font-bold text-on-surface text-[12px] uppercase">Deadlines</div>
                    {summaryResult.deadlines.map((deadline, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{deadline}</span>
                      </div>
                    ))}
                  </div>
                )}

                {summaryResult.tasks.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="font-bold text-primary">Tasks</div>
                    {summaryResult.tasks.map((task, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-outline text-lg leading-none">☐</span>
                        <span className="pt-0.5">{task}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input & Actions (Sticky Bottom) */}
        <div className="shrink-0 flex flex-col gap-3">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-2" suppressHydrationWarning>
            <button
              onClick={handleDraftClick}
              suppressHydrationWarning
              className="font-label-caps border-outline-variant/30 hover:bg-primary flex items-center justify-center gap-1 rounded-lg border bg-white/90 px-2 py-2 text-[11px] font-bold shadow-sm transition-all hover:text-white"
            >
              <FileEdit size={14} />
              DRAFT
            </button>
            {/* <button suppressHydrationWarning className="font-label-caps border-outline-variant/30 hover:bg-primary flex items-center justify-center gap-1 rounded-lg border bg-white/90 px-2 py-2 text-[11px] font-bold shadow-sm transition-all hover:text-white">
              <CalendarDays size={14} />
              PREP
            </button>
            <button suppressHydrationWarning className="font-label-caps border-outline-variant/30 hover:bg-primary flex items-center justify-center gap-1 rounded-lg border bg-white/90 px-2 py-2 text-[11px] font-bold shadow-sm transition-all hover:text-white">
              <ListChecks size={14} />
              TASKS
            </button> */}
            <button
              onClick={handleSummarizeClick}
              disabled={summarizeEmailsMutation.isPending}
              suppressHydrationWarning
              className="font-label-caps border-outline-variant/30 hover:bg-primary flex items-center justify-center gap-1 rounded-lg border bg-white/90 px-2 py-2 text-[11px] font-bold shadow-sm transition-all hover:text-white disabled:opacity-50"
            >
              {summarizeEmailsMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <FileSearch size={14} />}
              SUM
            </button>
          </div>

          {/* Input Area */}
          <div
            className="border-outline-variant/50 relative flex w-full items-center rounded-xl border bg-white p-1 shadow-sm transition-all"
            suppressHydrationWarning
          >
            <input
              suppressHydrationWarning
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={generateDraftMutation.isPending}
              ref={inputRef}
              className="text-body-sm placeholder:text-on-surface-variant w-full border-none bg-transparent py-1.5 pr-10 pl-3 focus:ring-0 focus:outline-none disabled:opacity-50"
              placeholder="Ask Nexus..."
              type="text"
            />
            <button
              suppressHydrationWarning
              onClick={handleSubmit}
              disabled={generateDraftMutation.isPending || !prompt.trim()}
              className="bg-primary hover:bg-primary-container absolute right-1.5 flex items-center justify-center rounded-lg p-1 text-white transition-colors disabled:opacity-50"
            >
              {generateDraftMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {generatedDraft && (
        <ComposeModal
          initialDraft={generatedDraft}
          onClose={() => setGeneratedDraft(null)}
        />
      )}
    </div>
  );
}