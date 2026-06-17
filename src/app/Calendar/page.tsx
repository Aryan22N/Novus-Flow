"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppSidebar from "~/components/layout/app-sidebar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Palette cycles for event colours (Google Calendar style)
const EVENT_COLORS = [
  "bg-[#1a73e8] text-white",
  "bg-[#33b679] text-white",
  "bg-[#8e24aa] text-white",
  "bg-[#e67c73] text-white",
  "bg-[#f6bf26] text-[#3c4043]",
  "bg-[#f4511e] text-white",
  "bg-[#039be5] text-white",
  "bg-[#616161] text-white",
];

function colorFor(eventId: string) {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++)
    hash = (hash * 31 + eventId.charCodeAt(i)) | 0;
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length]!;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Returns the calendar cells (including overflow from prev/next month) for a month grid. */
function buildGridDays(year: number, month: number /* 1-based */) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Leading overflow
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 2, daysInPrev - i),
      isCurrentMonth: false,
    });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month - 1, d), isCurrentMonth: true });
  }
  // Trailing overflow to fill 5 rows (35 cells) or 6 rows (42 cells)
  const total = cells.length > 35 ? 42 : 35;
  let overflow = 1;
  while (cells.length < total) {
    cells.push({
      date: new Date(year, month, overflow++),
      isCurrentMonth: false,
    });
  }
  return cells;
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  year,
  month,
  onSelect,
  selectedYear,
  selectedMonth,
}: {
  year: number;
  month: number;
  onSelect: (y: number, m: number) => void;
  selectedYear: number;
  selectedMonth: number;
}) {
  const [miniYear, setMiniYear] = useState(year);
  const [miniMonth, setMiniMonth] = useState(month);

  const cells = buildGridDays(miniYear, miniMonth);
  const today = new Date();

  const prev = () => {
    if (miniMonth === 1) {
      setMiniMonth(12);
      setMiniYear((y) => y - 1);
    } else setMiniMonth((m) => m - 1);
  };
  const next = () => {
    if (miniMonth === 12) {
      setMiniMonth(1);
      setMiniYear((y) => y + 1);
    } else setMiniMonth((m) => m + 1);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-sm font-medium text-[#3c4043]">
          {MONTHS[miniMonth - 1]} {miniYear}
        </span>
        <div className="flex gap-1">
          <button
            onClick={prev}
            className="rounded-full p-1 hover:bg-[#f1f3f4]"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={next}
            className="rounded-full p-1 hover:bg-[#f1f3f4]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium text-[#70757a]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map(({ date, isCurrentMonth }, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const isSelected =
            date.getFullYear() === selectedYear &&
            date.getMonth() + 1 === selectedMonth;
          return (
            <button
              key={i}
              onClick={() => onSelect(date.getFullYear(), date.getMonth() + 1)}
              className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] transition-colors ${isToday ? "bg-[#1a73e8] font-semibold text-white" : ""} ${!isToday && isSelected ? "bg-[#e8f0fe] font-semibold text-[#1a73e8]" : ""} ${!isToday && !isSelected && isCurrentMonth ? "text-[#3c4043] hover:bg-[#f1f3f4]" : ""} ${!isToday && !isSelected && !isCurrentMonth ? "text-[#b0b5ba] hover:bg-[#f1f3f4]" : ""} `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Event Pill ───────────────────────────────────────────────────────────────

interface CalEvent {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  allDay: boolean;
  location: string | null;
  description: string | null;
  colorId: string | null;
  status: string | null;
  htmlLink: string | null;
}

function EventPill({ event }: { event: CalEvent }) {
  const [isOpen, setIsOpen] = useState(false);
  const color = colorFor(event.id);
  const timeLabel = event.allDay ? "All day" : formatTime(event.start);
  
  const utils = api.useUtils();
  const deleteMutation = api.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      setIsOpen(false);
    }
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this?")) {
      deleteMutation.mutate({ eventId: event.id });
    }
  };

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`${color} cursor-pointer truncate rounded px-1.5 py-0.5 text-[11px] leading-tight font-medium hover:opacity-90 transition-opacity`}
      >
        {!event.allDay && <span className="mr-1 opacity-80">{timeLabel}</span>}
        {event.title}
      </div>
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div 
            className="w-full max-w-sm rounded-lg bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-outline-variant/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Actions */}
            <div className="flex justify-end p-2 gap-1 bg-[#f1f3f4] border-b border-outline-variant/50">
              <button 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#e8eaed] transition-colors cursor-pointer disabled:opacity-50"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#e8eaed] transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Details */}
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-4 w-4 rounded shrink-0 ${color.replace('bg-', 'bg-')}`}></div>
                <div>
                  <h3 className="text-xl leading-tight font-normal text-[#3c4043] mb-1">
                    {event.title}
                  </h3>
                  {event.start && (
                    <p className="text-sm text-[#3c4043]">
                      {new Date(event.start).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                      {!event.allDay &&
                        ` ⋅ ${formatTime(event.start)}${event.end ? ` – ${formatTime(event.end)}` : ""}`}
                    </p>
                  )}
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-4 text-sm text-[#3c4043]">
                  <svg className="w-5 h-5 text-[#5f6368] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <p>{event.location}</p>
                </div>
              )}
              
              {event.description && (
                <div className="flex items-start gap-4 text-sm text-[#3c4043]">
                  <svg className="w-5 h-5 text-[#5f6368] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based

  // Modal & Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<"Event" | "Task" | "Appointment">("Event");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: today.toISOString().substring(0, 10), // YYYY-MM-DD
    time: "10:00",
  });

  const { data, isLoading, refetch, isRefetching } =
    api.calendar.getEvents.useQuery(
      { year, month },
      { refetchOnWindowFocus: false },
    );

  const syncMutation = api.calendar.syncEvents.useMutation({
    onSuccess: () => refetch(),
  });

  const createEventMutation = api.calendar.createEvent.useMutation({
    onSuccess: () => {
      refetch();
      setCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        date: today.toISOString().substring(0, 10),
        time: "10:00",
      });
      toast.success("Event created");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create event");
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) return;

    let finalTitle = formData.title;
    if (createModalTab === "Task") {
      finalTitle = `[Task] ${finalTitle}`;
    } else if (createModalTab === "Appointment") {
      finalTitle = `[Appointment] ${finalTitle}`;
    }

    // Format meetingTime as "2026-06-16T10:00"
    const meetingTime = `${formData.date}T${formData.time}`;

    createEventMutation.mutate({
      summary: finalTitle,
      description: formData.description,
      meetingTime,
    });
  };

  // On every page load / reload: sync fresh events from Google Calendar into the DB,
  // then refetch so the UI shows up-to-date data.
  useEffect(() => {
    syncMutation.mutate({ daysAhead: 90 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build a map: "YYYY-MM-DD" → events[]
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const ev of data?.events ?? []) {
      if (!ev.start) continue;
      const dateKey = ev.start.substring(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(ev);
    }
    return map;
  }, [data]);

  const gridCells = useMemo(() => buildGridDays(year, month), [year, month]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const isBusy = isLoading || isRefetching || syncMutation.isPending;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-sans">
      {/* ── Top Header ── */}
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[#dadce0] px-4">
        <div className="flex items-center">
          <button
            className="rounded-full pl-2 transition-colors hover:bg-[#f1f3f4]"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg
              className="h-6 w-6 text-[#3c4043]"
              focusable="false"
              viewBox="0 0 24 24"
            >
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
            </svg>
          </button>
          <Link href="/inbox">
            <img
              src="/Nexus_Flow_logo.png"
              alt="Logo"
              className="h-auto w-32 object-contain select-none"
            />
          </Link>

          <div className="ml-6 flex items-center gap-2">
            <button
              onClick={goToday}
              className="rounded-lg border border-[#dadce0] px-4 py-1.5 text-sm font-medium text-[#3c4043] transition-colors hover:bg-[#f1f3f4]"
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="rounded-full p-2 transition-colors hover:bg-[#f1f3f4]"
            >
              <ChevronLeft size={18} className="text-[#3c4043]" />
            </button>
            <button
              onClick={nextMonth}
              className="rounded-full p-2 transition-colors hover:bg-[#f1f3f4]"
            >
              <ChevronRight size={18} className="text-[#3c4043]" />
            </button>
            <h1 className="ml-2 text-[22px] font-normal text-[#3c4043]">
              {MONTHS[month - 1]} {year}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync button */}
          <button
            onClick={() => syncMutation.mutate({ daysAhead: 90 })}
            disabled={isBusy}
            title="Sync from Google Calendar"
            className="flex items-center gap-1.5 rounded-lg border border-[#dadce0] px-3 py-1.5 text-sm text-[#3c4043] transition-colors hover:bg-[#f1f3f4] disabled:opacity-50"
          >
            {isBusy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            {isBusy ? "Syncing…" : "Sync"}
          </button>
        </div>
      </header>
      {/* ── Body ── */}

      <div className="flex flex-1 overflow-hidden">
        {/* ── App Sidebar ── */}
        <AppSidebar isOpen={isSidebarOpen} />

        {/* ── Month Grid ── */}
        <section className="flex flex-1 flex-col overflow-hidden">
          {/* Day headers */}
          <div className="grid flex-shrink-0 grid-cols-7 border-b border-[#dadce0]">
            {DAYS.map((d) => (
              <div
                key={d}
                className="border-r border-[#dadce0] py-2 text-center text-[11px] font-medium text-[#70757a] last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid body */}
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 size={32} className="animate-spin text-[#1a73e8]" />
            </div>
          ) : (
            <div
              className="grid flex-1 grid-cols-7 overflow-auto"
              style={{
                gridTemplateRows: `repeat(${gridCells.length / 7}, minmax(0, 1fr))`,
              }}
            >
              {gridCells.map(({ date, isCurrentMonth }, idx) => {
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const dayEvents = eventsByDate.get(dateKey) ?? [];
                const isToday = date.toDateString() === today.toDateString();

                return (
                  <div
                    key={idx}
                    className={`flex min-h-[100px] flex-col gap-0.5 border-r border-b border-[#dadce0] p-1.5 ${!isCurrentMonth ? "bg-[#fafafa]" : "bg-white"} ${idx % 7 === 6 ? "border-r-0" : ""} `}
                  >
                    {/* Date number */}
                    <div className="mb-0.5 flex justify-center">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday ? "bg-[#1a73e8] text-white" : isCurrentMonth ? "text-[#3c4043]" : "text-[#b0b5ba]"} `}
                      >
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev, evIdx) => (
                        <EventPill
                          key={`${dateKey}-${ev.id}-${evIdx}`}
                          event={ev}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="px-1 text-[10px] text-[#70757a]">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Sidebar (Calendar Specific) */}
        <aside
          className="flex w-64 flex-shrink-0 flex-col gap-6 border-l border-[#dadce0] p-4"
          data-purpose="sidebar-navigation"
        >
          <div className="relative">
            <button
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className="flex items-center gap-3 rounded-full border border-[#dadce0] px-4 py-2 shadow-md transition-shadow hover:shadow-lg bg-white relative z-10"
            >
              <svg height="36" viewBox="0 0 36 36" width="36">
                <path d="M16 16v14h4V20z rounded-full" fill="#74B9DE"></path>
                <path d="M30 16H20l-4 4h14z rounded-full" fill="#74B9DE"></path>
                <path d="M6 16v4h10l4-4z rounded-full" fill="#74B9DE"></path>
                <path d="M20 16V6h-4v14z rounded-full" fill="#74B9DE"></path>
                <path d="M0 0h36v36H0 rounded-full" fill="none"></path>
              </svg>
              <span className="text-sm font-medium">Create</span>
              <svg
                className="ml-2 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                ></path>
              </svg>
            </button>
            {isCreateOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCreateOpen(false)}
                />
                <div className="absolute top-14 left-0 z-50 w-56 rounded-md bg-white py-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-black ring-opacity-5">
                  <button className="flex w-full items-center px-4 py-2 text-sm text-[#3c4043] hover:bg-[#f1f3f4]" onClick={() => { setIsCreateOpen(false); setCreateModalTab("Event"); setCreateModalOpen(true); }}>Event</button>
                  <button className="flex w-full items-center px-4 py-2 text-sm text-[#3c4043] hover:bg-[#f1f3f4]" onClick={() => { setIsCreateOpen(false); setCreateModalTab("Task"); setCreateModalOpen(true); }}>Task</button>
                  <button className="flex w-full items-center px-4 py-2 text-sm text-[#3c4043] hover:bg-[#f1f3f4]" onClick={() => { setIsCreateOpen(false); setCreateModalTab("Appointment"); setCreateModalOpen(true); }}>Appointment schedule</button>
                </div>
              </>
            )}
          </div>

          {/* Mini Calendar */}
          <div className="mt-4" data-purpose="mini-calendar">
            <MiniCalendar
              year={year}
              month={month}
              selectedYear={year}
              selectedMonth={month}
              onSelect={(y, m) => {
                setYear(y);
                setMonth(m);
              }}
            />
          </div>

          {/* Assigned Tasks */}
          <div className="space-y-3" data-purpose="calendar-tasks">
            <div className="flex items-center justify-between text-sm font-medium text-[#3c4043] border-b border-outline-variant/30 pb-2">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1a73e8]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
                Assigned Tasks
              </span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {(() => {
                const tasks = (data?.events ?? [])
                  .filter(ev => ev.title?.startsWith("[Task]"))
                  .sort((a, b) => {
                    const dateA = a.start ? new Date(a.start).getTime() : 0;
                    const dateB = b.start ? new Date(b.start).getTime() : 0;
                    return dateB - dateA; // Most recent on top
                  });

                if (tasks.length === 0) {
                  return <p className="text-xs text-[#70757a] text-center py-4">No tasks assigned.</p>;
                }

                return tasks.map(task => {
                  const deadline = task.start 
                    ? new Date(task.start).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) 
                    : "No deadline";
                  const title = task.title.replace("[Task]", "").trim();

                  return (
                    <div key={task.id} className="group relative flex flex-col gap-1 rounded-lg border border-[#dadce0] p-3 hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-semibold text-[#3c4043] leading-tight break-words pr-2">{title}</span>
                        <div className="h-3 w-3 rounded-full bg-[#1a73e8] shrink-0 mt-0.5"></div>
                      </div>
                      <span className="text-xs text-[#d93025] font-medium mt-1">Due: {deadline}</span>
                      {task.description && (
                        <p className="text-xs text-[#5f6368] line-clamp-2 mt-1">{task.description}</p>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </aside>
      </div>

      {/* Create Modal overlay */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-outline-variant/30">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#f1f3f4] px-4 py-2 border-b border-outline-variant/50">
              <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">
                Create new {createModalTab}
              </span>
              <button onClick={() => setCreateModalOpen(false)} className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#e8eaed] transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            {/* Body */}
            <div className="p-5 px-6 space-y-6">
              <input
                type="text"
                placeholder="Add title"
                value={formData.title}
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                className="w-full text-2xl font-normal bg-transparent border-b-2 border-transparent focus:border-[#1a73e8] outline-none pb-2 text-[#3c4043] placeholder-[#70757a] transition-colors"
              />

              {/* Tabs */}
              <div className="flex gap-1 border-b border-outline-variant/50 pb-2">
                <button onClick={() => setCreateModalTab("Event")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${createModalTab === "Event" ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#5f6368] hover:bg-[#f1f3f4]"}`}>Event</button>
                <button onClick={() => setCreateModalTab("Task")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${createModalTab === "Task" ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#5f6368] hover:bg-[#f1f3f4]"}`}>Task</button>
                <button onClick={() => setCreateModalTab("Appointment")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${createModalTab === "Appointment" ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#5f6368] hover:bg-[#f1f3f4]"}`}>Appointment schedule</button>
              </div>

              {/* Dynamic Content */}
              <div className="min-h-[140px] flex flex-col gap-5 text-[#3c4043] text-sm">
                
                {/* Event or Appointment Date/Time */}
                {createModalTab !== "Task" && (
                  <div className="flex items-start gap-4">
                    <svg className="w-5 h-5 text-[#5f6368] mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2">
                        <input type="date" value={formData.date} onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))} className="bg-transparent border-none outline-none text-[#3c4043] font-medium cursor-pointer hover:bg-[#f1f3f4] rounded px-1" />
                        <input type="time" value={formData.time} onChange={(e) => setFormData(f => ({ ...f, time: e.target.value }))} className="bg-transparent border-none outline-none text-[#3c4043] font-medium cursor-pointer hover:bg-[#f1f3f4] rounded px-1" />
                      </div>
                      <span className="text-xs text-[#70757a]">Time zone · Does not repeat</span>
                    </div>
                  </div>
                )}

                {/* Task Specific Deadline */}
                {createModalTab === "Task" && (
                  <div className="flex items-start gap-4 border-b border-outline-variant/30 pb-4">
                    <svg className="w-5 h-5 text-[#1a73e8] mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="text-xs font-semibold text-[#1a73e8] uppercase tracking-wider">Add Deadline</span>
                      <div className="flex gap-2 mt-1">
                        <input type="date" value={formData.date} onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))} className="bg-transparent border-none outline-none text-[#3c4043] font-medium cursor-pointer hover:bg-[#f1f3f4] rounded px-1" />
                        <input type="time" value={formData.time} onChange={(e) => setFormData(f => ({ ...f, time: e.target.value }))} className="bg-transparent border-none outline-none text-[#3c4043] font-medium cursor-pointer hover:bg-[#f1f3f4] rounded px-1" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Description (Shared) */}
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5 text-[#5f6368] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                  <input
                    type="text"
                    placeholder="Add description"
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    className="w-full text-sm bg-transparent border-b border-transparent focus:border-[#1a73e8] outline-none pb-1 text-[#3c4043] placeholder-[#70757a] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 pt-2 bg-[#f8f9fa] border-t border-outline-variant/30">
              <button
                onClick={handleSave}
                disabled={createEventMutation.isPending || !formData.title.trim()}
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {createEventMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
