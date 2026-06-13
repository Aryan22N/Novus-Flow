import {
  Sparkles,
  FileEdit,
  CalendarDays,
  ListChecks,
  FileSearch,
  ArrowRight,
} from "lucide-react";

export default function NexusAssistant() {
  return (
    <div className="bg-surface-container-lowest border-outline-variant ai-gradient relative flex flex-1 flex-col overflow-hidden rounded-xl border p-4">
      {/* Background Blur */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px]"></div>

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h3 className="text-title-sm font-title-sm text-primary flex items-center gap-2">
            <Sparkles size={20} />
            Nexus Assistant
          </h3>
        </div>

        {/* Chat History / Welcome Message */}
        <div className="mb-4 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <div className="text-body-sm rounded-lg border border-white bg-white/80 p-3 shadow-sm">
              How can I help you optimize your workflow today?
            </div>
          </div>
        </div>

        {/* Bottom Actions & Input Container */}
        <div className="flex flex-col gap-3">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-2" suppressHydrationWarning>
            <button suppressHydrationWarning className="font-label-caps border-outline-variant/30 hover:bg-primary flex items-center justify-center gap-1 rounded-lg border bg-white/90 px-2 py-2 text-[11px] font-bold shadow-sm transition-all hover:text-white">
              <FileEdit size={14} />
              DRAFT
            </button>
            <button suppressHydrationWarning className="font-label-caps border-outline-variant/30 hover:bg-primary flex items-center justify-center gap-1 rounded-lg border bg-white/90 px-2 py-2 text-[11px] font-bold shadow-sm transition-all hover:text-white">
              <CalendarDays size={14} />
              PREP
            </button>
            <button suppressHydrationWarning className="font-label-caps border-outline-variant/30 hover:bg-primary flex items-center justify-center gap-1 rounded-lg border bg-white/90 px-2 py-2 text-[11px] font-bold shadow-sm transition-all hover:text-white">
              <ListChecks size={14} />
              TASKS
            </button>
            <button suppressHydrationWarning className="font-label-caps border-outline-variant/30 hover:bg-primary flex items-center justify-center gap-1 rounded-lg border bg-white/90 px-2 py-2 text-[11px] font-bold shadow-sm transition-all hover:text-white">
              <FileSearch size={14} />
              SUM
            </button>
          </div>

          {/* Input Area */}
          <div className="border-outline-variant/50 relative flex w-full items-center rounded-xl border bg-white p-1 shadow-sm transition-all" suppressHydrationWarning>
            <input
              suppressHydrationWarning
              className="text-body-sm placeholder:text-on-surface-variant w-full border-none bg-transparent py-1.5 pr-10 pl-3 focus:ring-0 focus:outline-none"
              placeholder="Ask Nexus..."
              type="text"
            />
            <button suppressHydrationWarning className="bg-primary hover:bg-primary-container absolute right-1.5 flex items-center justify-center rounded-lg p-1 text-white transition-colors">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
