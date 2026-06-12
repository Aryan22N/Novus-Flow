"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Users,
  MailOpen,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";

interface MeetingItem {
  id: string; // Google event ID / thread ID
  title: string;
  time: string;
  type: "live" | "ai";
  subtext?: string;
  htmlLink?: string | null;
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

function formatEventDateTime(startIso: string | null, allDay: boolean): string {
  if (!startIso) return "";
  const d = new Date(startIso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const timeLabel = allDay
    ? "All day"
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (isToday) {
    return timeLabel;
  }

  const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${dateLabel}, ${timeLabel}`;
}

export default function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  // Query events from database/Google Calendar for the current month
  const { data: calendarData, isLoading: isEventsLoading, refetch } = api.calendar.getEvents.useQuery(
    { year, month }
  );

  const syncMutation = api.calendar.syncEvents.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  useEffect(() => {
    syncMutation.mutate({ daysAhead: 60 });

    const handleFocus = () => {
      syncMutation.mutate({ daysAhead: 60 });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = isEventsLoading || syncMutation.isPending;

  useEffect(() => {
    // 1. Process Google Calendar events (live/cached in DB)
    const liveMeetings: MeetingItem[] = (calendarData?.events ?? []).map((ev) => {
      // Clean description: remove HTML tags, keep only first line or first 60 chars
      let cleanDesc = ev.description ? ev.description.replace(/<[^>]*>/g, "").trim() : "";
      if (cleanDesc.includes("\n")) {
        cleanDesc = cleanDesc.split("\n")[0]!.trim();
      }
      if (cleanDesc.length > 60) {
        cleanDesc = cleanDesc.slice(0, 60) + "...";
      }

      const subtext = ev.location
        ? `📍 ${ev.location}${cleanDesc ? ` · ${cleanDesc}` : ""}`
        : cleanDesc || "Google Calendar Event";

      return {
        id: ev.id,
        title: ev.title.length > 30 ? ev.title.slice(0, 30) + "..." : ev.title,
        time: formatEventDateTime(ev.start, ev.allDay),
        type: "live" as const,
        subtext: subtext.length > 60 ? subtext.slice(0, 60) + "..." : subtext,
        htmlLink: ev.htmlLink,
      };
    });

    // 2. Read local cache to find any meeting scheduled via AI panel in the current session
    const aiMeetings: MeetingItem[] = [];
    try {
      const cachedDataStr = localStorage.getItem("superman_ai_analysis_cache");
      if (cachedDataStr) {
        let cacheChanged = false;
        const cache = JSON.parse(cachedDataStr) as Record<string, CacheEntry>;
        for (const [threadId, entry] of Object.entries(cache)) {
          if (entry.isScheduled && entry.meetingTime) {
            // Self-healing: If we have an eventId, verify that the event still exists in Google Calendar
            if (entry.eventId && calendarData) {
              const existsInCalendar = (calendarData.events ?? []).some(
                (ev) => ev.id === entry.eventId
              );
              if (!existsInCalendar) {
                // The event was deleted from Google Calendar. Reset local cache entry.
                cache[threadId] = {
                  ...entry,
                  isScheduled: false,
                  eventId: undefined,
                  meetingTime: "",
                };
                cacheChanged = true;
                continue; // Skip rendering it
              }
            }

            let title = entry.analysis.meetingDetails.proposedTopic || "AI Scheduled Sync";
            if (title.length > 30) {
              title = title.slice(0, 30) + "...";
            }

            // Deduplicate: If this local storage event is already present in Google Calendar events, skip it
            const isAlreadyInLive = liveMeetings.some(
              (lm) =>
                lm.title.toLowerCase() === title.toLowerCase() ||
                lm.time.includes(entry.meetingTime)
            );

            if (!isAlreadyInLive) {
              aiMeetings.push({
                id: threadId,
                title,
                time: entry.meetingTime,
                type: "ai",
                subtext: "Scheduled via Nexus Assistant",
              });
            }
          }
        }

        if (cacheChanged) {
          localStorage.setItem("superman_ai_analysis_cache", JSON.stringify(cache));
        }
      }
    } catch (err) {
      console.error("Error reading localStorage meetings:", err);
    }

    // 3. Combine live (Google Calendar) and AI Panel local fallback meetings
    setMeetings([...liveMeetings, ...aiMeetings]);
  }, [calendarData]);

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-col h-[52%]">
      <h3 className="text-title-sm font-title-sm text-on-surface mb-4 flex items-center gap-2 shrink-0 select-none">
        <CalendarDays size={18} className="text-secondary" />
        Upcoming Meetings
      </h3>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
        {meetings.map((meeting) => {
          if (meeting.type === "live") {
            return (
              <div key={meeting.id} className="border-l-4 border-primary bg-surface-container-low p-3 rounded-r-lg hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-body-md font-bold text-on-surface truncate flex-1" title={meeting.title}>
                    {meeting.title}
                  </span>
                  <div className="flex items-center gap-1 text-body-sm text-on-surface-variant shrink-0 whitespace-nowrap">
                    <Clock3 size={14} />
                    <span>{meeting.time}</span>
                  </div>
                </div>
                {meeting.subtext && (
                  <p className="text-body-sm text-on-surface-variant mb-2 truncate" title={meeting.subtext}>
                    {meeting.subtext}
                  </p>
                )}
                {meeting.htmlLink && (
                  <a
                    href={meeting.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-white text-body-sm px-3 py-1.5 rounded hover:bg-primary-container transition-colors w-full font-semibold flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    Join Meeting (Google Calendar)
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            );
          } else {
            // AI Panel scheduled meeting card
            return (
              <div key={meeting.id} className="border-l-4 border-secondary bg-surface-container-low p-3 rounded-r-lg hover:shadow-sm transition-shadow animate-fadeIn">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-body-md font-bold text-on-surface truncate flex-1" title={meeting.title}>
                    {meeting.title}
                  </span>
                  <div className="flex items-center gap-1 text-body-sm text-on-surface-variant shrink-0 whitespace-nowrap">
                    <Clock3 size={14} />
                    <span>{meeting.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-body-sm text-on-surface-variant mb-2">
                  <Users size={14} className="text-secondary" />
                  <span className="text-xs text-secondary font-medium">{meeting.subtext}</span>
                </div>
                <Link
                  href={`/inbox/${meeting.id}`}
                  className="bg-secondary text-white text-body-sm px-3 py-1.5 rounded hover:bg-secondary/90 transition-colors w-full font-semibold flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <MailOpen size={14} />
                  View Thread
                </Link>
              </div>
            );
          }
        })}

        {meetings.length === 0 && !isLoading && (
          <p className="text-xs text-on-surface-variant italic p-4 text-center select-none">
            No upcoming meetings.
          </p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-4 gap-2 text-xs text-on-surface-variant select-none">
            <Loader2 size={12} className="animate-spin text-primary" />
            <span>Loading calendar...</span>
          </div>
        )}
      </div>
    </div>
  );
}