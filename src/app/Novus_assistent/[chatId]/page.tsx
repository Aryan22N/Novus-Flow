"use client";

import React, { useState, useRef, useEffect, use } from 'react';
import { Sparkles, Paperclip, Send, Loader2 } from 'lucide-react';
import { api } from "~/trpc/react";
import ComposeModal from "~/components/compose/compose-modal";
import { useSearchParams } from 'next/navigation';

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.chatId;
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Flag to know if user has typed/sent
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [summaryResult, setSummaryResult] = useState<any>(null);
  const [matchingContacts, setMatchingContacts] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const [isNovaPending, setIsNovaPending] = useState(false);
  const [pendingNovaAction, setPendingNovaAction] = useState<any>(null);

  const utils = api.useUtils();
  const createEventMutation = api.calendar.createEvent.useMutation();

  const summarizeEmailsMutation = api.ai.summarizeRecentEmails.useMutation({
    onSuccess: (data) => {
      setSummaryResult(data);
      scrollToBottom();
    },
  });

  const generateDraftMutation = api.ai.generateGlobalDraft.useMutation({
    onSuccess: (data) => {
      if (data.isMeetingRelated && data.meetingDetails) {
        createEventMutation.mutate({
          summary: data.meetingDetails.summary,
          meetingTime: data.meetingDetails.meetingTime,
        });
      }
      setGeneratedDraft({
        id: crypto.randomUUID(),
        to: data.to,
        cc: null,
        bcc: null,
        subject: data.subject,
        body: data.draft,
        aiDraftText: data.draft,
      });
      setInputValue("");
    },
  });

  // Fetch initial history if exists
  const { data: historyData, isSuccess: historyLoaded } = api.ai.getNovaChatHistory.useQuery(
    { chatId },
    { refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (historyLoaded && historyData && historyData.length > 0) {
      const formatted = historyData.map((t: any) => ({
        role: t.role === "user" ? "user" : "ai",
        content: t.parts.map((p: any) => p.text).join("\n")
      })) as { role: 'user' | 'ai', content: string }[];
      setMessages(formatted);
      setHasSentMessage(true);
      scrollToBottom();
    } else if (historyLoaded && initialQuery && !hasSentMessage) {
      // If no history but we have initial query from workspace
      handleSubmit(initialQuery);
    }
  }, [historyLoaded, historyData]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleAskNova = async (prompt: string, confirmed?: boolean) => {
    setIsNovaPending(true);
    try {
      const res = await fetch("/api/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: prompt, confirmed, chatId }),
      });
      const data = await res.json();
      
      // Invalidate the chat list to update the sidebar preview
      utils.ai.getNovaChats.invalidate();

      if (data.confirmationPending) {
        setPendingNovaAction(data.pendingAction);
        setMessages((prev) => [...prev, { role: 'ai', content: data.response }]);
      } else {
        setPendingNovaAction(null);
        setMessages((prev) => [...prev, { role: 'ai', content: data.response }]);
      }
      scrollToBottom();
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', content: "Error connecting to Nova API." }]);
      scrollToBottom();
    } finally {
      setIsNovaPending(false);
    }
  };

  const handleSubmit = async (promptToSubmit: string) => {
    if (!promptToSubmit.trim() || generateDraftMutation.isPending || isNovaPending) return;
    setHasSentMessage(true);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const draftMatch = promptToSubmit.trim().match(/^(?:draft\s+)?(?:mail\s+|email\s+)?to\s+([a-zA-Z0-9._%+-]+|[a-zA-Z\s]+)$/i);
    if (draftMatch?.[1]) {
      const contactQuery = draftMatch[1].trim();
      try {
        const list = await utils.email.searchContacts.fetch({ query: contactQuery });
        if (list.length > 0) {
          setMatchingContacts(list);
          setIsConfirming(true);
          scrollToBottom();
          return;
        }
      } catch (err) {
        console.error("Failed to search contacts:", err);
      }
      generateDraftMutation.mutate({ prompt: promptToSubmit });
      return;
    }

    if (promptToSubmit.startsWith("/draft ")) {
      generateDraftMutation.mutate({ prompt: promptToSubmit });
      return;
    }

    // Standard Chat using Nova API
    setMessages((prev) => [...prev, { role: 'user', content: promptToSubmit }]);
    scrollToBottom();
    handleAskNova(promptToSubmit);
  };

  const handleSend = () => {
    handleSubmit(inputValue);
  };

  const handleConfirmContact = (contact: any) => {
    generateDraftMutation.mutate({
      prompt: inputValue || initialQuery,
      recipientEmail: contact.email,
    });
    setIsConfirming(false);
    setMatchingContacts([]);
  };

  return (
    <div className="flex-1 relative flex flex-col bg-background/50 overflow-hidden h-full">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-400/10 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-sky-300/5 rounded-full blur-[100px] mix-blend-multiply"></div>
      </div>

      {/* Scrollable Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 custom-scrollbar z-10"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 3%, black 97%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 3%, black 97%, transparent)'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-8 pb-4">

          {/* Standard Chat Messages */}
          {messages.map((msg, idx) => (
            msg.role === 'user' ? (
              <div key={idx} className="flex flex-col items-end message-fade-in">
                <div className="max-w-[85%] md:max-w-[70%] p-4 rounded-2xl rounded-tr-none shadow-sm bg-primary-fixed text-on-primary-fixed">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div key={idx} className="flex flex-col items-start message-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 fill-white" />
                  </div>
                  <span className="font-bold text-primary">Novus AI</span>
                </div>
                <div className="max-w-full md:max-w-[90%] space-y-4">
                  <div className="bg-surface-container-lowest p-4 md:p-5 rounded-2xl rounded-tl-none border border-outline-variant shadow-sm text-on-surface leading-relaxed">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            )
          ))}

          {/* Pending Nova Action UI */}
          {pendingNovaAction && (
            <div className="flex flex-col items-start message-fade-in mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 fill-white" />
                </div>
                <span className="font-bold text-primary">Confirmation Required</span>
              </div>
              <div className="bg-surface-container-lowest p-4 md:p-5 rounded-2xl rounded-tl-none border border-outline-variant shadow-sm text-on-surface">
                <p className="text-sm mb-4 text-on-surface-variant font-medium">Novus wants to proceed. Do you confirm?</p>
                <div className="flex gap-2">
                  <button onClick={() => { setPendingNovaAction(null); handleAskNova("Yes, proceed.", true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-bold shadow-sm transition-colors">Yes, proceed</button>
                  <button onClick={() => { setPendingNovaAction(null); handleAskNova("No, cancel that.", false); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[12px] font-bold border border-slate-200 transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic AI Messages (Integrated from ai-recommendations) */}
          {summaryResult && (
            <div className="flex flex-col items-start message-fade-in mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 fill-white" />
                </div>
                <span className="font-bold text-primary">Novus Summary</span>
              </div>
              <div className="bg-surface-container-lowest p-4 md:p-5 rounded-2xl rounded-tl-none border border-outline-variant shadow-sm text-on-surface flex flex-col gap-4 max-w-[80%]">
                {summaryResult.updates.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-[12px] uppercase text-on-surface-variant tracking-wider">Inbox Updates</div>
                    {summaryResult.updates.map((update: string, i: number) => (
                      <div key={i} className="flex gap-2"><span className="text-primary mt-1">•</span><span className="text-sm leading-relaxed">{update}</span></div>
                    ))}
                  </div>
                )}
                {summaryResult.meetings.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="font-bold text-[12px] uppercase text-on-surface-variant tracking-wider">Upcoming Meetings</div>
                    {summaryResult.meetings.map((meeting: string, i: number) => (
                      <div key={i} className="flex gap-2"><span className="text-primary mt-1">•</span><span className="text-sm leading-relaxed">{meeting}</span></div>
                    ))}
                  </div>
                )}
                {summaryResult.deadlines.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="font-bold text-[12px] uppercase text-on-surface-variant tracking-wider">Critical Deadlines</div>
                    {summaryResult.deadlines.map((deadline: string, i: number) => (
                      <div key={i} className="flex gap-2"><span className="text-primary mt-1">•</span><span className="text-sm leading-relaxed">{deadline}</span></div>
                    ))}
                  </div>
                )}
                {summaryResult.tasks.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="font-bold text-[12px] uppercase text-on-surface-variant tracking-wider">Extracted Tasks</div>
                    {summaryResult.tasks.map((task: string, i: number) => (
                      <div key={i} className="flex gap-3 items-start p-2.5 rounded-lg border border-outline-variant/50 bg-surface">
                        <span className="text-outline-variant text-lg leading-none pt-0.5">☐</span>
                        <span className="text-sm font-medium">{task}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {isConfirming && matchingContacts.length > 0 && (
            <div className="flex flex-col items-start message-fade-in mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 fill-white" />
                </div>
                <span className="font-bold text-primary">Did you mean:</span>
              </div>
              <div className="text-body-sm flex flex-col gap-3 rounded-2xl rounded-tl-none border border-blue-200 bg-blue-50/95 p-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-300 w-full max-w-md">
                <div className="flex flex-col gap-2">
                  {matchingContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between gap-4 rounded-xl bg-white p-3 shadow-sm border border-slate-100">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-800 truncate">{contact.name || contact.email.split("@")[0]}</span>
                        <span className="text-xs text-slate-500 font-mono truncate">{contact.email}</span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => handleConfirmContact(contact)} className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer">Confirm</button>
                        <button onClick={() => { setIsConfirming(false); setMatchingContacts([]); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 cursor-pointer">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(summarizeEmailsMutation.isPending || generateDraftMutation.isPending || isNovaPending) && (
            <div className="flex flex-col items-start message-fade-in mt-6">
              <div className="flex items-center gap-3 rounded-2xl rounded-tl-none border border-outline-variant bg-surface p-4 shadow-sm text-on-surface-variant">
                <Loader2 size={18} className="animate-spin text-primary" />
                <span className="text-sm font-medium">Novus is processing your request...</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Input Bar Area */}
      <div className="w-full p-4 md:p-6 bg-transparent shrink-0 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className={`bg-surface-container-highest/60 backdrop-blur-xl border border-outline-variant rounded-2xl shadow-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-primary/20 ${!hasSentMessage ? 'input-glow-expand' : ''}`}>
            {/* Real Input Area */}
            <div className="flex items-end gap-2 p-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaInput}
                disabled={generateDraftMutation.isPending || isNovaPending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base resize-none max-h-48 py-2 px-2 outline-none placeholder:text-on-surface-variant/40 disabled:opacity-50"
                placeholder="Ask Novus..."
                rows={1}
              />
              <div className="flex items-center gap-1 h-full pb-1">
                <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={generateDraftMutation.isPending || isNovaPending || !inputValue.trim()}
                  className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 group disabled:opacity-50"
                >
                  {generateDraftMutation.isPending || isNovaPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform fill-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {generatedDraft && (
        <ComposeModal
          initialDraft={generatedDraft}
          onClose={() => setGeneratedDraft(null)}
        />
      )}
    </div>
  );
}
