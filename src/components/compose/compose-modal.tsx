"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "~/trpc/react";
import {
  Minus,
  Maximize2,
  X,
  Sparkles,
  Send,
  ChevronDown,
  Type,
  Paperclip,
  Link,
  Smile,
  MoreVertical,
  Trash2,
} from "lucide-react";

interface ComposeModalProps {
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "Follow up after interview",
  "Project status update",
];

const TONES = ["Professional", "Friendly", "Shorten", "Fix Grammar"] as const;

export default function ComposeModal({ onClose }: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [activeTone, setActiveTone] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    setToastVisible(false);
    // Close the component only after the slide-out animation (300ms) finishes
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 300);
  }, [onClose]);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (showToast) {
      // Trigger slide-in after paint
      requestAnimationFrame(() => setToastVisible(true));
      toastTimer.current = setTimeout(() => dismissToast(), 5000);
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [showToast, dismissToast]);

  const sendMutation = api.email.sendEmail.useMutation({
    onSuccess: (data) => {
      setSentMessageId(data.messageId);
      // Hide the modal form but keep the component alive so the toast can render
      setIsSent(true);
      setShowToast(true);
    },
    onError: (err) => {
      alert(`Failed to send: ${err.message}`);
    },
  });

  // Auto-save draft indicator
  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => setDraftSaved(true), 1500);
    setDraftSaved(false);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [to, cc, bcc, subject, body]);

  const handleSend = () => {
    const bodyText = bodyRef.current?.innerText ?? body;
    sendMutation.mutate({
      to: to.trim(),
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      subject: subject.trim(),
      body: bodyText,
      isHtml: false,
    });
  };

  const applyTone = (tone: string) => {
    setActiveTone(tone);
    // Tone application would call an AI endpoint in the future
  };

  const applyPrompt = (prompt: string) => {
    setAiPrompt(prompt);
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-0 right-6 w-65 h-50 bg-white border border-slate-200 rounded-t-2xl shadow-2xl z-50 flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            {subject || "New Message"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg"
            onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center hover:bg-red-50 hover:text-red-600 rounded-lg"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Only render the compose window when not yet sent */}
      {!isSent && (
        <div className="fixed bottom-0 right-6 w-[650px] h-[80vh] bg-white flex flex-col rounded-t-2xl shadow-2xl z-50 border border-slate-200 overflow-hidden">
          {/* Header */}
          <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="text-sm font-semibold text-slate-800">New Message</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* AI Copilot Panel */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
                Nexus Flow
              </span>
            </div>
            <div className="relative mb-3">
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none placeholder-slate-400 shadow-sm pr-36"
                placeholder="Describe the email you want to write..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button className="absolute right-2 top-1.5 bg-gradient-to-r from-blue-600 to-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm">
                Generate Draft
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Tone:</span>
              {TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => applyTone(tone)}
                  className={`px-3 py-1.5 border rounded-full text-xs font-medium transition-all ${activeTone === tone
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                    }`}
                >
                  {tone}
                </button>
              ))}
              <div className="h-4 w-px bg-slate-300 mx-1" />
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => applyPrompt(prompt)}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* To Field */}
          <div className="px-6 border-b border-slate-100 flex items-center h-11 shrink-0">
            <span className="text-sm font-medium text-slate-400 w-8">To</span>
            <input
              className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-slate-800 outline-none"
              placeholder=""
              value={to}
              onChange={(e) => setTo(e.target.value)}
              spellCheck={false}
            />
            <div className="flex gap-3 text-xs font-semibold text-slate-400">
              {!showCc && (
                <button onClick={() => setShowCc(true)} className="hover:text-blue-600 transition-colors">Cc</button>
              )}
              {!showBcc && (
                <button onClick={() => setShowBcc(true)} className="hover:text-blue-600 transition-colors">Bcc</button>
              )}
            </div>
          </div>

          {/* Cc Field */}
          {showCc && (
            <div className="px-6 border-b border-slate-100 flex items-center h-11 shrink-0">
              <span className="text-sm font-medium text-slate-400 w-8">Cc</span>
              <input
                className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-slate-800 outline-none"
                placeholder=""
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {/* Bcc Field */}
          {showBcc && (
            <div className="px-6 border-b border-slate-100 flex items-center h-11 shrink-0">
              <span className="text-sm font-medium text-slate-400 w-8">Bcc</span>
              <input
                className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-slate-800 outline-none"
                placeholder=""
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {/* Subject Field */}
          <div className="px-6 border-b border-slate-100 flex items-center h-11 shrink-0">
            <input
              className="flex-grow bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-slate-400 text-slate-800 outline-none"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <button className="text-slate-300 hover:text-blue-600 transition-colors" title="AI Subject Lines">
              <Sparkles size={16} />
            </button>
          </div>

          {/* Message Body */}
          <div
            className="flex-grow px-8 py-5 overflow-y-auto bg-white"
            onClick={() => bodyRef.current?.focus()}
          >
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setBody(e.currentTarget.innerText)}
              data-placeholder="Start typing your message..."
              className="w-full min-h-full outline-none text-[17px] leading-7 text-slate-800 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          {/* Footer Toolbar */}
          <footer className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-4">
              {/* Send Button Group */}
              <div className="flex items-center rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={handleSend}
                  disabled={sendMutation.isPending || !to.trim() || !subject.trim()}
                  className="bg-[#2656C9] hover:bg-[#1c46a3] rounded-l-full disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-6 py-2.5 transition-colors"
                >
                  {sendMutation.isPending ? "Sending…" : "Send"}
                </button>
                <button className="bg-[#2656C9] hover:bg-[#1c46a3] disabled:opacity-50 disabled:cursor-not-allowed rounded-r-full text-white py-2.5 px-2 transition-colors">
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Formatting Tools */}
              <div className="flex items-center gap-1 text-slate-500">
                <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-all" title="Formatting">
                  <Type size={18} />
                </button>
                <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-all" title="Attach files">
                  <Paperclip size={18} />
                </button>
                <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-all" title="Insert link">
                  <Link size={18} />
                </button>
                <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-all" title="Emoji">
                  <Smile size={18} />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-all" title="More">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Status + Discard */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium italic">
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${draftSaved ? "bg-emerald-500" : "bg-amber-400"}`} />
                <span>{draftSaved ? "Draft saved" : "Saving…"}</span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all rounded-lg"
                title="Discard draft"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* Sent Toast — renders outside the modal container, fixed to bottom-left */}
      {showToast && (
        <div
          className={`fixed bottom-6 left-6 z-[100] transition-all duration-300 ${toastVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
        >
          <div className="bg-[#323232] text-white py-3 px-4 rounded shadow-xl flex items-center gap-4 min-w-[340px] border border-white/10">
            {/* Message */}
            <span className="text-[13px] text-white tracking-wide">Message sent</span>

            {/* Actions */}
            <div className="flex items-center gap-4 ml-auto">
              <button
                onClick={dismissToast}
                className="text-[#8ab4f8] text-[13px] font-semibold uppercase tracking-tight hover:text-white transition-colors"
              >
                Undo
              </button>
              {sentMessageId && (
                <button
                  onClick={dismissToast}
                  className="text-[#8ab4f8] text-[13px] font-semibold uppercase tracking-tight hover:text-white transition-colors"
                >
                  View message
                </button>
              )}
            </div>

            {/* Close */}
            <button
              onClick={dismissToast}
              className="flex items-center justify-center p-1 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
