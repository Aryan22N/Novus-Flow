"use client"
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
    RefreshCw
} from "lucide-react";
import AppSidebar from "~/components/layout/app-sidebar";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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
        <div className="flex flex-col h-screen bg-white font-sans overflow-hidden">
            <header className="h-16 border-b border-[#dadce0] flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center ">
                    <button
                        className="pl-2 hover:bg-[#f1f3f4] rounded-full transition-colors"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <svg className="w-6 h-6 text-[#3c4043]" focusable="false" viewBox="0 0 24 24">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
                        </svg>
                    </button>
                    <Link href="/inbox">
                        <img
                            src="/Nexus_Flow_logo.png"
                            alt="Logo"
                            className="w-32 h-auto  object-contain select-none"
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
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <AppSidebar isOpen={isSidebarOpen} />
                
                <main className="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-6 bg-surface">

                {/* Header Section */}
                <section className="col-span-12 flex justify-between items-end mb-4">
                    <div>
                        <h1 className="font-display-lg text-display-lg text-on-surface">
                            Meetings
                        </h1>
                        <p className="text-on-surface-variant text-body-md">
                            Manage your intelligent schedule and AI-summarized insights.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-outline rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors">
                            <Filter size={20} />
                            Filter
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <Video size={20} />
                            Instant Meeting
                        </button>
                    </div>
                </section>

                {/* Upcoming Central Column */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

                    {/* Primary Action Item */}
                    <div
                        className={`ai-glass rounded-xl p-6 border-l-4 border-primary relative overflow-hidden transition-all duration-700 ease-out ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            }`}
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Zap size={120} />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <span className="inline-block px-2 py-0.5 bg-primary-fixed text-on-primary-fixed-variant rounded text-label-caps mb-2 uppercase text-xs font-bold bg-primary/10 text-primary">
                                    Next Priority
                                </span>
                                <h2 className="font-headline-md text-headline-md text-on-surface mb-1 text-2xl font-semibold">
                                    Project Kickoff: AI Integration for Gmail
                                </h2>
                                <div className="flex items-center gap-4 text-on-surface-variant text-body-md mt-2">
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={16} /> 10:00 AM - 11:30 AM (In 45 min)
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={16} /> Google Meet
                                    </span>
                                </div>
                            </div>
                            <button className="bg-primary text-white px-8 py-3 rounded-full font-title-sm hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 font-medium">
                                Join Meeting
                            </button>
                        </div>
                        <div className="mt-6 flex items-center gap-4 relative z-10">
                            <div className="flex -space-x-2">
                                <img
                                    alt="Sarah Chen"
                                    className="w-8 h-8 rounded-full border-2 border-surface object-cover bg-gray-200"
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                                />
                                <img
                                    alt="James Wilson"
                                    className="w-8 h-8 rounded-full border-2 border-surface object-cover bg-gray-200"
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=James"
                                />
                                <img
                                    alt="Nexus AI"
                                    className="w-8 h-8 rounded-full border-2 border-surface object-cover bg-gray-200"
                                    src="https://api.dicebear.com/7.x/bottts/svg?seed=Nexus"
                                />
                                <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container-high flex items-center justify-center text-[10px] font-bold bg-gray-100">
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
                        <h3 className="font-title-sm text-title-sm text-on-surface mb-4 font-semibold text-lg">
                            Today
                        </h3>
                        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden bg-white shadow-sm">

                            {/* Meeting Row 1 */}
                            <div className="meeting-row flex items-center justify-between p-4 border-b border-outline-variant hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[60px]">
                                        <div className="text-body-sm font-bold text-on-surface">
                                            1:30 PM
                                        </div>
                                        <div className="text-[10px] text-on-surface-variant uppercase">
                                            30m
                                        </div>
                                    </div>
                                    <div className="w-1 h-8 rounded-full bg-blue-500"></div>
                                    <div>
                                        <h4 className="font-title-sm text-on-surface font-medium">
                                            Weekly Sync: Design System
                                        </h4>
                                        <p className="text-body-sm text-on-surface-variant text-sm text-gray-500">
                                            Organizer: Marc Esposito
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 quick-actions opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-on-surface-variant hover:bg-gray-200 rounded-full transition-colors">
                                        <Pencil size={16} />
                                    </button>
                                    <button className="px-4 py-1.5 border border-primary text-primary rounded-full text-body-sm font-bold hover:bg-primary/5 transition-colors">
                                        Join
                                    </button>
                                </div>
                            </div>

                            {/* Meeting Row 2 */}
                            <div className="meeting-row flex items-center justify-between p-4 border-b border-outline-variant hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[60px]">
                                        <div className="text-body-sm font-bold text-on-surface">
                                            3:00 PM
                                        </div>
                                        <div className="text-[10px] text-on-surface-variant uppercase">
                                            1h
                                        </div>
                                    </div>
                                    <div className="w-1 h-8 rounded-full bg-purple-500"></div>
                                    <div>
                                        <h4 className="font-title-sm text-on-surface font-medium">
                                            Client Review: Cloud Migration
                                        </h4>
                                        <p className="text-body-sm text-on-surface-variant text-sm text-gray-500">
                                            Attendees: TechTeam A, Cloud Partners
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 quick-actions opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-on-surface-variant hover:bg-gray-200 rounded-full transition-colors">
                                        <Pencil size={16} />
                                    </button>
                                    <button className="px-4 py-1.5 border border-primary text-primary rounded-full text-body-sm font-bold hover:bg-primary/5 transition-colors">
                                        Join
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Later This Week */}
                    <section>
                        <h3 className="font-title-sm text-title-sm text-on-surface mb-4 font-semibold text-lg">
                            Tomorrow & Later
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Card 1 */}
                            <div className="p-4 bg-white rounded-xl border border-outline-variant hover:border-gray-400 transition-all cursor-pointer shadow-sm">
                                <div className="flex justify-between mb-3">
                                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded tracking-wide">
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
                                        <div className="w-6 h-6 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[8px] font-bold text-blue-800">
                                            JD
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-purple-100 border border-white flex items-center justify-center text-[8px] font-bold text-purple-800">
                                            MK
                                        </div>
                                    </div>
                                    <Video size={16} className="text-gray-500" />
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="p-4 bg-white rounded-xl border border-outline-variant hover:border-gray-400 transition-all cursor-pointer shadow-sm">
                                <div className="flex justify-between mb-3">
                                    <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded tracking-wide">
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
                                        <div className="w-6 h-6 rounded-full bg-red-100 border border-white flex items-center justify-center text-[8px] font-bold text-red-800">
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
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                    {/* Recent Summaries Section */}
                    <section className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-primary" />
                                <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                                    Meeting Insights
                                </h3>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">

                            {/* Time Spent Card */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-outline-variant">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-body-sm font-bold text-on-surface-variant text-sm">
                                        Time Spent in Meetings
                                    </span>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                                        -12% vs LW
                                    </span>
                                </div>
                                <div className="flex items-end gap-2 h-12">
                                    <div className="flex-1 bg-primary/20 rounded-t h-full"></div>
                                    <div className="flex-1 bg-primary/20 rounded-t h-3/4"></div>
                                    <div className="flex-1 bg-primary/20 rounded-t h-5/6"></div>
                                    <div className="flex-1 bg-primary rounded-t h-1/2"></div>
                                </div>
                                <p className="text-xs text-on-surface-variant mt-2 text-gray-500">
                                    14.5 hours total this week
                                </p>
                            </div>

                            {/* Focus Score Card */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-outline-variant">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-body-sm font-bold text-on-surface-variant block mb-1 text-sm">
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
                                    <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
                                        <ArrowUp size={20} className="text-primary" />
                                    </div>
                                </div>
                                <p className="text-xs text-on-surface-variant mt-2 text-gray-500">
                                    +5 points from previous period
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* AI Assistant Integrated Rail */}
                    <section className="flex-1 min-h-[400px] bg-white rounded-2xl p-5 flex flex-col shadow-sm border border-outline-variant">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Sparkles size={20} />
                            <h3 className="font-title-sm text-title-sm font-semibold">
                                Meeting Assistant
                            </h3>
                        </div>

                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto mb-4 pr-2">

                            {/* AI Message */}
                            <div className="flex flex-col gap-1">
                                <div className="bg-primary/10 text-on-surface p-3 rounded-2xl rounded-tl-none border border-primary/10 text-body-sm leading-relaxed text-sm">
                                    Good morning! You have a busy day today. Your first meeting,
                                    "Project Kickoff", starts in 45 minutes. Would you like me to
                                    pull up the previous meeting notes or the project brief for
                                    you?
                                </div>
                                <span className="text-[10px] text-gray-500 ml-1 uppercase font-bold tracking-wider">
                                    Nexus AI
                                </span>
                            </div>

                            {/* User Message */}
                            <div className="flex flex-col items-end gap-1 mt-2">
                                <div className="bg-gray-100 text-on-surface p-3 rounded-2xl rounded-tr-none text-body-sm border border-outline-variant text-sm">
                                    Yes, show me the brief and check if everyone has RSVP'd.
                                </div>
                            </div>

                            {/* AI Action Item */}
                            <div className="bg-white p-3 rounded-xl border border-primary/30 flex flex-col gap-2 mt-2 shadow-sm">
                                <div className="flex items-center gap-2 text-primary">
                                    <FileText size={16} />
                                    <span className="font-bold text-body-sm text-sm">
                                        Brief Loaded
                                    </span>
                                </div>
                                <p className="text-[12px] text-gray-600 italic">
                                    "Phase 1: Integration with Gmail API & OAuth implementation..."
                                </p>
                                <div className="mt-2 py-1 px-2 bg-red-50 text-red-700 border border-red-100 text-[10px] rounded inline-flex items-center gap-1.5 w-fit font-medium">
                                    <AlertTriangle size={12} />
                                    2 invitees still pending RSVP
                                </div>
                            </div>
                        </div>

                        {/* AI Input Bar */}
                        <div className="mt-auto relative">
                            <input
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 text-body-md transition-all text-sm"
                                placeholder="Ask Nexus about your schedule..."
                                type="text"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                <Send size={18} />
                            </button>
                        </div>
                    </section>
                </div>
            </main>
            </div>

            {/* Quick Action FAB */}
            <div className="fixed bottom-8 right-8 z-50">
                <button className="w-14 h-14 bg-primary text-white rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center">
                    <Plus size={28} />
                </button>
            </div>
        </div>
    );
}