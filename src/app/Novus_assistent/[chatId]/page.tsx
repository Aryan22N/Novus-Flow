"use client";

import React, { useState, useRef, useEffect, use } from 'react';
import { Sparkles, Paperclip, Send, Loader2, X, Copy, Check } from 'lucide-react';
import { api } from "~/trpc/react";
import ComposeModal from "~/components/compose/compose-modal";
import { useSearchParams } from 'next/navigation';
import { FileUpload } from "~/components/ui/file-upload";
import { env } from "~/env";
import { toast } from 'sonner';

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.chatId;
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);
  // Bug 1 fix: useRef is immune to stale closure re-fires, unlike useState
  const hasSentRef   = useRef(false);
  // Bug 3 fix: save prompt before inputValue is cleared
  const lastPromptRef = useRef('');

  const [inputValue, setInputValue]       = useState('');
  const [attachments, setAttachments]     = useState<{ name: string; url: string }[]>([]);
  const [messages, setMessages]           = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [summaryResult, setSummaryResult] = useState<any>(null);
  const [isNovaPending, setIsNovaPending] = useState(false);
  // Problem 5 fix: shows tool-call progress while the agent loop runs
  const [novaStatus, setNovaStatus]       = useState('');
  const [pendingNovaAction, setPendingNovaAction] = useState<any>(null);
  // Copy-button UX
  const [copiedIdx, setCopiedIdx]         = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleAceternityUpload = async (files: File[]) => {
    setIsUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "superman_preset");
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) {
          setAttachments(prev => [...prev, { name: file.name, url: data.secure_url }]);
        } else if (data.error) {
          toast.error("Cloudinary Upload Error: " + data.error.message);
        }
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Upload failed. Please check the console.");
      }
    }
    setIsUploading(false);
    setShowUploadModal(false);
  };

  const utils = api.useUtils();

  const createEventMutation = api.calendar.createEvent.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to create event in Google Calendar');
    },
  });

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
          summary:     data.meetingDetails.summary,
          meetingTime: data.meetingDetails.meetingTime,
        });
      }
      setGeneratedDraft({
        id:          crypto.randomUUID(),
        to:          data.to,
        cc:          null,
        bcc:         null,
        subject:     data.subject,
        body:        data.draft,
        aiDraftText: data.draft,
      });
    },
  });

  // Problem 4 fix: getNovaChatHistory now returns { history, pendingActions }
  const { data: historyData, isSuccess: historyLoaded } = api.ai.getNovaChatHistory.useQuery(
    { chatId },
    { refetchOnWindowFocus: false },
  );

  // Bug 1 fix + Problem 4 fix (restore pending actions on refresh)
  useEffect(() => {
    if (!historyLoaded) return;
    if (hasSentRef.current) return; // Immune to stale closures — never re-fires

    // Retrieve attachments that were passed via sessionStorage from the landing page
    const storedStr = sessionStorage.getItem(`nova_attachments_${chatId}`);
    let storedAttachments: { name: string; url: string }[] = [];
    if (storedStr) {
      try {
        storedAttachments = JSON.parse(storedStr) as { name: string; url: string }[];
        setAttachments(storedAttachments);
      } catch (_) {}
      sessionStorage.removeItem(`nova_attachments_${chatId}`);
    }

    // historyData is now { history, pendingActions } (after ai.ts router fix)
    const history       = (historyData as any)?.history ?? (Array.isArray(historyData) ? historyData : []);
    const pendingActions = (historyData as any)?.pendingActions ?? null;

    if (Array.isArray(history) && history.length > 0) {
      const formatted = history.map((t: any) => ({
        role: t.role === 'user' ? 'user' : 'ai',
        content: (t.parts as { text: string }[])
          .map(p => p.text)
          .join('\n')
          .replace(/\[System Note:[\s\S]*?\]/g, '')
          .trim(),
      })) as { role: 'user' | 'ai'; content: string }[];

      setMessages(formatted);

      // Problem 4: restore pending action confirmation UI after page refresh
      if (Array.isArray(pendingActions) && pendingActions.length > 0) {
        setPendingNovaAction(pendingActions);
      }

      hasSentRef.current = true;
      scrollToBottom();
    } else if (initialQuery || storedAttachments.length > 0) {
      // Set the flag BEFORE the async call so a React re-render cannot re-trigger it
      hasSentRef.current = true;
      void handleSubmit(initialQuery || 'I have attached some files.', storedAttachments);
    }
  }, [historyLoaded, historyData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bug 6 fix: requestAnimationFrame runs after the browser has painted the new DOM
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Problem 5 fix: reads SSE stream for live status updates; falls back to JSON
  // for early returns (auth fail, rate limit, confirmed/cancel actions)
  const handleAskNova = async (
    prompt: string,
    confirmed?: boolean,
    modifiedActions?: any[],
    attachmentsToSend?: any[],
  ) => {
    setIsNovaPending(true);
    setNovaStatus('Thinking...');
    try {
      const res = await fetch('/api/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript:      prompt,
          confirmed,
          chatId,
          modifiedActions,
          attachments:     attachmentsToSend,
        }),
      });

      const contentType = res.headers.get('content-type') ?? '';

      if (contentType.includes('text/event-stream') && res.body) {
        // ── SSE path (main agent loop) ────────────────────────────────────────
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   buffer  = '';
        let   hasStartedStreamingResponse = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? ''; // keep incomplete trailing chunk

          for (const event of events) {
            if (!event.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(event.slice(6)) as any;
              if (data.status) setNovaStatus(data.status as string);
              
              if (data.chunk !== undefined) {
                if (!hasStartedStreamingResponse) {
                  hasStartedStreamingResponse = true;
                  setMessages(prev => [...prev, { role: 'ai', content: data.chunk as string }]);
                } else {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const last = newMsgs[newMsgs.length - 1];
                    if (last && last.role === 'ai') {
                      newMsgs[newMsgs.length - 1] = { ...last, content: last.content + data.chunk };
                    }
                    return newMsgs;
                  });
                }
                scrollToBottom();
              }

              if (data.response !== undefined) {
                void utils.ai.getNovaChats.invalidate();
                if (data.confirmationPending) {
                  setPendingNovaAction(
                    (data.pendingActions as any[]) ??
                    (data.pendingAction ? [data.pendingAction] : null),
                  );
                } else {
                  setPendingNovaAction(null);
                }
                
                if (!hasStartedStreamingResponse) {
                  setMessages(prev => [...prev, { role: 'ai', content: data.response as string }]);
                }
                scrollToBottom();
              }
            } catch (_) {}
          }
        }
      } else {
        // ── JSON fallback (early returns: confirm / cancel / errors) ──────────
        const data = (await res.json()) as any;
        void utils.ai.getNovaChats.invalidate();
        if (data.confirmationPending) {
          setPendingNovaAction(
            (data.pendingActions as any[]) ??
            (data.pendingAction ? [data.pendingAction] : null),
          );
        } else {
          setPendingNovaAction(null);
        }
        setMessages(prev => [...prev, { role: 'ai', content: data.response as string }]);
        scrollToBottom();
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Error connecting to Nova API.' }]);
      scrollToBottom();
    } finally {
      setIsNovaPending(false);
      setNovaStatus('');
    }
  };

  // Bug 2 fix: regex shortcut removed — everything goes through Nova AI
  // Bug 3 fix: lastPromptRef saved before clearing inputValue
  const handleSubmit = async (promptToSubmit: string, attachmentsOverride?: any[]) => {
    if (
      (!promptToSubmit.trim() && attachments.length === 0) ||
      generateDraftMutation.isPending ||
      isNovaPending
    ) return;

    // Bug 3: capture the prompt BEFORE clearing the input field
    lastPromptRef.current = promptToSubmit;
    setInputValue('');

    const attachmentsToSend = attachmentsOverride ?? [...attachments];
    setAttachments([]);
    setSummaryResult(null); // UX: clear stale summary card when a new message is sent

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // /draft is a power-user shortcut to directly open the compose modal
    if (promptToSubmit.startsWith('/draft ')) {
      const prompt = promptToSubmit.slice(7);
      setMessages(prev => [...prev, { role: 'user', content: promptToSubmit }]);
      generateDraftMutation.mutate({ prompt });
      return;
    }

    // All other messages → Nova AI (Bug 2 fix: regex bypass is gone)
    let displayMessage = promptToSubmit;
    if (attachmentsToSend.length > 0) {
      displayMessage += `\n[Attached: ${attachmentsToSend.map(a => (a as { name: string }).name).join(', ')}]`;
    }
    setMessages(prev => [...prev, { role: 'user', content: displayMessage }]);
    scrollToBottom();
    void handleAskNova(promptToSubmit, false, undefined, attachmentsToSend);
  };

  const handleSend = () => {
    void handleSubmit(inputValue);
  };

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  // Use message count + loading state to drive the glow animation instead of removed hasSentMessage
  const hasActivity = messages.length > 0 || isNovaPending || generateDraftMutation.isPending;

  return (
    <div className="flex-1 relative flex flex-col bg-background/50 overflow-hidden h-full">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-400/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-sky-300/5 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      {/* Scrollable Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 custom-scrollbar z-10"
        style={{
          maskImage:       'linear-gradient(to bottom, transparent, black 3%, black 97%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 3%, black 97%, transparent)',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-8 pb-4">

          {/* ── Chat messages ────────────────────────────────────────────── */}
          {messages.map((msg, idx) =>
            msg.role === 'user' ? (
              <div key={idx} className="flex flex-col items-end message-fade-in">
                <div className="max-w-[85%] md:max-w-[70%] p-4 rounded-2xl rounded-tr-none shadow-sm bg-primary-fixed text-on-primary-fixed">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div key={idx} className="flex flex-col items-start message-fade-in">
                <div className="max-w-full md:max-w-[90%] space-y-4">
                  {/* Copy button appears on hover */}
                  <div className="relative group">
                    <div className="bg-surface-container-lowest p-4 md:p-5 rounded-2xl rounded-tl-none border border-outline-variant shadow-sm text-on-surface leading-relaxed">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      title="Copy response"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-surface hover:bg-surface-container text-on-surface-variant"
                    >
                      {copiedIdx === idx
                        ? <Check className="w-3.5 h-3.5 text-green-500" />
                        : <Copy className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}

          {/* ── Pending Nova Action Confirmation UI ──────────────────────── */}
          {pendingNovaAction && Array.isArray(pendingNovaAction) && (
            <div className="flex flex-col items-start message-fade-in mt-6 w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-container text-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 fill-white" />
                </div>
                <span className="font-bold text-primary">Confirmation Required</span>
              </div>
              <div className="bg-surface-container-lowest p-4 md:p-5 rounded-2xl rounded-tl-none border border-outline-variant shadow-sm text-on-surface w-full max-w-[90%] md:max-w-[75%]">
                <p className="text-sm mb-4 text-on-surface-variant font-medium">
                  Novus wants to proceed. Please review and edit before confirming:
                </p>

                <div className="flex flex-col gap-4 mb-5 w-full">
                  {pendingNovaAction.map((action: any, idx: number) => {
                    if (action.tool === 'sendEmail') {
                      return (
                        <div key={idx} className="border border-outline-variant/60 p-4 rounded-xl flex flex-col gap-3 bg-surface w-full shadow-sm">
                          <div className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                            <Send className="w-3.5 h-3.5" /> Send Email
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-on-surface-variant ml-1">To</label>
                            {/* Bug 5 fix: spreads a new args object — no direct state mutation */}
                            <input
                              className="text-sm p-2.5 border border-outline-variant/60 rounded-lg w-full bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              value={action.args.to || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingNovaAction((prev: any[]) =>
                                  prev.map((a: any, i: number) =>
                                    i === idx ? { ...a, args: { ...a.args, to: val } } : a,
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-on-surface-variant ml-1">Subject</label>
                            <input
                              className="text-sm p-2.5 border border-outline-variant/60 rounded-lg w-full bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              value={action.args.subject || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingNovaAction((prev: any[]) =>
                                  prev.map((a: any, i: number) =>
                                    i === idx ? { ...a, args: { ...a.args, subject: val } } : a,
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-on-surface-variant ml-1">Message</label>
                            <textarea
                              className="text-sm p-2.5 border border-outline-variant/60 rounded-lg w-full bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[120px] resize-y"
                              value={action.args.body || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingNovaAction((prev: any[]) =>
                                  prev.map((a: any, i: number) =>
                                    i === idx ? { ...a, args: { ...a.args, body: val } } : a,
                                  ),
                                );
                              }}
                            />
                          </div>
                        </div>
                      );
                    }

                    if (action.tool === 'createCalendarEvent') {
                      return (
                        <div key={idx} className="border border-outline-variant/60 p-4 rounded-xl flex flex-col gap-3 bg-surface w-full shadow-sm">
                          <div className="text-[11px] font-bold text-primary uppercase tracking-wider">Create Calendar Event</div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-on-surface-variant ml-1">Title</label>
                            <input
                              className="text-sm p-2.5 border border-outline-variant/60 rounded-lg w-full bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              value={action.args.summary || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingNovaAction((prev: any[]) =>
                                  prev.map((a: any, i: number) =>
                                    i === idx ? { ...a, args: { ...a.args, summary: val } } : a,
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-on-surface-variant ml-1">Time</label>
                            <input
                              className="text-sm p-2.5 border border-outline-variant/60 rounded-lg w-full bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              value={action.args.time || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingNovaAction((prev: any[]) =>
                                  prev.map((a: any, i: number) =>
                                    i === idx ? { ...a, args: { ...a.args, time: val } } : a,
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-on-surface-variant ml-1">Description</label>
                            <textarea
                              className="text-sm p-2.5 border border-outline-variant/60 rounded-lg w-full bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[60px] resize-y"
                              value={action.args.description || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingNovaAction((prev: any[]) =>
                                  prev.map((a: any, i: number) =>
                                    i === idx ? { ...a, args: { ...a.args, description: val } } : a,
                                  ),
                                );
                              }}
                            />
                          </div>
                        </div>
                      );
                    }

                    if (action.tool === 'deleteCalendarEvent') {
                      return (
                        <div key={idx} className="border border-red-500/30 p-4 rounded-xl flex flex-col gap-3 bg-red-50/50 w-full shadow-sm">
                          <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                            <X className="w-3.5 h-3.5" /> Cancel Calendar Event
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-red-800/70 ml-1">Title</label>
                            <input
                              className="text-sm p-2.5 border border-red-200/60 rounded-lg w-full bg-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-red-900"
                              value={action.args.summary || 'Unknown Event'}
                              readOnly
                            />
                          </div>
                          <p className="text-xs text-red-600 font-medium mt-1">
                            This will permanently delete the event from your Google Calendar.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="text-sm p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/60">
                        {action.draft}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const actionsToSubmit = [...pendingNovaAction];
                      setPendingNovaAction(null);
                      void handleAskNova('Yes, proceed.', true, actionsToSubmit);
                    }}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-container hover:text-on-primary-container text-white rounded-xl text-sm font-bold shadow-md shadow-primary/20 transition-all"
                  >
                    Confirm & Execute
                  </button>
                  <button
                    onClick={() => {
                      setPendingNovaAction(null);
                      void handleAskNova('No, cancel that.', false);
                    }}
                    className="px-5 py-2.5 bg-surface hover:bg-surface-container-highest text-on-surface-variant rounded-xl text-sm font-bold border border-outline-variant transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Inbox Summary Result ──────────────────────────────────────── */}
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
                      <div key={i} className="flex gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm leading-relaxed">{update}</span>
                      </div>
                    ))}
                  </div>
                )}
                {summaryResult.meetings.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="font-bold text-[12px] uppercase text-on-surface-variant tracking-wider">Upcoming Meetings</div>
                    {summaryResult.meetings.map((meeting: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm leading-relaxed">{meeting}</span>
                      </div>
                    ))}
                  </div>
                )}
                {summaryResult.deadlines.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="font-bold text-[12px] uppercase text-on-surface-variant tracking-wider">Critical Deadlines</div>
                    {summaryResult.deadlines.map((deadline: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm leading-relaxed">{deadline}</span>
                      </div>
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

          {/* ── Loading indicator with live status text (Problem 5 fix) ──── */}
          {(summarizeEmailsMutation.isPending || generateDraftMutation.isPending || isNovaPending) && (
            <div className="flex flex-col items-start message-fade-in mt-6">
              <div className="flex items-center gap-3 rounded-2xl rounded-tl-none border border-outline-variant bg-surface p-4 px-5 shadow-sm min-h-[52px]">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {novaStatus && (
                  <span className="text-xs text-on-surface-variant animate-pulse ml-1">{novaStatus}</span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Input Bar ────────────────────────────────────────────────────── */}
      <div className="w-full p-4 md:p-6 bg-transparent shrink-0 relative z-10">
        <div className="max-w-4xl mx-auto">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 pb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm rounded-full px-3 py-1.5 text-sm font-medium text-gray-700"
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`bg-surface-container-highest/60 backdrop-blur-xl border border-outline-variant rounded-2xl shadow-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-primary/20 ${!hasActivity ? 'input-glow-expand' : ''}`}
          >
            <div className="flex items-end gap-2 p-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaInput}
                spellCheck={false}
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
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  disabled={generateDraftMutation.isPending || isNovaPending}
                >
                  <Paperclip className="w-5 h-5 cursor-pointer" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={
                    generateDraftMutation.isPending ||
                    isNovaPending ||
                    (!inputValue.trim() && attachments.length === 0)
                  }
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

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}>
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-6 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Upload Files</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="relative z-10 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-neutral-950/50">
              <FileUpload onChange={handleAceternityUpload} />
            </div>

            {isUploading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Uploading to Cloudinary...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
