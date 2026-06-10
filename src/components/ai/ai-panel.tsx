"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  FilePenLine,
  ClipboardCheck,
  CalendarCheck,
  SearchCheck,
  ArrowUp,
} from "lucide-react";

interface AiPanelProps {
  defaultOpen?: boolean;
  threadId?: string;
}

export default function AiPanel({ defaultOpen = false, threadId }: AiPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  useEffect(() => {
    if (threadId) {
      setIsExpanded(true);
    }
  }, [threadId]);

  if (!isExpanded) {
    return (
      <aside className="w-12 bg-[#f7f9fc] border-l border-outline-variant flex flex-col shrink-0 h-full transition-all duration-200 overflow-hidden">
        <div className="flex flex-col items-center py-4 gap-4 h-full">
          <button
            className="p-2 rounded-full hover:bg-surface-container-high text-primary"
            onClick={() => setIsExpanded(true)}
          >
            <Brain size={20} />
          </button>

          <div className="[writing-mode:vertical-lr] text-label-caps font-bold text-on-surface-variant tracking-widest uppercase">
            Nexus Assistant
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[380px] bg-surface-container-lowest border-l border-outline-variant flex flex-col shrink-0 h-full transition-all duration-200">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant flex items-center justify-between">
        <button
          className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded mr-2"
          onClick={() => setIsExpanded(false)}
        >
          <ChevronRight size={20} />
        </button>

        <div className="flex items-center gap-2 text-primary">
          <Brain size={20} />
          <h2 className="text-title-sm font-title-sm font-bold">
            Nexus Assistant
          </h2>
        </div>

        <button className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-surface-container-high text-on-surface px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-body-md border border-outline-variant/30">
            {threadId ? `Analyze email thread: ${threadId}` : "Summarize today's important emails."}
          </div>
        </div>

        {/* AI Response */}
        <div className="flex justify-start">
          <div className="ai-gradient px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-body-md ai-border relative overflow-hidden">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>

            <div className="relative z-10 flex flex-col gap-2 text-on-secondary-fixed">
              <p className="font-semibold flex items-center gap-1">
                <Sparkles size={16} />
                Here is your summary for today:
              </p>

              <ul className="list-disc pl-4 space-y-1 text-body-sm">
                <li>
                  <strong>Spotify:</strong> Offer for 3 months Premium for ₹99.
                </li>

                <li>
                  <strong>Docker:</strong> Urgent: A new personal access token
                  was created.
                </li>

                <li>
                  <strong>Google:</strong> Security alert regarding recent
                  account activity.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Actions + Input */}
      <div className="p-4 border-t border-outline-variant bg-surface-container-low">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button className="text-label-caps font-semibold py-1.5 px-2 bg-white border border-outline-variant rounded hover:bg-surface-container-lowest transition-colors text-on-surface flex items-center justify-center gap-1">
            <FilePenLine size={14} />
            Draft Reply
          </button>

          <button className="text-label-caps font-semibold py-1.5 px-2 bg-white border border-outline-variant rounded hover:bg-surface-container-lowest transition-colors text-on-surface flex items-center justify-center gap-1">
            <ClipboardCheck size={14} />
            Extract Tasks
          </button>

          <button className="text-label-caps font-semibold py-1.5 px-2 bg-white border border-outline-variant rounded hover:bg-surface-container-lowest transition-colors text-on-surface flex items-center justify-center gap-1">
            <CalendarCheck size={14} />
            Meeting Prep
          </button>

          <button className="text-label-caps font-semibold py-1.5 px-2 bg-white border border-outline-variant rounded hover:bg-surface-container-lowest transition-colors text-on-surface flex items-center justify-center gap-1">
            <SearchCheck size={14} />
            Summarize
          </button>
        </div>

        {/* Input */}
        <div className="relative flex items-center w-full bg-white border border-outline-variant rounded-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
          <input
            className="w-full bg-transparent border-none focus:ring-0 text-body-md pl-3 pr-10 py-1.5 placeholder:text-on-surface-variant outline-none"
            placeholder="Ask Nexus..."
            type="text"
          />

          <button className="absolute right-2 p-1.5 bg-primary text-white rounded-full hover:bg-primary-container transition-colors flex items-center justify-center">
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}