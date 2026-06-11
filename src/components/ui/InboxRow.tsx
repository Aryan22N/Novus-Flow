import { Star, Square } from "lucide-react";
import clsx from "clsx";

interface InboxRowProps {
    sender: string;
    subject: string;
    snippet: string;
    date: string;
    unread?: boolean;
}

export default function InboxRow({
    sender,
    subject,
    snippet,
    date,
    unread,
}: InboxRowProps) {
    return (
        <div
            className={clsx(
                "grid grid-cols-[40px_40px_250px_1fr_100px] items-center border-b border-gray-200 px-4 py-3 hover:shadow-sm cursor-pointer",
                "transition-all duration-700 ease-in-out",
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
            <div>
                <Star size={18} className="text-gray-400 hover:text-yellow-500" />
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