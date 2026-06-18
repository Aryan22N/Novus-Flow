import { Star } from "lucide-react";
import clsx from "clsx";

interface InboxRowProps {
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  unread?: boolean;
  isStarred?: boolean;
  onToggleStar?: (e: React.MouseEvent) => void;
  selected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
}

export default function InboxRow({
  sender,
  subject,
  snippet,
  date,
  unread,
  isStarred,
  onToggleStar,
  selected,
  onToggleSelect,
}: InboxRowProps) {
  return (
    <div
      className={clsx(
        "group relative grid cursor-pointer grid-cols-[40px_40px_250px_1fr_100px] items-center border-b border-gray-200 dark:border-slate-800/60 px-4 py-3 hover:z-10 hover:border-1 hover:shadow-lg dark:hover:shadow-black/40",
        "transition-all duration-300 ease-in-out",
        selected ? "bg-[#C7DAFC] dark:bg-blue-900/30" : (unread ? "bg-white dark:bg-slate-900" : "bg-[#F3F6FB] dark:bg-[#0a0f1c]"),
        unread ? "font-semibold text-gray-900 dark:text-white" : "font-normal text-gray-800 dark:text-slate-300",
      )}
      style={{
        fontFamily:
          '"Google Sans", Roboto, RobotoDraft, Helvetica, Arial, sans-serif',
        fontSize: "14px",
        fontStyle: "normal",
        lineHeight: "20px",
      }}
    >
      {/* Checkbox */}
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect?.(e);
        }}
        className="flex items-center justify-center p-1"
      >
        <div className="relative flex items-center justify-center h-4.5 w-4.5">
          {/* The actual checkbox */}
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => { }}
            className="appearance-none h-full w-full cursor-pointer rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-[#C7DAFC] dark:checked:bg-blue-900/60 checked:border-gray-800 dark:checked:border-slate-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700 focus:ring-offset-1 dark:focus:ring-offset-slate-900 transition-colors"
          />

          {/* The custom tick mark */}
          {!!selected && (
            <svg
              className="absolute pointer-events-none w-3.5 h-3.5 text-gray-800 dark:text-slate-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Star */}
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleStar?.(e);
        }}
        className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
      >
        <Star
          size={18}
          className={clsx(
            "transition-colors",
            isStarred
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-400 hover:text-gray-600",
          )}
        />
      </div>

      {/* Sender */}
      <div className="truncate text-gray-900 dark:text-slate-100">{sender}</div>

      {/* Subject + Snippet */}
      <div className="truncate">
        <span className={clsx(unread && "font-semibold")}>{subject}</span>
        <span className="mx-1 text-gray-400 dark:text-slate-500">-</span>
        <span className="text-gray-500 dark:text-slate-400">{snippet}</span>
      </div>

      {/* Date */}
      <div className="text-right text-sm text-gray-700 dark:text-slate-400">{date}</div>
    </div>
  );
}
