"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Filter,
  Video,
  Zap,
  Clock,
  MapPin,
  Pencil,
  MoreVertical,
  Users,
  TrendingUp,
  ArrowUp,
  Sparkles,
  FileText,
  AlertTriangle,
  Send,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import AppSidebar from "~/components/layout/app-sidebar";

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

export default function MeetingsDashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Dummy state so header code works
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2026);
  const isBusy = false;
  const goToday = () => {};
  const prevMonth = () => {};
  const nextMonth = () => {};
  const syncMutation = { mutate: (args: any) => {} };

  // Replaces the inline script for the entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-sans">
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

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar isOpen={isSidebarOpen} />

        <main className="bg-surface grid flex-1 grid-cols-12 gap-6 overflow-y-auto p-8">
          {/* Header Section */}
          <section className="col-span-12 mb-4 flex items-end justify-between">
            <div>
              <h1 className="font-display-lg text-display-lg text-on-surface">
                Meetings
              </h1>
              <p className="text-on-surface-variant text-body-md">
                Manage your intelligent schedule and AI-summarized insights.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="border-outline hover:bg-surface-container flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors">
                <Filter size={20} />
                Filter
              </button>
              <button className="bg-primary flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-opacity hover:opacity-90">
                <Video size={20} />
                Instant Meeting
              </button>
            </div>
          </section>

          {/* Upcoming Central Column */}
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
            {/* Primary Action Item */}
            <div
              className={`ai-glass border-primary relative overflow-hidden rounded-xl border-l-4 p-6 transition-all duration-700 ease-out ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Zap size={120} />
              </div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="bg-primary-fixed text-on-primary-fixed-variant text-label-caps bg-primary/10 text-primary mb-2 inline-block rounded px-2 py-0.5 text-xs font-bold uppercase">
                    Next Priority
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-1 text-2xl font-semibold">
                    Project Kickoff: AI Integration for Gmail
                  </h2>
                  <div className="text-on-surface-variant text-body-md mt-2 flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Clock size={16} /> 10:00 AM - 11:30 AM (In 45 min)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} /> Google Meet
                    </span>
                  </div>
                </div>
                <button className="bg-primary font-title-sm transform rounded-full px-8 py-3 font-medium text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95">
                  Join Meeting
                </button>
              </div>
              <div className="relative z-10 mt-6 flex items-center gap-4">
                <div className="flex -space-x-2">
                  <img
                    alt="Sarah Chen"
                    className="border-surface h-8 w-8 rounded-full border-2 bg-gray-200 object-cover"
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                  />
                  <img
                    alt="James Wilson"
                    className="border-surface h-8 w-8 rounded-full border-2 bg-gray-200 object-cover"
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=James"
                  />
                  <img
                    alt="Nexus AI"
                    className="border-surface h-8 w-8 rounded-full border-2 bg-gray-200 object-cover"
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=Nexus"
                  />
                  <div className="border-surface bg-surface-container-high flex h-8 w-8 items-center justify-center rounded-full border-2 bg-gray-100 text-[10px] font-bold">
                    +8
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant text-sm">
                  Nexus AI will record and summarize this call.
                </p>
              </div>
            </div>

            {/* Today's Schedule */}
            <section>
              <h3 className="font-title-sm text-title-sm text-on-surface mb-4 text-lg font-semibold">
                Today
              </h3>
              <div className="bg-surface-container-lowest border-outline-variant overflow-hidden rounded-xl border bg-white shadow-sm">
                {/* Meeting Row 1 */}
                <div className="meeting-row border-outline-variant group flex items-center justify-between border-b p-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="min-w-[60px] text-center">
                      <div className="text-body-sm text-on-surface font-bold">
                        1:30 PM
                      </div>
                      <div className="text-on-surface-variant text-[10px] uppercase">
                        30m
                      </div>
                    </div>
                    <div className="h-8 w-1 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="font-title-sm text-on-surface font-medium">
                        Weekly Sync: Design System
                      </h4>
                      <p className="text-body-sm text-on-surface-variant text-sm text-gray-500">
                        Organizer: Marc Esposito
                      </p>
                    </div>
                  </div>
                  <div className="quick-actions flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="text-on-surface-variant rounded-full p-2 transition-colors hover:bg-gray-200">
                      <Pencil size={16} />
                    </button>
                    <button className="border-primary text-primary text-body-sm hover:bg-primary/5 rounded-full border px-4 py-1.5 font-bold transition-colors">
                      Join
                    </button>
                  </div>
                </div>

                {/* Meeting Row 2 */}
                <div className="meeting-row border-outline-variant group flex items-center justify-between border-b p-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="min-w-[60px] text-center">
                      <div className="text-body-sm text-on-surface font-bold">
                        3:00 PM
                      </div>
                      <div className="text-on-surface-variant text-[10px] uppercase">
                        1h
                      </div>
                    </div>
                    <div className="h-8 w-1 rounded-full bg-purple-500"></div>
                    <div>
                      <h4 className="font-title-sm text-on-surface font-medium">
                        Client Review: Cloud Migration
                      </h4>
                      <p className="text-body-sm text-on-surface-variant text-sm text-gray-500">
                        Attendees: TechTeam A, Cloud Partners
                      </p>
                    </div>
                  </div>
                  <div className="quick-actions flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="text-on-surface-variant rounded-full p-2 transition-colors hover:bg-gray-200">
                      <Pencil size={16} />
                    </button>
                    <button className="border-primary text-primary text-body-sm hover:bg-primary/5 rounded-full border px-4 py-1.5 font-bold transition-colors">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Later This Week */}
            <section>
              <h3 className="font-title-sm text-title-sm text-on-surface mb-4 text-lg font-semibold">
                Tomorrow & Later
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Card 1 */}
                <div className="border-outline-variant cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-gray-400">
                  <div className="mb-3 flex justify-between">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-800">
                      TOMORROW
                    </span>
                    <MoreVertical size={16} className="text-gray-500" />
                  </div>
                  <h4 className="font-title-sm text-on-surface mb-1 font-medium">
                    Product Strategy 2027
                  </h4>
                  <p className="text-body-sm text-on-surface-variant mb-4 text-sm text-gray-500">
                    9:00 AM • 2h
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-blue-100 text-[8px] font-bold text-blue-800">
                        JD
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-purple-100 text-[8px] font-bold text-purple-800">
                        MK
                      </div>
                    </div>
                    <Video size={16} className="text-gray-500" />
                  </div>
                </div>

                {/* Card 2 */}
                <div className="border-outline-variant cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-gray-400">
                  <div className="mb-3 flex justify-between">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-gray-700">
                      FRI, JUN 19
                    </span>
                    <MoreVertical size={16} className="text-gray-500" />
                  </div>
                  <h4 className="font-title-sm text-on-surface mb-1 font-medium">
                    Monthly All Hands
                  </h4>
                  <p className="text-body-sm text-on-surface-variant mb-4 text-sm text-gray-500">
                    4:00 PM • 1h
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-red-100 text-[8px] font-bold text-red-800">
                        HR
                      </div>
                    </div>
                    <Users size={16} className="text-gray-500" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Recent Summaries & AI Sidebar Right */}
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
            {/* Recent Summaries Section */}
            <section className="border-outline-variant rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary" />
                  <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                    Meeting Insights
                  </h3>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {/* Time Spent Card */}
                <div className="border-outline-variant rounded-xl border bg-gray-50 p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-body-sm text-on-surface-variant text-sm font-bold">
                      Time Spent in Meetings
                    </span>
                    <span className="text-primary bg-primary/10 rounded px-2 py-0.5 text-[10px] font-bold uppercase">
                      -12% vs LW
                    </span>
                  </div>
                  <div className="flex h-12 items-end gap-2">
                    <div className="bg-primary/20 h-full flex-1 rounded-t"></div>
                    <div className="bg-primary/20 h-3/4 flex-1 rounded-t"></div>
                    <div className="bg-primary/20 h-5/6 flex-1 rounded-t"></div>
                    <div className="bg-primary h-1/2 flex-1 rounded-t"></div>
                  </div>
                  <p className="text-on-surface-variant mt-2 text-xs text-gray-500">
                    14.5 hours total this week
                  </p>
                </div>

                {/* Focus Score Card */}
                <div className="border-outline-variant rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-body-sm text-on-surface-variant mb-1 block text-sm font-bold">
                        Focus Score
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-display-lg font-display-lg text-on-surface text-3xl font-bold">
                          85
                        </span>
                        <span className="text-body-sm text-on-surface-variant text-sm">
                          /100
                        </span>
                      </div>
                    </div>
                    <div className="border-primary/20 border-t-primary flex h-14 w-14 items-center justify-center rounded-full border-4">
                      <ArrowUp size={20} className="text-primary" />
                    </div>
                  </div>
                  <p className="text-on-surface-variant mt-2 text-xs text-gray-500">
                    +5 points from previous period
                  </p>
                </div>
              </div>
            </section>

            {/* AI Assistant Integrated Rail */}
            <section className="border-outline-variant flex min-h-[400px] flex-1 flex-col rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-primary mb-6 flex items-center gap-2">
                <Sparkles size={20} />
                <h3 className="font-title-sm text-title-sm font-semibold">
                  Meeting Assistant
                </h3>
              </div>

              <div className="mb-4 flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
                {/* AI Message */}
                <div className="flex flex-col gap-1">
                  <div className="bg-primary/10 text-on-surface border-primary/10 text-body-sm rounded-2xl rounded-tl-none border p-3 text-sm leading-relaxed">
                    Good morning! You have a busy day today. Your first meeting,
                    "Project Kickoff", starts in 45 minutes. Would you like me
                    to pull up the previous meeting notes or the project brief
                    for you?
                  </div>
                  <span className="ml-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    Nexus AI
                  </span>
                </div>

                {/* User Message */}
                <div className="mt-2 flex flex-col items-end gap-1">
                  <div className="text-on-surface text-body-sm border-outline-variant rounded-2xl rounded-tr-none border bg-gray-100 p-3 text-sm">
                    Yes, show me the brief and check if everyone has RSVP'd.
                  </div>
                </div>

                {/* AI Action Item */}
                <div className="border-primary/30 mt-2 flex flex-col gap-2 rounded-xl border bg-white p-3 shadow-sm">
                  <div className="text-primary flex items-center gap-2">
                    <FileText size={16} />
                    <span className="text-body-sm text-sm font-bold">
                      Brief Loaded
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-600 italic">
                    "Phase 1: Integration with Gmail API & OAuth
                    implementation..."
                  </p>
                  <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700">
                    <AlertTriangle size={12} />2 invitees still pending RSVP
                  </div>
                </div>
              </div>

              {/* AI Input Bar */}
              <div className="relative mt-auto">
                <input
                  className="focus:ring-primary/50 text-body-md w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-12 pl-4 text-sm transition-all focus:ring-2 focus:outline-none"
                  placeholder="Ask Nexus about your schedule..."
                  type="text"
                />
                <button className="text-primary hover:bg-primary/10 absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 transition-colors">
                  <Send size={18} />
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Quick Action FAB */}
      <div className="fixed right-8 bottom-8 z-50">
        <button className="bg-primary flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
