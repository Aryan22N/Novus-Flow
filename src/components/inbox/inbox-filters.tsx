import {
  Inbox,
  Tag,
  Calendar,
  Users,
  Bell,
} from "lucide-react";

export default function InboxFilters() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-4">
        <button className="flex items-center gap-2 px-4 py-1.5 text-[16px] font-medium hover:bg-surface-container-high text-[#2656C9] border-b-3 border-[#2656C9] transition-colors">
          <Inbox size={18} />
          Primary
        </button>

        <button className="flex items-center gap-2 px-4 py-1.5 text-[16px] font-medium hover:bg-surface-container-high text-on-surface-variant transition-colors">
          <Tag size={18} />
          Promotions
        </button>

        <button className="flex items-center gap-2 px-4 py-1.5 text-[16px] font-medium hover:bg-surface-container-high text-on-surface-variant transition-colors">
          <Calendar size={18} />
          Meetings
        </button>

        <button className="flex items-center gap-2 px-4 py-1.5 text-[16px] font-medium hover:bg-surface-container-high text-on-surface-variant transition-colors">
          <Users size={18} />
          Socials
        </button>

        <button className="flex items-center gap-2 px-4 py-1.5 text-[16px] font-medium hover:bg-surface-container-high text-on-surface-variant transition-colors">
          <Bell size={18} />
          Updates
        </button>
      </div>
    </div>
  );
}