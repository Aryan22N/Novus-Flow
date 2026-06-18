import { Inbox, Tag, Calendar, Users, Bell } from "lucide-react";

import { api } from "~/trpc/react";

interface InboxFiltersProps {
  category: string;
  onCategoryChange: (category: string) => void;
}

export default function InboxFilters({
  category,
  onCategoryChange,
}: InboxFiltersProps) {
  const { data: unreadCounts } = api.email.getUnreadCounts.useQuery();

  const getButtonClass = (isActive: boolean) =>
    `flex items-center gap-2 px-4 pt-2 pb-1.5 text-[15px] font-medium transition-all duration-200 ease-in-out hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-t-lg border-b-[3px] ${isActive
      ? "text-[#2656C9] dark:text-blue-400 border-[#2656C9] dark:border-blue-400 bg-slate-50/50 dark:bg-slate-800/20"
      : "text-slate-600 dark:text-slate-400 border-transparent"
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
