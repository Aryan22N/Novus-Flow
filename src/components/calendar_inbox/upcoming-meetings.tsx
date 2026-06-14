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
import image from "next/image";

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
    : d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  if (isToday) {
    return timeLabel;
  }

  const dateLabel = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${dateLabel}, ${timeLabel}`;
}

export default function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  // Query events from database/Google Calendar for the current month
  const {
    data: calendarData,
    isLoading: isEventsLoading,
    refetch,
  } = api.calendar.getEvents.useQuery({ year, month });

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
    const liveMeetings: MeetingItem[] = (calendarData?.events ?? []).map(
      (ev) => {
        // Clean description: remove HTML tags, keep only first line or first 60 chars
        let cleanDesc = ev.description
          ? ev.description.replace(/<[^>]*>/g, "").trim()
          : "";
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
          title:
            ev.title.length > 30 ? ev.title.slice(0, 30) + "..." : ev.title,
          time: formatEventDateTime(ev.start, ev.allDay),
          type: "live" as const,
          subtext: subtext.length > 60 ? subtext.slice(0, 60) + "..." : subtext,
          htmlLink: ev.htmlLink,
        };
      },
    );

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
                (ev) => ev.id === entry.eventId,
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

            let title =
              entry.analysis.meetingDetails.proposedTopic ||
              "AI Scheduled Sync";
            if (title.length > 30) {
              title = title.slice(0, 30) + "...";
            }

            // Deduplicate: If this local storage event is already present in Google Calendar events, skip it
            const isAlreadyInLive = liveMeetings.some(
              (lm) =>
                lm.title.toLowerCase() === title.toLowerCase() ||
                lm.time.includes(entry.meetingTime),
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
          localStorage.setItem(
            "superman_ai_analysis_cache",
            JSON.stringify(cache),
          );
        }
      }
    } catch (err) {
      console.error("Error reading localStorage meetings:", err);
    }

    // 3. Combine live (Google Calendar) and AI Panel local fallback meetings
    setMeetings([...liveMeetings, ...aiMeetings]);
  }, [calendarData]);

  return (
    <div className=" border-outline-variant flex h-[300px] flex-col rounded-xl border p-4 shrink-0" style={{ backgroundImage: 'linear-gradient(to top, #dfe9f3 0%, white 100%)' }}>
      <h3 className="text-title-sm font-title-sm text-on-surface mb-4 flex shrink-0 items-center gap-2 select-none">
        <CalendarDays size={18} className="text-secondary" />
        Upcoming Meetings
      </h3>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {meetings.map((meeting) => {
          if (meeting.type === "live") {
            return (
              <div
                key={meeting.id}
                className="border-primary bg-surface-container-low rounded-r-lg border-l-4 p-3 transition-shadow hover:shadow-sm"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span
                    className="text-body-md text-on-surface flex-1 truncate font-bold"
                    title={meeting.title}
                  >
                    {meeting.title}
                  </span>
                  <div className="text-body-sm text-on-surface-variant flex shrink-0 items-center gap-1 whitespace-nowrap">
                    <Clock3 size={14} />
                    <span>{meeting.time}</span>
                  </div>
                </div>
                {meeting.subtext && (
                  <p
                    className="text-body-sm text-on-surface-variant mb-2 truncate"
                    title={meeting.subtext}
                  >
                    {meeting.subtext}
                  </p>
                )}
                {meeting.htmlLink && (
                  <a
                    href={meeting.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=" text-body-sm hover:bg-primary-container flex w-full cursor-pointer items-center justify-center gap-2 rounded px-3 py-1.5 text-center font-semibold text-white transition-colors"
                    style={{ backgroundImage: 'linear-gradient(to top, #1e3c72 0%, #1e3c72 1%, #2a5298 100%)' }}
                  >
                    Join Meeting (Google Calendar)
                    <ExternalLink size={14} />
                  </a>
                )
                }
              </div>
            );
          } else {
            // AI Panel scheduled meeting card
            return (
              <div
                key={meeting.id}
                className="border-secondary bg-surface-container-low animate-fadeIn rounded-r-lg border-l-4 p-3 transition-shadow hover:shadow-sm"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span
                    className="text-body-md text-on-surface flex-1 truncate font-bold"
                    title={meeting.title}
                  >
                    {meeting.title}
                  </span>
                  <div className="text-body-sm text-on-surface-variant flex shrink-0 items-center gap-1 whitespace-nowrap">
                    <Clock3 size={14} />
                    <span>{meeting.time}</span>
                  </div>
                </div>
                <div className="text-body-sm text-on-surface-variant mb-2 flex items-center gap-1">
                  <Users size={14} className="text-secondary" />
                  <span className="text-secondary text-xs font-medium">
                    {meeting.subtext}
                  </span>
                </div>
                <Link
                  href={`/inbox/${meeting.id}`}
                  className="bg-secondary text-body-sm hover:bg-secondary/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded px-3 py-1.5 text-center font-semibold text-white transition-colors"
                >
                  <MailOpen size={14} />
                  View Thread
                </Link>
              </div>
            );
          }
        })}

        {meetings.length === 0 && !isLoading && (
          <p className="text-on-surface-variant p-4 text-center text-xs italic select-none">
            No upcoming meetings.
          </p>
        )}

        {isLoading && (
          <div className="text-on-surface-variant flex items-center justify-center gap-2 p-4 text-xs select-none">
            <Loader2 size={12} className="text-primary animate-spin" />
            <span>Loading calendar...</span>
          </div>
        )}
      </div>
    </div >
  );
}
