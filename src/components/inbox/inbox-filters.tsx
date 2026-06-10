import { RefreshCw, MoreVertical } from "lucide-react";

export default function InboxFilters() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <button className="px-4 py-1.5 rounded-full text-body-sm font-semibold bg-secondary-container text-on-secondary-container">All</button>
        <button className="px-4 py-1.5 rounded-full text-body-sm font-medium bg-transparent hover:bg-surface-container-high text-on-surface-variant transition-colors">Action Required</button>
        <button className="px-4 py-1.5 rounded-full text-body-sm font-medium bg-transparent hover:bg-surface-container-high text-on-surface-variant transition-colors">Meetings</button>
        <button className="px-4 py-1.5 rounded-full text-body-sm font-medium bg-transparent hover:bg-surface-container-high text-on-surface-variant transition-colors">Waiting</button>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors">
          <RefreshCw size={18} />
        </button>

        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}
