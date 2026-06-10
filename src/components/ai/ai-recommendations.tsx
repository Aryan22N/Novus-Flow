import {
  Sparkles,
  CircleCheckBig,
  Clock3,
} from "lucide-react";

export default function AiRecommendations() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex-1 ai-gradient relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px]" />

      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-title-sm font-title-sm text-on-secondary-fixed mb-4 flex items-center gap-2 shrink-0">
          <Sparkles size={20} />
          AI Recommendations
        </h3>

        <div className="flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-2 text-body-sm text-on-surface">
            <li className="flex items-start gap-2 bg-white/80 p-2 rounded border border-white">
              <CircleCheckBig
                size={16}
                className="text-secondary mt-0.5 shrink-0"
              />

              <span>
                Follow up with Supabase team regarding the June 2026 update.
              </span>
            </li>

            <li className="flex items-start gap-2 bg-white/80 p-2 rounded border border-white">
              <Clock3
                size={16}
                className="text-secondary mt-0.5 shrink-0"
              />

              <span>
                Suggest rescheduling 1:1 with Sarah due to conflict.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}