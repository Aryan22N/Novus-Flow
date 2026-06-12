"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  FilePenLine,
  ClipboardCheck,
  CalendarCheck,
  Loader2,
  Copy,
  Check,
  Sparkle,
} from "lucide-react";
import { api } from "~/trpc/react";

interface AiPanelProps {
  defaultOpen?: boolean;
  threadId?: string;
}

interface CacheEntry {
  analysis: {
    summary: string;
    tasks: string[];
    isMeetingRelated: boolean;
    meetingDetails: {
      proposedTopic: string | null;
      suggestedDateTimes: string[];
    };
    defaultDraft: string;
  };
  generatedDraft: string;
  isScheduled: boolean;
  meetingTime: string;
  completedTasks: Record<number, boolean>;
  userBriefPrompt: string;
  timestamp: number;
  eventId?: string;
}

export default function AiPanel({ defaultOpen = false, threadId }: AiPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const [meetingTime, setMeetingTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [userBriefPrompt, setUserBriefPrompt] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});

  // Local state for active analysis data (sourced either from cache or from query)
  const [activeAnalysis, setActiveAnalysis] = useState<CacheEntry["analysis"] | null>(null);
  const [isCacheLoading, setIsCacheLoading] = useState(true);
  const [hasCache, setHasCache] = useState(false);

  // Load cache from localStorage when threadId changes
  useEffect(() => {
    if (!threadId) {
      setActiveAnalysis(null);
      setGeneratedDraft("");
      setIsScheduled(false);
      setMeetingTime("");
      setCompletedTasks({});
      setUserBriefPrompt("");
      setHasCache(false);
      setIsCacheLoading(false);
      return;
    }

    setIsCacheLoading(true);
    try {
      const cachedDataStr = localStorage.getItem("superman_ai_analysis_cache");
      if (cachedDataStr) {
        const cache = JSON.parse(cachedDataStr) as Record<string, CacheEntry>;
        const entry = cache[threadId];
        if (entry) {
          setActiveAnalysis(entry.analysis);
          setGeneratedDraft(entry.generatedDraft);
          setIsScheduled(entry.isScheduled);
          setMeetingTime(entry.meetingTime);
          setCompletedTasks(entry.completedTasks || {});
          setUserBriefPrompt(entry.userBriefPrompt || "");
          setHasCache(true);
          setIsCacheLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Error reading from localStorage cache:", err);
    }

    // Default to clean state if no cache is found
    setActiveAnalysis(null);
    setGeneratedDraft("");
    setIsScheduled(false);
    setMeetingTime("");
    setCompletedTasks({});
    setUserBriefPrompt("");
    setHasCache(false);
    setIsCacheLoading(false);
  }, [threadId]);

  // Helper to update any field in the cache entry for the current threadId
  const updateCache = (updates: Partial<Omit<CacheEntry, "analysis" | "timestamp">>) => {
    if (!threadId || !activeAnalysis) return;
    try {
      const cachedDataStr = localStorage.getItem("superman_ai_analysis_cache");
      const cache = cachedDataStr ? (JSON.parse(cachedDataStr) as Record<string, CacheEntry>) : {};
      const currentEntry = cache[threadId];
      if (currentEntry) {
        cache[threadId] = {
          ...currentEntry,
          ...updates,
          timestamp: Date.now(),
        };
        localStorage.setItem("superman_ai_analysis_cache", JSON.stringify(cache));
      }
    } catch (err) {
      console.error("Error updating localStorage cache:", err);
    }
  };

  // Fetch AI thread analysis automatically when threadId is loaded and not cached
  const { data: analysis, isLoading: isQueryLoading, error } = api.ai.analyzeThread.useQuery(
    { threadId },
    { enabled: !!threadId && !isCacheLoading && !hasCache, refetchOnWindowFocus: false }
  );

  const isLoading = isCacheLoading || (isQueryLoading && !hasCache);

  // Mutation to draft response based on user brief description
  const draftMutation = api.ai.generateReplyDraft.useMutation({
    onSuccess: (data) => {
      setGeneratedDraft(data.draft);
      updateCache({ generatedDraft: data.draft });
    },
  });

  const utils = api.useUtils();

  // Mutation to schedule meeting in Google Calendar via Corsair API
  const scheduleMutation = api.calendar.createEvent.useMutation({
    onSuccess: (data) => {
      setIsScheduled(true);
      updateCache({ isScheduled: true, meetingTime, eventId: data.event?.id });
      void utils.calendar.getEvents.invalidate();
    },
    onError: (err) => {
      alert("Failed to schedule in Google Calendar: " + err.message);
    },
  });

  // Automatically open panel if threadId is set
  useEffect(() => {
    if (threadId) {
      setIsExpanded(true);
    }
  }, [threadId]);

  // Sync state and write to cache when new thread analysis is fetched from the API
  useEffect(() => {
    if (analysis && threadId) {
      setActiveAnalysis(analysis);
      setGeneratedDraft(analysis.defaultDraft);
      setIsScheduled(false);
      setMeetingTime("");
      setCompletedTasks({});
      setUserBriefPrompt("");
      setHasCache(true);

      try {
        const cachedDataStr = localStorage.getItem("superman_ai_analysis_cache");
        const cache = cachedDataStr ? (JSON.parse(cachedDataStr) as Record<string, CacheEntry>) : {};
        cache[threadId] = {
          analysis,
          generatedDraft: analysis.defaultDraft,
          isScheduled: false,
          meetingTime: "",
          completedTasks: {},
          userBriefPrompt: "",
          timestamp: Date.now(),
        };
        localStorage.setItem("superman_ai_analysis_cache", JSON.stringify(cache));
      } catch (err) {
        console.error("Error writing to localStorage cache:", err);
      }
    }
  }, [analysis, threadId]);

  // Copy draft to clipboard utility
  const handleCopyDraft = async () => {
    if (!generatedDraft) return;
    try {
      await navigator.clipboard.writeText(generatedDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Trigger custom reply draft generation
  const handleGenerateDraft = () => {
    if (!threadId || !userBriefPrompt.trim()) return;
    draftMutation.mutate({
      threadId,
      userBriefPrompt,
    });
  };

  // Toggle tasks check states
  const toggleTask = (index: number) => {
    const newCompletedTasks = {
      ...completedTasks,
      [index]: !completedTasks[index],
    };
    setCompletedTasks(newCompletedTasks);
    updateCache({ completedTasks: newCompletedTasks });
  };

  const handleMeetingTimeChange = (val: string) => {
    setMeetingTime(val);
    updateCache({ meetingTime: val });
  };

  const handleSuggestedTimeClick = (time: string) => {
    setMeetingTime(time);
    updateCache({ meetingTime: time });
  };

  const handleScheduleMeeting = () => {
    if (!meetingTime.trim()) return;
    scheduleMutation.mutate({
      summary: activeAnalysis?.meetingDetails.proposedTopic || "AI Scheduled Sync",
      description: `Meeting scheduled by Nexus Assistant from thread: ${threadId}\n\nSummary:\n${activeAnalysis?.summary.replace(/<[^>]*>/g, "")}`,
      meetingTime: meetingTime,
    });
  };

  const handleUserBriefPromptChange = (val: string) => {
    setUserBriefPrompt(val);
    updateCache({ userBriefPrompt: val });
  };

  if (!isExpanded) {
    return (
      <aside className="w-12 bg-[#f7f9fc] border-l border-outline-variant flex flex-col shrink-0 h-full transition-all duration-200 overflow-hidden">
        <div className="flex flex-col items-center py-4 gap-4 h-full">
          <button
            className="p-2 rounded-full hover:bg-surface-container-high text-primary"
            onClick={() => setIsExpanded(true)}
            title="Open AI Panel"
            suppressHydrationWarning
          >
            <Brain size={20} />
          </button>

          <div className="[writing-mode:vertical-lr] text-label-caps font-bold text-on-surface-variant tracking-widest uppercase select-none">
            Nexus Assistant
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[380px] bg-surface-container-lowest border-l border-outline-variant flex flex-col shrink-0 h-full transition-all duration-200 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant flex items-center justify-between">
        <button
          className="text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded transition-colors"
          onClick={() => setIsExpanded(false)}
          title="Close AI Panel"
          suppressHydrationWarning
        >
          <ChevronRight size={20} />
        </button>

        <div className="flex items-center gap-2 text-primary select-none">
          <Brain size={20} className="animate-pulse" />
          <h2 className="text-title-sm font-title-sm font-bold">
            Nexus Assistant
          </h2>
        </div>

        <button className="text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded transition-colors" suppressHydrationWarning>
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {!threadId ? (
          // Welcome View when no email is selected
          <div className="flex flex-col items-center justify-center text-center h-full py-12 px-4 gap-4 select-none">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Sparkle size={32} className="animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <div>
              <h3 className="text-title-sm font-bold text-on-surface">No Email Selected</h3>
              <p className="text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                Select an email thread from your inbox, and Nexus Assistant will automatically analyze it for summaries, tasks, and scheduling options.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          // Shimmering Skeleton Loader during API analysis
          <div className="animate-pulse flex flex-col gap-5 w-full">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-xs text-primary font-semibold uppercase tracking-wider">Analyzing Thread...</span>
            </div>

            {/* Summary Skeleton */}
            <div className="border border-outline-variant/30 rounded-2xl p-4 bg-surface-container-low/50 flex flex-col gap-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>

            {/* Tasks Skeleton */}
            <div className="border border-outline-variant/30 rounded-2xl p-4 bg-surface-container-low/50 flex flex-col gap-3">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>

            {/* Reply Skeleton */}
            <div className="border border-outline-variant/30 rounded-2xl p-4 bg-surface-container-low/50 flex flex-col gap-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-12 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ) : error && !activeAnalysis ? (
          // Error State View
          <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-2xl flex flex-col gap-2">
            <h4 className="font-bold text-body-md">Analysis Failed</h4>
            <p className="text-body-sm text-red-700">
              There was an error communicating with OpenAI to analyze this thread. Please verify your API Key and network.
            </p>
          </div>
        ) : activeAnalysis ? (
          // Analysis Loaded State
          <div className="flex flex-col gap-5">
            {/* 1. Summary Card */}
            <div className="border border-outline-variant/30 rounded-2xl p-4 bg-surface-container-low/50 flex flex-col gap-2.5 ai-border hover-lift">
              <div className="flex items-center gap-1.5 text-primary font-semibold text-body-md border-b border-outline-variant/20 pb-1.5 select-none">
                <Sparkles size={16} />
                <span>Thread Summary</span>
              </div>
              <div
                className="text-body-sm text-on-surface-variant leading-relaxed select-text"
                dangerouslySetInnerHTML={{ __html: activeAnalysis.summary }}
              />
            </div>

            {/* 2. Actionable Tasks Card */}
            <div className="border border-outline-variant/30 rounded-2xl p-4 bg-surface-container-low/50 flex flex-col gap-2.5 ai-border hover-lift">
              <div className="flex items-center gap-1.5 text-primary font-semibold text-body-md border-b border-outline-variant/20 pb-1.5 select-none">
                <ClipboardCheck size={16} />
                <span>Actionable Tasks</span>
              </div>
              {activeAnalysis.tasks.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic select-none">No tasks detected in this email.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {activeAnalysis.tasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-body-sm text-on-surface-variant">
                      <input
                        type="checkbox"
                        id={`task-${idx}`}
                        checked={!!completedTasks[idx]}
                        onChange={() => toggleTask(idx)}
                        className="mt-1 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <label
                        htmlFor={`task-${idx}`}
                        className={`leading-tight cursor-pointer transition-all select-none ${completedTasks[idx] ? "line-through opacity-50" : ""
                          }`}
                      >
                        {task}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 3. Meeting Scheduler Card */}
            {activeAnalysis.isMeetingRelated && (
              <div className="border border-outline-variant/30 rounded-2xl p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 flex flex-col gap-2.5 hover-lift">
                <div className="flex items-center gap-1.5 text-secondary font-semibold text-body-md border-b border-outline-variant/20 pb-1.5 select-none">
                  <CalendarCheck size={16} />
                  <span>Schedule Meeting</span>
                </div>

                <div className="text-body-sm text-on-surface-variant leading-normal">
                  <p className="font-semibold text-xs text-secondary mb-1 uppercase tracking-wider select-none">Proposed Topic</p>
                  <p className="text-body-sm font-medium italic select-text">
                    "{activeAnalysis.meetingDetails.proposedTopic || "Sync meeting"}"
                  </p>
                </div>

                {activeAnalysis.meetingDetails.suggestedDateTimes && activeAnalysis.meetingDetails.suggestedDateTimes.length > 0 && (
                  <div className="mt-1.5">
                    <p className="text-xs font-semibold text-on-surface-variant/80 mb-1.5 select-none">Extracted Times (click to autofill):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAnalysis.meetingDetails.suggestedDateTimes.map((time, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedTimeClick(time)}
                          className="text-xs bg-white hover:bg-primary/5 text-primary border border-outline-variant/50 hover:border-primary/50 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium"
                          suppressHydrationWarning
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 items-center mt-3">
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => handleMeetingTimeChange(e.target.value)}
                    placeholder="Enter meeting time..."
                    className="flex-1 text-body-sm px-3 py-1.5 border border-outline-variant rounded bg-white focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
                    suppressHydrationWarning
                  />
                  <button
                    onClick={handleScheduleMeeting}
                    disabled={scheduleMutation.isPending || !meetingTime.trim()}
                    className="bg-secondary hover:bg-secondary/90 text-white text-label-caps font-semibold py-1.5 px-3 rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    suppressHydrationWarning
                  >
                    {scheduleMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                    {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
                  </button>
                </div>

                {isScheduled && (
                  <div className="mt-3.5 p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2 text-body-sm animate-fadeIn">
                    <Check size={16} className="text-green-600 shrink-0" />
                    <div>
                      <span className="font-semibold">Meeting Scheduled!</span>
                      <div className="text-xs text-green-700 mt-0.5">Time: {meetingTime}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Draft Reply Card */}
            {/* <div className="border border-outline-variant/30 rounded-2xl p-4 bg-surface-container-low/50 flex flex-col gap-3 ai-border hover-lift pb-4">
              <div className="flex items-center gap-1.5 text-primary font-semibold text-body-md border-b border-outline-variant/20 pb-1.5 select-none">
                <FilePenLine size={16} />
                <span>Draft Reply</span>
              </div>

              <div className="flex flex-col gap-2">
                <textarea
                  value={userBriefPrompt}
                  onChange={(e) => handleUserBriefPromptChange(e.target.value)}
                  placeholder="Describe your reply shortly (e.g., 'accept the invite', 'say I will join next week', etc.)"
                  className="w-full text-body-sm p-2.5 border border-outline-variant rounded bg-white focus:outline-none focus:border-primary resize-none h-20 transition-colors placeholder:text-on-surface-variant/50"
                  suppressHydrationWarning
                />
                <button
                  onClick={handleGenerateDraft}
                  disabled={draftMutation.isPending || !userBriefPrompt.trim()}
                  className="w-full bg-primary hover:bg-primary-container text-white text-label-caps font-semibold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  suppressHydrationWarning
                >
                  {draftMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate Draft
                    </>
                  )}
                </button>
              </div>

              {generatedDraft && (
                <div className="relative mt-2 border border-outline-variant/30 bg-white rounded-xl p-3 text-body-sm group select-text hover:shadow-sm transition-shadow">
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleCopyDraft}
                      className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                      title="Copy to clipboard"
                      suppressHydrationWarning
                    >
                      {copied ? <Check size={14} className="text-green-600 animate-pulse" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-on-surface-variant font-sans text-xs">
                    {generatedDraft}
                  </div>
                </div>
              )}
            </div> */}
          </div>
        ) : null}
      </div>
    </aside>
  );
}