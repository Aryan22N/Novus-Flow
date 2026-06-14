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
        "group relative grid cursor-pointer grid-cols-[40px_40px_250px_1fr_100px] items-center border-b border-gray-200 px-4 py-3 hover:z-10 hover:border-1 hover:shadow-lg",
        "transition-all duration-300 ease-in-out",
        selected ? "bg-[#C7DAFC]" : (unread ? "bg-white" : "bg-[#F3F6FB]"),
        unread ? "font-semibold" : "font-normal",
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
            className="appearance-none h-full w-full cursor-pointer rounded border border-gray-300 bg-white checked:bg-[#C7DAFC] checked:border-gray-800  focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1"
          />

          {/* The custom tick mark */}
          {!!selected && (
            <svg
              className="absolute pointer-events-none w-3.5 h-3.5 text-gray-800"
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
        className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-gray-100"
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
      <div className="truncate text-gray-900">{sender}</div>

      {/* Subject + Snippet */}
      <div className="truncate">
        <span className={clsx(unread && "font-semibold")}>{subject}</span>
        <span className="mx-1 text-gray-400">-</span>
        <span className="text-gray-500">{snippet}</span>
      </div>

      {/* Date */}
      <div className="text-right text-sm text-gray-700">{date}</div>
    </div>
  );
}
