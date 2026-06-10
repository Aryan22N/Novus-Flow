"use client";

import Link from "next/link";
import {
  Inbox,
  Flag,
  Calendar,
  FileText,
  Send,
  Clock3,
  Star,
  Settings,
  HardDrive,
  Pencil,
} from "lucide-react";

export default function AppSidebar({ isOpen = true }: { isOpen?: boolean }) {
  return (
    <nav className={`bg-[#f7f9fc] flex flex-col py-4 h-screen transition-all  duration-300 text-[14px] overflow-hidden shrink-0 ${isOpen ? "w-[250px]" : "w-[72px]"}`}>
      {/* Compose Button */}
      <div className={`mb-4 flex ${isOpen ? "px-4" : "justify-center px-2"}`}>
        <button className={`h-15 bg-[#C9E6FC] text-[#0c2038]  flex items-center justify-center gap-2 transition-all duration-300 shadow-sm font-[14px] ${isOpen ? "w-[160px] rounded-lg" : "w-12 rounded-2xl"}`}>
          <Pencil size={18} className="shrink-0" />
          {isOpen && <span>Compose</span>}
        </button>
      </div>

      {/* Navigation */}
      <div className={`flex-1 flex flex-col gap-1 transition-all duration-300 ${isOpen ? "pr-2" : "px-2 items-center"}`}>
        <Link
          href="/app/inbox"
          className={`flex items-center gap-4 bg-[#d4e0fa] text-black transition-all duration-300 ${isOpen ? "px-6 py-3 rounded-r-full" : "justify-center w-12 h-12 rounded-full"}`}
        >
          <Inbox size={18} className="shrink-0" />
          {isOpen && (
            <>
              <span className="flex-1">Inbox</span>
              <span className="bg-[#d4e0fa] text-black text-[14px] px-2 py-0.5 rounded-full">
                42
              </span>
            </>
          )}
        </Link>

        <Link
          href="/app/calendar"
          className={`flex items-center gap-4 text-black hover:bg-[#DFDFE3] transition-all duration-300 ${isOpen ? "px-6 py-3 rounded-r-full" : "justify-center w-12 h-12 rounded-full"}`}
        >
          <Calendar size={18} className="shrink-0" />
          {isOpen && <span>Calendar</span>}
        </Link>

        <Link
          href="/app/drafts"
          className={`flex items-center gap-4 text-black hover:bg-[#DFDFE3] transition-all duration-300 ${isOpen ? "px-6 py-3 rounded-r-full" : "justify-center w-12 h-12 rounded-full"}`}
        >
          <FileText size={18} className="shrink-0" />
          {isOpen && (
            <>
              <span className="flex-1">Drafts</span>
              <span className="text-[14px]">3</span>
            </>
          )}
        </Link>

        <Link
          href="/app/sent"
          className={`flex items-center gap-4 text-black hover:bg-[#DFDFE3] transition-all duration-300 ${isOpen ? "px-6 py-3 rounded-r-full" : "justify-center w-12 h-12 rounded-full"}`}
        >
          <Send size={18} className="shrink-0" />
          {isOpen && <span>Sent</span>}
        </Link>

        <Link
          href="/app/scheduled"
          className={`flex items-center gap-4 text-black hover:bg-[#DFDFE3] transition-all duration-300 ${isOpen ? "px-6 py-3 rounded-r-full" : "justify-center w-12 h-12 rounded-full"}`}
        >
          <Clock3 size={18} className="shrink-0" />
          {isOpen && <span>Scheduled</span>}
        </Link>

        <Link
          href="/app/starred"
          className={`flex items-center gap-4 text-black hover:bg-[#DFDFE3] transition-all duration-300 ${isOpen ? "px-6 py-3 rounded-r-full" : "justify-center w-12 h-12 rounded-full"}`}
        >
          <Star size={18} className="shrink-0" />
          {isOpen && <span>Starred</span>}
        </Link>
      </div>
    </nav>
  );
}