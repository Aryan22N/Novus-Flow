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
  initialDraft?: {
    id: string;
    to: string | null;
    cc: string | null;
    bcc: string | null;
    subject: string | null;
    body: string | null;
    aiDraftText?: string | null;
    threadId?: string | null;
  };
}

const QUICK_PROMPTS = ["Follow up after interview", "Project status update"];

const TONES = ["Professional", "Friendly", "Shorten", "Fix Grammar"] as const;

export default function ComposeModal({ onClose, initialDraft }: ComposeModalProps) {
  const [to, setTo] = useState(initialDraft?.to || "");
  const [cc, setCc] = useState(initialDraft?.cc || "");
  const [bcc, setBcc] = useState(initialDraft?.bcc || "");
  const [showCc, setShowCc] = useState(!!initialDraft?.cc);
  const [showBcc, setShowBcc] = useState(!!initialDraft?.bcc);
  const [subject, setSubject] = useState(initialDraft?.subject || "");
  const [body, setBody] = useState(initialDraft?.body || "");
  const [aiDraftText, setAiDraftText] = useState<string | undefined>(initialDraft?.aiDraftText || undefined);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [draftSaved, setDraftSaved] = useState(true);
  const [draftId, setDraftId] = useState<string | undefined>(initialDraft?.id);
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

  // Set inner html once on mount if we have an initial body
  useEffect(() => {
    if (bodyRef.current && initialDraft?.body && !bodyRef.current.innerText) {
      bodyRef.current.innerText = initialDraft.body;
    }
  }, [initialDraft?.body]);

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

  const saveDraftMutation = api.email.saveDraft.useMutation({
    onSuccess: (data) => {
      if (data.draftId && data.draftId !== draftId) {
        setDraftId(data.draftId);
      }
      setDraftSaved(true);
    },
  });

  const deleteDraftMutation = api.email.deleteDraft.useMutation();

  const generateDraftMutation = api.ai.generateGlobalDraft.useMutation({
    onSuccess: (data) => {
      setBody(data.draft);
      setAiDraftText(data.draft);
      if (bodyRef.current) {
        bodyRef.current.innerText = data.draft;
      }
      if (data.to && !to) {
        setTo(data.to);
      }
      if (data.subject && !subject) {
        setSubject(data.subject);
      }
    },
    onError: (err) => {
      alert("Failed to generate draft: " + err.message);
    },
  });

  // Auto-save draft indicator
  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);

    // Only auto-save if there's actually content
    if (to.trim() || cc.trim() || bcc.trim() || subject.trim() || body.trim()) {
      setDraftSaved(false);
      draftTimer.current = setTimeout(() => {
        saveDraftMutation.mutate({
          id: draftId,
          to: to.trim(),
          cc: cc.trim(),
          bcc: bcc.trim(),
          subject: subject.trim(),
          body: body.trim(),
        });
      }, 1500);
    }

    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [to, cc, bcc, subject, body, draftId]);

  const handleSend = () => {
    const bodyText = bodyRef.current?.innerText ?? body;
    sendMutation.mutate({
      to: to.trim(),
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      subject: subject.trim(),
      body: bodyText,
      isHtml: false,
      aiDraftText: aiDraftText,
      threadId: initialDraft?.threadId || undefined,
    });
    // Optional: Delete draft if it was sent
    if (draftId) {
      deleteDraftMutation.mutate({ id: draftId });
    }
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
        className="fixed right-6 bottom-0 z-50 flex h-50 w-65 cursor-pointer items-center justify-between rounded-t-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            {subject || "New Message"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
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
        <div className="fixed right-6 bottom-0 z-50 flex h-[80vh] w-[650px] flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <h2 className="text-sm font-semibold text-slate-800">
                New Message
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* AI Copilot Panel */}
          <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-blue-600" />
              <span className="bg-gradient-to-r from-blue-800 to-cyan-500 bg-clip-text text-xs font-bold tracking-wider text-transparent uppercase">
                Novus Flow
              </span>
            </div>
            <div className="relative mb-3">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-36 text-sm placeholder-slate-400 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Describe the email you want to write..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && aiPrompt.trim() && !generateDraftMutation.isPending) {
                    generateDraftMutation.mutate({
                      prompt: aiPrompt,
                      recipientEmail: to.trim() || undefined,
                    });
                  }
                }}
              />
              <button
                onClick={() => {
                  if (!aiPrompt.trim() || generateDraftMutation.isPending) return;
                  generateDraftMutation.mutate({
                    prompt: aiPrompt,
                    recipientEmail: to.trim() || undefined,
                  });
                }}
                disabled={generateDraftMutation.isPending || !aiPrompt.trim()}
                className="absolute top-1.5 right-2 rounded-lg bg-gradient-to-r from-blue-800 to-cyan-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {generateDraftMutation.isPending ? "Generating..." : "Generate Draft"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[10px] font-bold text-slate-400 uppercase">
                Quick Tone:
              </span>
              {TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => applyTone(tone)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${activeTone === tone
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600"
                    }`}
                >
                  {tone}
                </button>
              ))}
              <div className="mx-1 h-4 w-px bg-slate-300" />
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => applyPrompt(prompt)}
                  className="text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-600"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* To Field */}
          <div className="flex h-11 shrink-0 items-center border-b border-slate-100 px-6">
            <span className="w-8 text-sm font-medium text-slate-400">To</span>
            <input
              className="flex-grow border-none bg-transparent text-sm text-slate-800 outline-none focus:ring-0"
              placeholder=""
              value={to}
              onChange={(e) => setTo(e.target.value)}
              spellCheck={false}
            />
            <div className="flex gap-3 text-xs font-semibold text-slate-400">
              {!showCc && (
                <button
                  onClick={() => setShowCc(true)}
                  className="transition-colors hover:text-blue-600"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  onClick={() => setShowBcc(true)}
                  className="transition-colors hover:text-blue-600"
                >
                  Bcc
                </button>
              )}
            </div>
          </div>

          {/* Cc Field */}
          {showCc && (
            <div className="flex h-11 shrink-0 items-center border-b border-slate-100 px-6">
              <span className="w-8 text-sm font-medium text-slate-400">Cc</span>
              <input
                className="flex-grow border-none bg-transparent text-sm text-slate-800 outline-none focus:ring-0"
                placeholder=""
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {/* Bcc Field */}
          {showBcc && (
            <div className="flex h-11 shrink-0 items-center border-b border-slate-100 px-6">
              <span className="w-8 text-sm font-medium text-slate-400">
                Bcc
              </span>
              <input
                className="flex-grow border-none bg-transparent text-sm text-slate-800 outline-none focus:ring-0"
                placeholder=""
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {/* Subject Field */}
          <div className="flex h-11 shrink-0 items-center border-b border-slate-100 px-6">
            <input
              className="flex-grow border-none bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-0"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <button
              className="text-slate-300 transition-colors hover:text-blue-600"
              title="AI Subject Lines"
            >
              <Sparkles size={16} />
            </button>
          </div>

          {/* Message Body */}
          <div
            className="flex-grow overflow-y-auto bg-white px-8 py-5"
            onClick={() => bodyRef.current?.focus()}
          >
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setBody(e.currentTarget.innerText)}
              data-placeholder="Start typing your message..."
              className="min-h-full w-full text-[17px] leading-7 text-slate-800 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          {/* Footer Toolbar */}
          <footer className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white px-3 py-2">
            <div className="flex items-center gap-4">
              {/* Send Button Group */}
              <div className="flex items-center overflow-hidden rounded-xl shadow-sm">
                <button
                  onClick={handleSend}
                  disabled={
                    sendMutation.isPending || !to.trim() || !subject.trim()
                  }
                  className="rounded-l-full bg-[#2656C9] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1c46a3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendMutation.isPending ? "Sending…" : "Send"}
                </button>
                <button className="rounded-r-full bg-[#2656C9] px-2 py-2.5 text-white transition-colors hover:bg-[#1c46a3] disabled:cursor-not-allowed disabled:opacity-50">
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Formatting Tools */}
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-slate-100"
                  title="Formatting"
                >
                  <Type size={18} />
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-slate-100"
                  title="Attach files"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-slate-100"
                  title="Insert link"
                >
                  <Link size={18} />
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-slate-100"
                  title="Emoji"
                >
                  <Smile size={18} />
                </button>
                <div className="mx-1 h-6 w-px bg-slate-200" />
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-slate-100"
                  title="More"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Status + Discard */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 italic">
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${draftSaved ? "bg-emerald-500" : "bg-amber-400"}`}
                />
                <span>{draftSaved ? "Draft saved" : "Saving…"}</span>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
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
          className={`fixed bottom-6 left-6 z-[100] transition-all duration-300 ${toastVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
            }`}
        >
          <div className="flex min-w-[340px] items-center gap-4 rounded border border-white/10 bg-[#323232] px-4 py-3 text-white shadow-xl">
            {/* Message */}
            <span className="text-[13px] tracking-wide text-white">
              Message sent
            </span>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-4">
              <button
                onClick={dismissToast}
                className="text-[13px] font-semibold tracking-tight text-[#8ab4f8] uppercase transition-colors hover:text-white"
              >
                Undo
              </button>
              {sentMessageId && (
                <button
                  onClick={dismissToast}
                  className="text-[13px] font-semibold tracking-tight text-[#8ab4f8] uppercase transition-colors hover:text-white"
                >
                  View message
                </button>
              )}
            </div>

            {/* Close */}
            <button
              onClick={dismissToast}
              className="ml-1 flex items-center justify-center rounded-full p-1 text-white/70 transition-all hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
