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
  Sparkle
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

function AiAnalyzer({
  threadId,
  onAnalysis,
  onError,
}: {
  threadId: string;
  onAnalysis: (data: any) => void;
  onError: (err: any) => void;
}) {
  const { data, error } = api.ai.analyzeThread.useQuery(
    { threadId },
    { refetchOnWindowFocus: false },
  );

  useEffect(() => {
    if (data) onAnalysis(data);
  }, [data, onAnalysis]);

  useEffect(() => {
    if (error) onError(error);
  }, [error, onError]);

  return null;
}

export default function AiPanel({
  defaultOpen = false,
  threadId,
}: AiPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const [meetingTime, setMeetingTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [userBriefPrompt, setUserBriefPrompt] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>(
    {},
  );

  // Local state for active analysis data (sourced either from cache or from query)
  const [activeAnalysis, setActiveAnalysis] = useState<
    CacheEntry["analysis"] | null
  >(null);
  const [isCacheLoading, setIsCacheLoading] = useState(true);
  const [hasCache, setHasCache] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('superman_settings_auto_summarize');
    if (stored !== null) {
      setAiEnabled(stored === 'true');
    }
  }, []);

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
  const updateCache = (
    updates: Partial<Omit<CacheEntry, "analysis" | "timestamp">>,
  ) => {
    if (!threadId || !activeAnalysis) return;
    try {
      const cachedDataStr = localStorage.getItem("superman_ai_analysis_cache");
      const cache = cachedDataStr
        ? (JSON.parse(cachedDataStr) as Record<string, CacheEntry>)
        : {};
      const currentEntry = cache[threadId];
      if (currentEntry) {
        cache[threadId] = {
          ...currentEntry,
          ...updates,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          "superman_ai_analysis_cache",
          JSON.stringify(cache),
        );
      }
    } catch (err) {
      console.error("Error updating localStorage cache:", err);
    }
  };

  // Determine if we should be fetching right now
  const shouldFetch = !!threadId && !isCacheLoading && !hasCache && aiEnabled;
  const [queryError, setQueryError] = useState<any>(null);

  const isQueryLoading = shouldFetch && !activeAnalysis && !queryError;
  const isLoading = isCacheLoading || (isQueryLoading && !hasCache);

  const handleAnalysisSuccess = (analysis: CacheEntry["analysis"]) => {
    if (!threadId) return;
    setActiveAnalysis(analysis);
    setGeneratedDraft(analysis.defaultDraft);
    setIsScheduled(false);
    setMeetingTime("");
    setCompletedTasks({});
    setUserBriefPrompt("");
    setHasCache(true);

    try {
      const cachedDataStr = localStorage.getItem("superman_ai_analysis_cache");
      const cache = cachedDataStr
        ? (JSON.parse(cachedDataStr) as Record<string, CacheEntry>)
        : {};
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
  };

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

  // We removed the old useEffect because we now handle it in handleAnalysisSuccess

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
      summary:
        activeAnalysis?.meetingDetails.proposedTopic || "AI Scheduled Sync",
      description: `Meeting scheduled by Novus Assistant from thread: ${threadId}\n\nSummary:\n${activeAnalysis?.summary.replace(/<[^>]*>/g, "")}`,
      meetingTime: meetingTime,
    });
  };

  const handleUserBriefPromptChange = (val: string) => {
    setUserBriefPrompt(val);
    updateCache({ userBriefPrompt: val });
  };

  if (!isExpanded) {
    return (
      <aside
        className="border-outline-variant dark:border-slate-800 flex h-full w-12 shrink-0 flex-col overflow-hidden border-l bg-[#f7f9fc] dark:bg-[#0a0f1c] transition-all duration-200"
        onMouseEnter={() => setIsExpanded(true)}
      >
        <div className="flex h-full flex-col items-center gap-4 py-4">
          <button
            className="hover:bg-surface-container-high dark:hover:bg-slate-800 text-primary dark:text-indigo-400 rounded-full p-2"
            onClick={() => setIsExpanded(true)}
            title="Open AI Panel"
            suppressHydrationWarning
          >
            <Brain size={20} />
          </button>

          <div className="text-label-caps text-on-surface-variant dark:text-slate-400 font-bold tracking-widest uppercase select-none [writing-mode:vertical-lr]">
            Novus Assistant
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className="bg-surface-container-lowest dark:bg-[#0a0f1c] border-outline-variant dark:border-slate-800 flex h-full w-[380px] shrink-0 flex-col border-l shadow-xl transition-all duration-200"
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header */}
      <div className="border-outline-variant dark:border-slate-800 flex items-center justify-between border-b p-4">
        <button
          className="text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-slate-800 rounded p-1.5 transition-colors"
          onClick={() => setIsExpanded(false)}
          title="Close AI Panel"
          suppressHydrationWarning
        >
          <ChevronRight size={20} />
        </button>

        <div className="text-primary dark:text-indigo-400 flex items-center gap-2 select-none">
          <Brain size={20} className="animate-pulse" />
          <h2 className="text-title-sm font-title-sm font-bold">
            Novus Assistant
          </h2>
        </div>

        <button
          className="text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-slate-800 rounded p-1.5 transition-colors"
          suppressHydrationWarning
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {shouldFetch && (
        <AiAnalyzer
          threadId={threadId!}
          onAnalysis={handleAnalysisSuccess}
          onError={setQueryError}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        {!aiEnabled ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-12 text-center select-none">
            <div className="bg-primary/10 dark:bg-indigo-500/10 text-primary dark:text-indigo-400 rounded-full p-4">
              <Brain size={32} />
            </div>
            <div>
              <h3 className="text-title-sm text-on-surface dark:text-slate-200 font-bold">
                AI Assistant Disabled
              </h3>
              <p className="text-body-sm text-on-surface-variant dark:text-slate-400 mt-1.5 leading-relaxed">
                Please enable the Auto-Summarize Threads setting in the settings page to use the Novus Assistant.
              </p>
            </div>
          </div>
        ) : !threadId ? (
          // Welcome View when no email is selected
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-12 text-center select-none">
            <div className="bg-primary/10 dark:bg-indigo-500/10 text-primary dark:text-indigo-400 rounded-full p-4">
              <Sparkle
                size={32}
                className="animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>
            <div>
              <h3 className="text-title-sm text-on-surface dark:text-slate-200 font-bold">
                No Email Selected
              </h3>
              <p className="text-body-sm text-on-surface-variant dark:text-slate-400 mt-1.5 leading-relaxed">
                Select an email thread from your inbox, and Novus Assistant will
                automatically analyze it for summaries, tasks, and scheduling
                options.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          // Shimmering Skeleton Loader during API analysis
          <div className="flex w-full animate-pulse flex-col gap-5">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="text-primary dark:text-indigo-400 animate-spin" />
              <span className="text-primary dark:text-indigo-400 text-xs font-semibold tracking-wider uppercase">
                Analyzing Thread...
              </span>
            </div>

            {/* Summary Skeleton */}
            <div className="border-outline-variant/30 dark:border-slate-800 bg-surface-container-low/50 dark:bg-slate-800/50 flex flex-col gap-3 rounded-2xl border p-4">
              <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-slate-700"></div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-700"></div>
                <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-slate-700"></div>
                <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-slate-700"></div>
              </div>
            </div>

            {/* Tasks Skeleton */}
            <div className="border-outline-variant/30 dark:border-slate-800 bg-surface-container-low/50 dark:bg-slate-800/50 flex flex-col gap-3 rounded-2xl border p-4">
              <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-slate-700"></div>
              <div className="space-y-2">
                <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-slate-700"></div>
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-700"></div>
              </div>
            </div>

            {/* Reply Skeleton */}
            <div className="border-outline-variant/30 dark:border-slate-800 bg-surface-container-low/50 dark:bg-slate-800/50 flex flex-col gap-3 rounded-2xl border p-4">
              <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-slate-700"></div>
              <div className="h-12 w-full rounded bg-gray-200 dark:bg-slate-700"></div>
            </div>
          </div>
        ) : queryError && !activeAnalysis ? (
          // Error State View
          <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <h4 className="text-body-md font-bold">Analysis Failed</h4>
            <p className="text-body-sm text-red-700">
              {queryError?.message || "There was an error communicating with OpenAI to analyze this thread. Please verify your API Key and network."}
            </p>
          </div>
        ) : activeAnalysis ? (
          // Analysis Loaded State
          <div className="flex flex-col gap-5">
            {/* 1. Summary Card */}
            <div className="border-outline-variant/30 dark:border-slate-800 bg-surface-container-low/50 dark:bg-slate-800/50 ai-border dark:border-slate-700/50 hover-lift flex flex-col gap-2.5 rounded-2xl border p-4">
              <div className="text-primary dark:text-indigo-400 text-body-md border-outline-variant/20 dark:border-slate-700 flex items-center gap-1.5 border-b pb-1.5 font-semibold select-none">
                <Sparkles size={16} />
                <span>Thread Summary</span>
              </div>
              <div
                className="text-body-sm text-on-surface-variant dark:text-slate-300 leading-relaxed select-text"
                dangerouslySetInnerHTML={{ __html: activeAnalysis.summary }}
              />
            </div>

            {/* 2. Actionable Tasks Card */}
            <div className="border-outline-variant/30 dark:border-slate-800 bg-surface-container-low/50 dark:bg-slate-800/50 ai-border dark:border-slate-700/50 hover-lift flex flex-col gap-2.5 rounded-2xl border p-4">
              <div className="text-primary dark:text-indigo-400 text-body-md border-outline-variant/20 dark:border-slate-700 flex items-center gap-1.5 border-b pb-1.5 font-semibold select-none">
                <ClipboardCheck size={16} />
                <span>Actionable Tasks</span>
              </div>
              {activeAnalysis.tasks.length === 0 ? (
                <p className="text-on-surface-variant dark:text-slate-500 text-xs italic select-none">
                  No tasks detected in this email.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {activeAnalysis.tasks.map((task, idx) => (
                    <li
                      key={idx}
                      className="text-body-sm text-on-surface-variant dark:text-slate-300 flex items-start gap-2.5"
                    >
                      <input
                        type="checkbox"
                        id={`task-${idx}`}
                        checked={!!completedTasks[idx]}
                        onChange={() => toggleTask(idx)}
                        className="text-primary dark:text-indigo-500 focus:ring-primary dark:focus:ring-indigo-500 mt-1 h-3.5 w-3.5 cursor-pointer rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800"
                      />
                      <label
                        htmlFor={`task-${idx}`}
                        className={`cursor-pointer leading-tight transition-all select-none ${completedTasks[idx] ? "line-through opacity-50" : ""
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
              <div className="border-outline-variant/30 dark:border-slate-800 from-primary/5 dark:from-indigo-900/20 to-secondary/5  border-primary/20 dark:border-indigo-500/20 hover-lift flex flex-col gap-2.5 rounded-2xl border bg-gradient-to-br p-4">
                <div className="text-secondary dark:text-indigo-400 text-body-md border-outline-variant/20 dark:border-slate-700/50 flex items-center gap-1.5 border-b pb-1.5 font-semibold select-none">
                  <CalendarCheck size={16} />
                  <span>Schedule Meeting</span>
                </div>

                <div className="text-body-sm text-on-surface-variant dark:text-slate-300 leading-normal">
                  <p className="text-secondary dark:text-indigo-400 mb-1 text-xs font-semibold tracking-wider uppercase select-none">
                    Proposed Topic
                  </p>
                  <p className="text-body-sm font-medium italic select-text">
                    "
                    {activeAnalysis.meetingDetails.proposedTopic ||
                      "Sync meeting"}
                    "
                  </p>
                </div>

                {activeAnalysis.meetingDetails.suggestedDateTimes &&
                  activeAnalysis.meetingDetails.suggestedDateTimes.length >
                  0 && (
                    <div className="mt-1.5">
                      <p className="text-on-surface-variant/80 dark:text-slate-400 mb-1.5 text-xs font-semibold select-none">
                        Extracted Times (click to autofill):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeAnalysis.meetingDetails.suggestedDateTimes.map(
                          (time, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestedTimeClick(time)}
                              className="hover:bg-primary/5 dark:hover:bg-indigo-500/10 text-primary dark:text-indigo-300 border-outline-variant/50 dark:border-slate-700 hover:border-primary/50 dark:hover:border-indigo-500/50 cursor-pointer rounded-full border bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium transition-all"
                              suppressHydrationWarning
                            >
                              {time}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => handleMeetingTimeChange(e.target.value)}
                    placeholder="Enter meeting time..."
                    className="text-body-sm border-outline-variant dark:border-slate-700 focus:border-primary dark:focus:border-indigo-500 placeholder:text-on-surface-variant/50 dark:placeholder:text-slate-500 flex-1 rounded border bg-white dark:bg-slate-800 dark:text-slate-200 px-3 py-1.5 transition-colors focus:outline-none"
                    suppressHydrationWarning
                  />
                  <button
                    onClick={handleScheduleMeeting}
                    disabled={scheduleMutation.isPending || !meetingTime.trim()}
                    className="bg-secondary dark:bg-indigo-600 hover:bg-secondary/90 dark:hover:bg-indigo-500 text-label-caps flex cursor-pointer items-center justify-center gap-1.5 rounded px-3 py-1.5 font-semibold text-white transition-colors disabled:opacity-50"
                    suppressHydrationWarning
                  >
                    {scheduleMutation.isPending && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
                  </button>
                </div>

                {isScheduled && (
                  <div className="text-body-sm animate-fadeIn mt-3.5 flex items-center gap-2 rounded-xl border border-green-200 dark:border-emerald-900/50 bg-green-50 dark:bg-emerald-900/20 p-3 text-green-800 dark:text-emerald-400">
                    <Check size={16} className="shrink-0 text-green-600 dark:text-emerald-500" />
                    <div>
                      <span className="font-semibold">Meeting Scheduled!</span>
                      <div className="mt-0.5 text-xs text-green-700 dark:text-emerald-500/80">
                        Time: {meetingTime}
                      </div>
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
