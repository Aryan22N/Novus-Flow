"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import {
  Inbox,
  Calendar,
  FileText,
  Send,
  Clock3,
  Star,
  Pencil,
} from "lucide-react";
import ComposeModal from "~/components/compose/compose-modal";

export default function AppSidebar({ isOpen = true }: { isOpen?: boolean }) {
  const pathname = usePathname();
  const { data } = api.email.getUnreadCount.useQuery();
  const unreadCount = data?.count ?? 0;
  const [showCompose, setShowCompose] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isOpen || isHovered;

  const getLinkClass = (href: string) => {
    const isActive = pathname === href;
    const bgClass = isActive ? "bg-[#d4e0fa] font-semibold" : "hover:bg-[#DFDFE3]";
    const layoutClass = isExpanded ? "px-6 py-3 rounded-r-full" : "justify-center w-12 h-12 rounded-full";
    return `flex items-center gap-4 text-black transition-all duration-300 ${bgClass} ${layoutClass}`;
  };

  return (
    <>
      <div className={`relative shrink-0 transition-all duration-300 h-screen ${isOpen ? "w-[250px]" : "w-[72px]"}`}>
        <nav
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`absolute top-0 left-0 bg-[#f7f9fc] flex flex-col py-4 h-screen transition-all duration-300 text-[14px] overflow-hidden ${isExpanded ? "w-[250px]" : "w-[72px]"} ${isHovered && !isOpen ? "shadow-2xl z-50 rounded-r-xl " : "z-10"}`}
        >
          {/* Compose Button */}
          <div className={`mb-4 flex ${isExpanded ? "px-4" : "justify-center px-2"}`}>
            <button
              onClick={() => setShowCompose(true)}
              className={`h-15 bg-[#C9E6FC] text-[#0c2038] flex items-center justify-center gap-2 transition-all duration-300 shadow-sm font-[14px] ${isExpanded ? "w-[160px] rounded-lg" : "w-12 rounded-2xl"}`}
            >
              <Pencil size={18} className="shrink-0" />
              {isExpanded && <span>Compose</span>}
            </button>
          </div>

          {/* Navigation */}
          <div className={`flex-1 flex flex-col gap-1 transition-all duration-300 ${isExpanded ? "pr-2" : "px-2 items-center"}`}>
            <Link
              href="/inbox"
              className={getLinkClass("/inbox")}
            >
              <Inbox size={18} className="shrink-0" />
              {isExpanded && (
                <>
                  <span className="flex-1">Inbox</span>
                  {unreadCount > 0 && (
                    <span className="bg-[#d4e0fa] text-black font-normal text-[14px] px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </Link>

            <Link
              href="/Calendar"
              className={getLinkClass("/Calendar")}
            >
              <Calendar size={18} className="shrink-0" />
              {isExpanded && <span>Calendar</span>}
            </Link>

            <Link
              href="/app/drafts"
              className={getLinkClass("/app/drafts")}
            >
              <FileText size={18} className="shrink-0" />
              {isExpanded && (
                <>
                  <span className="flex-1">Drafts</span>
                  <span className="text-[14px]">3</span>
                </>
              )}
            </Link>

            <Link
              href="/sent"
              className={getLinkClass("/sent")}
            >
              <Send size={18} className="shrink-0" />
              {isExpanded && <span>Sent</span>}
            </Link>

            <Link
              href="/schedule"
              className={getLinkClass("/schedule")}
            >
              <Clock3 size={18} className="shrink-0" />
              {isExpanded && <span>Scheduled</span>}
            </Link>

            <Link
              href="/starred"
              className={getLinkClass("/starred")}
            >
              <Star size={18} className="shrink-0" />
              {isExpanded && <span>Starred</span>}
            </Link>
          </div>
        </nav>
      </div>

      {/* Compose Modal — rendered outside the nav so it overlays everything */}
      {showCompose && (
        <ComposeModal onClose={() => setShowCompose(false)} />
      )}
    </>
  );
}