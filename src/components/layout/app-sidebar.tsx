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
    <nav className={`bg-white border-r flex flex-col py-4 h-screen transition-all duration-300 overflow-hidden ${
      isOpen ? "w-[250px] opacity-100" : "w-0 border-r-0 opacity-0 px-0"
    }`}>
      {/* Compose Button */}
      <div className="px-4 mb-4 min-w-[250px]">
        <button className="w-full h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium">
          <Pencil size={18} />
          Compose
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-1 pr-2 min-w-[250px]">
        <Link
          href="/app/inbox"
          className="flex items-center gap-4 px-6 py-3 bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 rounded-r-full"
        >
          <Inbox size={18} />
          <span className="flex-1">Inbox</span>
          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
            42
          </span>
        </Link>

        <Link
          href="/app/priority"
          className="flex items-center gap-4 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-r-full transition"
        >
          <Flag size={18} />
          <span>Priority</span>
        </Link>

        <Link
          href="/app/calendar"
          className="flex items-center gap-4 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-r-full transition"
        >
          <Calendar size={18} />
          <span>Calendar</span>
        </Link>

        <Link
          href="/app/drafts"
          className="flex items-center gap-4 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-r-full transition"
        >
          <FileText size={18} />
          <span className="flex-1">Drafts</span>
          <span className="text-xs">3</span>
        </Link>

        <Link
          href="/app/sent"
          className="flex items-center gap-4 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-r-full transition"
        >
          <Send size={18} />
          <span>Sent</span>
        </Link>

        <Link
          href="/app/scheduled"
          className="flex items-center gap-4 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-r-full transition"
        >
          <Clock3 size={18} />
          <span>Scheduled</span>
        </Link>

        <Link
          href="/app/starred"
          className="flex items-center gap-4 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-r-full transition"
        >
          <Star size={18} />
          <span>Starred</span>
        </Link>
      </div>


    </nav>
  );
}