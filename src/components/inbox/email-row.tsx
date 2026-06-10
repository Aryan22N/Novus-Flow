import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export interface EmailRowProps {
  icon?: ReactNode;
  avatarSrc?: string;
  avatarText?: string;
  avatarColorClass?: string;
  title: string;
  subject: string;
  snippet: string;
  tagLabel: string;
  tagClass: string;
  time: string;
  isAi?: boolean;
}

export default function EmailRow({
  icon,
  avatarSrc,
  avatarText,
  avatarColorClass,
  title,
  subject,
  snippet,
  tagLabel,
  tagClass,
  time,
  isAi = false,
}: EmailRowProps) {
  const containerClasses = `group flex items-center p-3 border-b border-surface-container-highest hover:bg-surface-container-low transition-colors cursor-pointer ${isAi ? "ai-gradient ai-border m-1 rounded-md" : ""
    }`;

  return (
    <div className={containerClasses}>
      <div className="flex items-center  gap-3 w-1/4 min-w-[200px]">
        {avatarSrc ? (
          <img alt={`${title} Avatar`} className="w-8 h-8 rounded-full" src={avatarSrc} />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-body-sm font-bold ${avatarColorClass}`}>
            {avatarText}
          </div>
        )}
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-body-md text-on-surface truncate ${isAi ? "font-bold" : ""}`}>
            {title}
          </span>
        </div>
      </div>
      <div className="flex-1 flex items-center gap-2 pr-4 truncate">
        {isAi && (
          <Sparkles
            size={14}
            className="text-violet-600"
          />
        )}
        <span className={`text-body-md text-on-surface ${isAi ? "font-bold" : ""}`}>{subject}</span>
        <span className="text-on-surface-variant text-body-md truncate">- {snippet}</span>
      </div>
      <div className="flex items-center gap-3 w-[150px] justify-end">
        <span className={`px-2 py-0.5 rounded-full text-label-caps ${tagClass}`}>
          {tagLabel}
        </span>
        <span className={`text-body-sm whitespace-nowrap ${isAi ? "font-bold text-on-surface" : "text-on-surface-variant"}`}>
          {time}
        </span>
      </div>
    </div>
  );
}
