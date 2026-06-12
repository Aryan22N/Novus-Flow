"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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
  for (let i = 0; i < eventId.length; i++) hash = (hash * 31 + eventId.charCodeAt(i)) | 0;
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length]!;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

/** Returns the calendar cells (including overflow from prev/next month) for a month grid. */
function buildGridDays(year: number, month: number /* 1-based */) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Leading overflow
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 2, daysInPrev - i), isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month - 1, d), isCurrentMonth: true });
  }
  // Trailing overflow to fill 5 rows (35 cells) or 6 rows (42 cells)
  const total = cells.length > 35 ? 42 : 35;
  let overflow = 1;
  while (cells.length < total) {
    cells.push({ date: new Date(year, month, overflow++), isCurrentMonth: false });
  }
  return cells;
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  year, month, onSelect, selectedYear, selectedMonth,
}: {
  year: number; month: number;
  onSelect: (y: number, m: number) => void;
  selectedYear: number; selectedMonth: number;
}) {
  const [miniYear, setMiniYear] = useState(year);
  const [miniMonth, setMiniMonth] = useState(month);

  const cells = buildGridDays(miniYear, miniMonth);
  const today = new Date();

  const prev = () => {
    if (miniMonth === 1) { setMiniMonth(12); setMiniYear(y => y - 1); }
    else setMiniMonth(m => m - 1);
  };
  const next = () => {
    if (miniMonth === 12) { setMiniMonth(1); setMiniYear(y => y + 1); }
    else setMiniMonth(m => m + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-sm font-medium text-[#3c4043]">{MONTHS[miniMonth - 1]} {miniYear}</span>
        <div className="flex gap-1">
          <button onClick={prev} className="p-1 hover:bg-[#f1f3f4] rounded-full">
            <ChevronLeft size={14} />
          </button>
          <button onClick={next} className="p-1 hover:bg-[#f1f3f4] rounded-full">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-medium text-[#70757a] mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map(({ date, isCurrentMonth }, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
          return (
            <button
              key={i}
              onClick={() => onSelect(date.getFullYear(), date.getMonth() + 1)}
              className={`w-6 h-6 text-[10px] rounded-full flex items-center justify-center mx-auto transition-colors
                ${isToday ? "bg-[#1a73e8] text-white font-semibold" : ""}
                ${!isToday && isSelected ? "bg-[#e8f0fe] text-[#1a73e8] font-semibold" : ""}
                ${!isToday && !isSelected && isCurrentMonth ? "text-[#3c4043] hover:bg-[#f1f3f4]" : ""}
                ${!isToday && !isSelected && !isCurrentMonth ? "text-[#b0b5ba] hover:bg-[#f1f3f4]" : ""}
              `}
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
  const [tooltip, setTooltip] = useState(false);
  const color = colorFor(event.id);
  const timeLabel = event.allDay ? "All day" : formatTime(event.start);

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        className={`${color} text-[11px] font-medium px-1.5 py-0.5 rounded cursor-pointer truncate leading-tight`}
      >
        {!event.allDay && <span className="opacity-80 mr-1">{timeLabel}</span>}
        {event.title}
      </div>
      {tooltip && (
        <div className="absolute z-50 left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-[#dadce0] p-3 text-xs text-[#3c4043]">
          <p className="font-semibold text-sm mb-1 leading-tight">{event.title}</p>
          {event.start && (
            <p className="text-[#70757a] mb-1">
              {new Date(event.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              {!event.allDay && ` · ${formatTime(event.start)}${event.end ? ` – ${formatTime(event.end)}` : ""}`}
            </p>
          )}
          {event.location && <p className="text-[#70757a] truncate">📍 {event.location}</p>}
          {event.description && <p className="mt-1 text-[#5f6368] line-clamp-2">{event.description}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based

  const { data, isLoading, refetch, isRefetching } = api.calendar.getEvents.useQuery(
    { year, month },
    { refetchOnWindowFocus: false }
  );

  const syncMutation = api.calendar.syncEvents.useMutation({
    onSuccess: () => refetch(),
  });

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
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); };

  const isBusy = isLoading || isRefetching || syncMutation.isPending;

  return (
    <div className="flex flex-col h-screen bg-white font-sans overflow-hidden">
      {/* ── Top Header ── */}
      <header className="h-16 border-b border-[#dadce0] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/inbox">
            <img
              src="/Nexus_Flow_logo.png"
              alt="Logo"
              className="w-32 h-auto ml-2 object-contain select-none"
            />
          </Link>

          <div className="flex items-center gap-2 ml-6">
            <button
              onClick={goToday}
              className="px-4 py-1.5 border border-[#dadce0] rounded-lg text-sm font-medium text-[#3c4043] hover:bg-[#f1f3f4] transition-colors"
            >
              Today
            </button>
            <button onClick={prevMonth} className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors">
              <ChevronLeft size={18} className="text-[#3c4043]" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors">
              <ChevronRight size={18} className="text-[#3c4043]" />
            </button>
            <h1 className="text-[22px] text-[#3c4043] font-normal ml-2">
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
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#dadce0] rounded-lg text-sm text-[#3c4043] hover:bg-[#f1f3f4] transition-colors disabled:opacity-50"
          >
            {isBusy
              ? <Loader2 size={15} className="animate-spin" />
              : <RefreshCw size={15} />
            }
            {isBusy ? "Syncing…" : "Sync"}
          </button>

          {/* Source badge */}
          {/* {data?.source && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
              ${data.source === "cache" ? "bg-[#e6f4ea] text-[#137333]" : ""}
              ${data.source === "live" ? "bg-[#e8f0fe] text-[#1a73e8]" : ""}
              ${data.source === "error" ? "bg-[#fce8e6] text-[#c5221f]" : ""}
            `}>
              {data.source === "cache" ? "● DB cache" : data.source === "live" ? "● Live" : "● Error"}
            </span>
          )} */}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-60 border-r border-[#dadce0] flex-shrink-0 p-4 flex flex-col gap-6 overflow-y-auto">
          <MiniCalendar
            year={year}
            month={month}
            onSelect={(y, m) => { setYear(y); setMonth(m); }}
            selectedYear={year}
            selectedMonth={month}
          />

          {/* Event count summary */}
          <div className="text-xs text-[#70757a] space-y-1">
            <p className="font-medium text-[#3c4043]">This month</p>
            <p>{data?.events.length ?? 0} event{data?.events.length !== 1 ? "s" : ""}</p>
          </div>
        </aside>

        {/* ── Month Grid ── */}
        <section className="flex-1 overflow-hidden flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#dadce0] flex-shrink-0">
            {DAYS.map(d => (
              <div key={d} className="text-center py-2 text-[11px] font-medium text-[#70757a] border-r border-[#dadce0] last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          {/* Grid body */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-[#1a73e8]" />
            </div>
          ) : (
            <div
              className="flex-1 grid grid-cols-7 overflow-auto"
              style={{ gridTemplateRows: `repeat(${gridCells.length / 7}, minmax(0, 1fr))` }}
            >
              {gridCells.map(({ date, isCurrentMonth }, idx) => {
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const dayEvents = eventsByDate.get(dateKey) ?? [];
                const isToday = date.toDateString() === today.toDateString();

                return (
                  <div
                    key={idx}
                    className={`border-r border-b border-[#dadce0] p-1.5 flex flex-col gap-0.5 min-h-[100px]
                      ${!isCurrentMonth ? "bg-[#fafafa]" : "bg-white"}
                      ${idx % 7 === 6 ? "border-r-0" : ""}
                    `}
                  >
                    {/* Date number */}
                    <div className="flex justify-center mb-0.5">
                      <span
                        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                          ${isToday ? "bg-[#1a73e8] text-white" : isCurrentMonth ? "text-[#3c4043]" : "text-[#b0b5ba]"}
                        `}
                      >
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev, evIdx) => (
                        <EventPill key={`${dateKey}-${ev.id}-${evIdx}`} event={ev} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-[#70757a] px-1">
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
      </div>
    </div>
  );
}