import {
  Inbox,
  Tag,
  Calendar,
  Users,
  Bell,
} from "lucide-react";

import { api } from "~/trpc/react";

interface InboxFiltersProps {
  category: string;
  onCategoryChange: (category: string) => void;
}

export default function InboxFilters({ category, onCategoryChange }: InboxFiltersProps) {
  const { data: unreadCounts } = api.email.getUnreadCounts.useQuery();

  const getButtonClass = (isActive: boolean) =>
    `flex items-center gap-2 px-4 py-1.5 text-[16px] font-medium transition-colors hover:bg-surface-container-high rounded-md border-b-3 ${isActive ? "text-[#2656C9] border-[#2656C9]" : "text-on-surface-variant border-transparent"
    }`;

  const renderBadge = (count: number | undefined, bgColor: string) => {
    if (!count) return null;
    return (
      <span
        className={`ml-1 flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${bgColor}`}
      >
        {count} new
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-4">
        <button
          onClick={() => onCategoryChange("primary")}
          className={getButtonClass(category === "primary")}
        >
          <Inbox size={18} />
          Primary
          {renderBadge(unreadCounts?.primary, "bg-[#2656C9]")}
        </button>

        <button
          onClick={() => onCategoryChange("promotions")}
          className={getButtonClass(category === "promotions")}
        >
          <Tag size={18} />
          Promotions
          {renderBadge(unreadCounts?.promotions, "bg-[#3C7E40]")}
        </button>

        {/* <button 
          onClick={() => onCategoryChange("meetings")}
          className={getButtonClass(category === "meetings")}
        >
          <Calendar size={18} />
          Meetings
          {renderBadge(unreadCounts?.meetings, "bg-[#E37400]")}
        </button> */}

        <button
          onClick={() => onCategoryChange("socials")}
          className={getButtonClass(category === "socials")}
        >
          <Users size={18} />
          Socials
          {renderBadge(unreadCounts?.socials, "bg-[#3871E0]")}
        </button>

        <button
          onClick={() => onCategoryChange("updates")}
          className={getButtonClass(category === "updates")}
        >
          <Bell size={18} />
          Updates
          {renderBadge(unreadCounts?.updates, "bg-[#E37400]")}
        </button>
      </div>
    </div>
  );
}