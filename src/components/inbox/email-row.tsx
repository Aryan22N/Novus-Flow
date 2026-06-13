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
  const containerClasses = `group flex items-center p-3 border-b border-surface-container-highest hover:bg-surface-container-low  transition-colors cursor-pointer ${
    isAi ? "ai-gradient ai-border m-1 rounded-md" : ""
  }`;

  return (
    <div className={containerClasses}>
      <div className="flex w-1/4 min-w-[200px] items-center gap-3">
        {avatarSrc ? (
          <img
            alt={`${title} Avatar`}
            className="h-8 w-8 rounded-full"
            src={avatarSrc}
          />
        ) : (
          <div
            className={`text-body-sm flex h-8 w-8 items-center justify-center rounded-full font-bold text-white ${avatarColorClass}`}
          >
            {avatarText}
          </div>
        )}
        <div className="flex items-center gap-2">
          {icon}
          <span
            className={`text-body-md text-on-surface truncate ${isAi ? "font-bold" : ""}`}
          >
            {title}
          </span>
        </div>
      </div>
      <div className="flex flex-1 items-center gap-2 truncate pr-4">
        {isAi && <Sparkles size={14} className="text-violet-600" />}
        <span
          className={`text-body-md text-on-surface ${isAi ? "font-bold" : ""}`}
        >
          {subject}
        </span>
        <span className="text-on-surface-variant text-body-md truncate">
          - {snippet}
        </span>
      </div>
      <div className="flex w-[150px] items-center justify-end gap-3">
        <span
          className={`text-label-caps rounded-full px-2 py-0.5 ${tagClass}`}
        >
          {tagLabel}
        </span>
        <span
          className={`text-body-sm whitespace-nowrap ${isAi ? "text-on-surface font-bold" : "text-on-surface-variant"}`}
        >
          {time}
        </span>
      </div>
    </div>
  );
}
