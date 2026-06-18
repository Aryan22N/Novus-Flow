"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Users,
  MailOpen,
  ExternalLink,
  Loader2,
  CheckSquare,
  Calendar,
  Briefcase,
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
  allDay?: boolean;
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

export default function CalendarEvents() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"events" | "appointments" | "tasks">("events");

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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const liveMeetings: MeetingItem[] = (calendarData?.events ?? [])
      .filter((ev) => {
        if (!ev.start) return false;
        const d = new Date(ev.start);
        if (ev.allDay && ev.start.includes("-")) {
          const parts = ev.start.split("T")[0]!.split("-");
          if (parts.length === 3) {
            d.setFullYear(
              parseInt(parts[0]!, 10),
              parseInt(parts[1]!, 10) - 1,
              parseInt(parts[2]!, 10)
            );
            d.setHours(0, 0, 0, 0);
          }
        }
        const nowTime = new Date();
        const endTime = ev.end ? new Date(ev.end) : null;
        
        // Filter out meetings that have already ended
        if (endTime && endTime < nowTime) {
          return false;
        }

        // If no end time is available, fallback to checking if it started before today
        if (!endTime && d < todayStart) {
          return false;
        }

        return true;
      })
      .map((ev) => {
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
          allDay: ev.allDay,
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
            const meetingStart = new Date(entry.meetingTime);
            const meetingEnd = new Date(meetingStart.getTime() + 30 * 60000); // 30 mins default duration
            if (meetingEnd < new Date()) {
              continue;
            }
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
                allDay: false,
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

  // Categorize events
  const appointments = meetings.filter(m => /(meeting|sync|call|appointment|1:1|interview)/i.test(m.title) || m.type === "ai");
  const tasks = meetings.filter(m => !appointments.includes(m) && (/(task|todo|to-do|reminder)/i.test(m.title) || m.allDay));
  const events = meetings.filter(m => !appointments.includes(m) && !tasks.includes(m));

  const getActiveList = () => {
    if (activeTab === "appointments") return appointments;
    if (activeTab === "tasks") return tasks;
    return events;
  };

  const activeList = getActiveList();

  return (
    <div className="border-outline-variant dark:border-slate-800 flex h-[450px] flex-col rounded-xl border pt-4 shrink-0 shadow-sm transition-colors duration-300 bg-gradient-to-t from-[#dfe9f3] to-white dark:from-slate-900 dark:to-slate-900">
      <h3 className="text-title-sm font-title-sm text-on-surface dark:text-slate-200 mb-3 pl-4 flex shrink-0 items-center gap-2 select-none">
        <CalendarDays size={18} className="text-secondary dark:text-slate-400" />
        Calendar Events
      </h3>

      <div className="flex gap-2 px-4 mb-3 shrink-0">
        <button
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeTab === "events" ? "bg-primary text-white shadow-sm" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"}`}
        >
          <Calendar size={14} />
          Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeTab === "appointments" ? "bg-primary text-white shadow-sm" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"}`}
        >
          <Briefcase size={14} />
          Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeTab === "tasks" ? "bg-primary text-white shadow-sm" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"}`}
        >
          <CheckSquare size={14} />
          Tasks ({tasks.length})
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
        {activeList.map((meeting) => {
          if (meeting.type === "live") {
            return (
              <div
                key={meeting.id}
                className="border-primary bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-r-lg border-l-4 p-3 transition-shadow hover:shadow-md dark:hover:shadow-black/40"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span
                    className="text-body-md text-on-surface dark:text-slate-200 flex-1 truncate font-bold"
                    title={meeting.title}
                  >
                    {meeting.title}
                  </span>
                  <div className="text-body-sm text-on-surface-variant dark:text-slate-400 flex shrink-0 items-center gap-1 whitespace-nowrap">
                    <Clock3 size={14} />
                    <span>{meeting.time}</span>
                  </div>
                </div>
                {meeting.subtext && (
                  <p
                    className="text-body-sm text-on-surface-variant dark:text-slate-400 mb-2 truncate"
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
                    View Details
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
                className="border-secondary bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm animate-fadeIn rounded-r-lg border-l-4 p-3 transition-shadow hover:shadow-md dark:hover:shadow-black/40"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span
                    className="text-body-md text-on-surface dark:text-slate-200 flex-1 truncate font-bold"
                    title={meeting.title}
                  >
                    {meeting.title}
                  </span>
                  <div className="text-body-sm text-on-surface-variant dark:text-slate-400 flex shrink-0 items-center gap-1 whitespace-nowrap">
                    <Clock3 size={14} />
                    <span>{meeting.time}</span>
                  </div>
                </div>
                <div className="text-body-sm text-on-surface-variant dark:text-slate-400 mb-2 flex items-center gap-1">
                  <Users size={14} className="text-secondary dark:text-slate-400" />
                  <span className="text-secondary dark:text-slate-300 text-xs font-medium">
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

        {activeList.length === 0 && !isLoading && (
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-lg min-h-[180px] w-full h-full">
            <div
              className="absolute inset-0 bg-[length:100%_100%] bg-no-repeat bg-center opacity-80"
              style={{ backgroundImage: "url('/meetings_illus.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-100/90 dark:from-slate-900/90 to-gray-50/70 dark:to-slate-900/70" />
            <p className="text-on-surface-variant dark:text-slate-400 relative z-10 p-4 text-center text-sm italic font-medium select-none shadow-sm drop-shadow-sm">
              No {activeTab} scheduled.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-on-surface-variant dark:text-slate-400 flex items-center justify-center gap-2 p-4 text-xs select-none">
            <Loader2 size={12} className="text-primary animate-spin" />
            <span>Loading calendar...</span>
          </div>
        )}
      </div>
    </div>
  );
}
