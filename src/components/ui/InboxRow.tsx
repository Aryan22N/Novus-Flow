import { Star, Square } from "lucide-react";
import clsx from "clsx";

interface InboxRowProps {
    sender: string;
    subject: string;
    snippet: string;
    date: string;
    unread?: boolean;
    isStarred?: boolean;
    onToggleStar?: (e: React.MouseEvent) => void;
}

export default function InboxRow({
    sender,
    subject,
    snippet,
    date,
    unread,
    isStarred,
    onToggleStar,
}: InboxRowProps) {
    return (
        <div
            className={clsx(
                "group relative grid grid-cols-[40px_40px_250px_1fr_100px] items-center border-b border-gray-200 px-4 py-3 hover:shadow-lg hover:border-1 hover:z-10 cursor-pointer",
                "transition-all duration-300 ease-in-out",
                unread ? "bg-white font-semibold" : "bg-[#F3F6FB] font-normal"
            )}
            style={{
                fontFamily: '"Google Sans", Roboto, RobotoDraft, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontStyle: 'normal',
                lineHeight: '20px',
            }}
        >
            {/* Checkbox */}
            <div>
                <Square size={18} className="text-gray-400 hover:text-gray-600" />
            </div>

            {/* Star */}
            <div 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleStar?.(e); }}
                className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
                <Star 
                    size={18} 
                    className={clsx(
                        "transition-colors",
                        isStarred ? "text-yellow-400 fill-yellow-400" : "text-gray-400 hover:text-gray-600"
                    )} 
                />
            </div>

            {/* Sender */}
            <div className="truncate text-gray-900">
                {sender}
            </div>

            {/* Subject + Snippet */}
            <div className="truncate">
                <span className={clsx(unread && "font-semibold")}>
                    {subject}
                </span>
                <span className="mx-1 text-gray-400">-</span>
                <span className="text-gray-500">{snippet}</span>
            </div>

            {/* Date */}
            <div className="text-right text-sm text-gray-700">
                {date}
            </div>
        </div>
    );
}