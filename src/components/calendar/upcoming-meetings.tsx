import {
  CalendarDays,
  Clock3,
  Users,
  Video,
  ArrowRight,
} from "lucide-react";

export default function UpcomingMeetings() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-col h-[52%]">
      <h3 className="text-title-sm font-title-sm text-on-surface mb-4 flex items-center gap-2 shrink-0">
        <CalendarDays size={18} className="text-secondary" />
        Upcoming Meetings
      </h3>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {/* Meeting 1 */}
        <div className="border-l-4 border-primary bg-surface-container-low p-3 rounded-r-lg">
          <div className="flex justify-between items-start mb-1">
            <span className="text-body-md font-bold text-on-surface">
              Product Sync
            </span>

            <div className="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <Clock3 size={14} />
              <span>11:00 AM</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-body-sm text-on-surface-variant mb-2">
            <Users size={14} />
            <span>Design, Eng, PM</span>
          </div>

          <button className="bg-primary text-white text-body-sm px-3 py-1.5 rounded hover:bg-primary-container transition-colors w-full font-semibold flex items-center justify-center gap-2">
            Join Meeting
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Meeting 2 */}
        <div className="border-l-4 border-tertiary-container bg-surface-container-low p-3 rounded-r-lg">
          <div className="flex justify-between items-start mb-1">
            <span className="text-body-md font-bold text-on-surface">
              1:1 with Sarah
            </span>

            <div className="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <Clock3 size={14} />
              <span>2:30 PM</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-body-sm text-on-surface-variant">
            <Video size={14} />
            <span>Google Meet</span>
          </div>
        </div>
      </div>
    </div>
  );
}