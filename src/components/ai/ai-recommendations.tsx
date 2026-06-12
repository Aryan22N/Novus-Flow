import {
  Sparkles,
  FileEdit,
  CalendarDays,
  ListChecks,
  FileSearch,
  ArrowRight
} from "lucide-react";

export default function NexusAssistant() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex-1 ai-gradient relative overflow-hidden flex flex-col">
      {/* Background Blur */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px]"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-title-sm font-title-sm text-primary flex items-center gap-2">
            <Sparkles size={20} />
            Nexus Assistant
          </h3>
        </div>

        {/* Chat History / Welcome Message */}
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="flex flex-col gap-2">
            <div className="bg-white/80 p-3 rounded-lg border border-white text-body-sm shadow-sm">
              How can I help you optimize your workflow today?
            </div>
          </div>
        </div>

        {/* Bottom Actions & Input Container */}
        <div className="flex flex-col gap-3">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button className="text-[11px] font-label-caps font-bold py-2 px-2 bg-white/90 border border-outline-variant/30 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1 shadow-sm">
              <FileEdit size={14} />
              DRAFT
            </button>
            <button className="text-[11px] font-label-caps font-bold py-2 px-2 bg-white/90 border border-outline-variant/30 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1 shadow-sm">
              <CalendarDays size={14} />
              PREP
            </button>
            <button className="text-[11px] font-label-caps font-bold py-2 px-2 bg-white/90 border border-outline-variant/30 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1 shadow-sm">
              <ListChecks size={14} />
              TASKS
            </button>
            <button className="text-[11px] font-label-caps font-bold py-2 px-2 bg-white/90 border border-outline-variant/30 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1 shadow-sm">
              <FileSearch size={14} />
              SUM
            </button>
          </div>

          {/* Input Area */}
          <div className="relative flex items-center w-full bg-white border border-outline-variant/50 rounded-xl transition-all p-1 shadow-sm">
            <input
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-body-sm pl-3 pr-10 py-1.5 placeholder:text-on-surface-variant"
              placeholder="Ask Nexus..."
              type="text"
            />
            <button className="absolute right-1.5 p-1 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}