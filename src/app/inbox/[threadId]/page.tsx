"use client";

import { use, useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { formatDistanceToNow } from "date-fns";
import TopSearchBar from "~/components/layout/top-search-bar";
import AppSidebar from "~/components/layout/app-sidebar";
import AiPanel from "~/components/ai/ai-panel";
import {
  Loader2,
  ChevronLeft,
  Archive,
  AlertTriangle,
  Trash2,
  Mail,
  Folder,
  MoreVertical,
  Printer,
  ExternalLink,
  X,
  Star,
  Reply,
  Forward,
  Smile,
  ChevronDown,
  Paperclip,
  Maximize2,
  Type,
  Link,
  Cloud,
  Image as ImageIcon,
  Lock,
  PenTool,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ThreadPage(props: { params: Promise<{ threadId: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showHelpMeWrite, setShowHelpMeWrite] = useState(false);
  const [helpMeWritePrompt, setHelpMeWritePrompt] = useState("");

  const { data: thread, isPending } = api.email.getThread.useQuery({ threadId: params.threadId });
  const utils = api.useUtils();

  const { data: suggestedRepliesData, isLoading: suggestionsLoading } = api.ai.getSuggestedReplies.useQuery(
    { threadId: params.threadId, messageId: replyingMessageId ?? "" },
    { enabled: !!replyingMessageId, refetchOnWindowFocus: false }
  );

  const draftMutation = api.ai.generateReplyDraft.useMutation({
    onSuccess: (data) => {
      setReplyText(data.draft);
      setShowHelpMeWrite(false);
      setHelpMeWritePrompt("");
    },
    onError: (err) => {
      alert("Failed to draft reply: " + err.message);
    }
  });

  const markReadMutation = api.email.markThreadAsRead.useMutation({
    onSuccess: () => {
      void utils.email.getUnreadCount.invalidate();
      void utils.email.getInboxThreads.invalidate();
    },
  });

  const sendEmailMutation = api.email.sendEmail.useMutation({
    onSuccess: () => {
      setReplyingMessageId(null);
      setReplyText("");
      setShowHelpMeWrite(false);
      setHelpMeWritePrompt("");
      alert("Reply sent successfully!");
    },
    onError: (err) => {
      alert("Failed to send reply: " + err.message);
    }
  });

  useEffect(() => {
    if (thread && thread.messages.some(m => m.unread)) {
      markReadMutation.mutate({ threadId: params.threadId });
    }
  }, [thread, params.threadId]);

  return (
    <div className="bg-white text-[#202124] flex flex-col h-screen overflow-hidden antialiased select-none">
      <style>{`
        .email-content img {
          max-width: 100%;
          height: auto;
        }
        .email-content table {
          max-width: 100%;
        }
        .email-content {
          overflow-x: auto;
        }
      `}</style>
      {/* Top Main Navigation Bar */}
      <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* App Sidebar */}
        <AppSidebar isOpen={isSidebarOpen} />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col">
          {/* Email Context Actions Row */}
          <header className="h-14 flex items-center justify-between px-4 shrink-0 sticky top-0 z-20 bg-white/95 backdrop-blur">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 w-10 h-10"
                title="Back to Inbox"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="w-[1px] h-6 bg-gray-200 mx-2"></div>

              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 w-10 h-10" title="Archive">
                <Archive size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 w-10 h-10" title="Report spam">
                <AlertTriangle size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 w-10 h-10" title="Delete">
                <Trash2 size={20} />
              </button>

              <div className="w-[1px] h-6 bg-gray-200 mx-2"></div>

              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 w-10 h-10" title="Mark as unread">
                <Mail size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 w-10 h-10" title="Move to">
                <Folder size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 w-10 h-10" title="More">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-4">1 of 1</span>
              <button className="p-2 rounded-full text-gray-300 cursor-not-allowed w-8 h-8 flex items-center justify-center">
                <ChevronLeft size={16} />
              </button>
              <button className="p-2 rounded-full text-gray-300 cursor-not-allowed w-8 h-8 flex items-center justify-center">
                <ChevronLeft size={16} className="rotate-180" />
              </button>
            </div>
          </header>

          {/* Dynamic Thread Content Viewport */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-8 py-6">
              {isPending ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#1a73e8]" size={32} />
                </div>
              ) : !thread ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Thread not found.
                </div>
              ) : (
                <div className="max-w-4xl w-full mx-auto">
                  {/* Subject Line & Thread Properties */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <h1 className="text-[32px] font-light tracking-tight text-[#202124]">{thread.subject}</h1>
                      <span className="bg-[#f1f3f4] text-[#5f6368] px-2 py-0.5 text-xs rounded flex items-center gap-1 font-medium ml-2">
                        Inbox
                        <button className="hover:text-black ml-0.5">
                          <X size={12} />
                        </button>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 w-10 h-10" title="Print all">
                        <Printer size={20} />
                      </button>
                      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 w-10 h-10" title="In new window">
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Messages Sequence Stack */}
                  <div className="flex flex-col gap-8">
                    {thread.messages.map((msg) => (
                      <div key={msg.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6">

                        {/* Message Sender Metadata Row */}
                        <div className="flex items-start mb-4">
                          <div className="w-12 h-12 rounded-full bg-[#e67e22] text-white flex items-center justify-center font-medium text-lg mr-4 mt-0.5 shrink-0 select-none">
                            {msg.sender.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-[15px] text-[#202124]">{msg.sender}</span>
                                <span className="text-xs text-gray-500 ml-1.5">&lt;{msg.senderEmail}&gt;</span>
                              </div>
                              <div className="flex items-center text-xs text-gray-500 gap-1">
                                <span>{formatDistanceToNow(msg.date, { addSuffix: true })}</span>
                                <div className="flex items-center ml-1">
                                  <button className="p-1 rounded-full hover:bg-gray-100 text-gray-500 w-8 h-8 flex items-center justify-center"><Star size={18} /></button>
                                  <button className="p-1 rounded-full hover:bg-gray-100 text-gray-500 w-8 h-8 flex items-center justify-center"><Reply size={18} /></button>
                                  <button className="p-1 rounded-full hover:bg-gray-100 text-gray-500 w-8 h-8 flex items-center justify-center"><MoreVertical size={18} /></button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5 text-xs text-gray-500 mt-0.5">
                              <span>to {msg.to || "me"}</span>
                              <button className="p-0.5 hover:bg-gray-100 rounded">
                                <ChevronDown size={12} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Cleaned Message Content Box */}
                        <article className="pl-[52px] mb-6">
                          <div className="text-sm text-[#202124] leading-relaxed prose prose-sm max-w-none prose-a:text-[#1a73e8]">
                            {msg.htmlBody ? (
                              <div className="email-content" dangerouslySetInnerHTML={{ __html: msg.htmlBody }} />
                            ) : (
                              <div className="whitespace-pre-wrap">{msg.plainBody || msg.snippet}</div>
                            )}
                          </div>
                        </article>

                        {/* Dynamic Attachments Grid Layout */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pl-[52px] mb-6 flex flex-wrap gap-3">
                            {msg.attachments.map((att: any) => (
                              <div key={att.id} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-xs hover:bg-gray-100 transition-colors cursor-pointer max-w-xs">
                                <Paperclip size={14} className="text-gray-500 shrink-0" />
                                <span className="text-gray-700 font-medium truncate" title={att.filename}>{att.filename}</span>
                                {att.size > 0 && <span className="text-gray-400 font-normal shrink-0">({Math.round(att.size / 1024)} KB)</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Immediate Contextual Reply Actions Footer */}
                        <div className="pl-[52px] flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReplyingMessageId(msg.id);
                              setReplyText("");
                              setShowHelpMeWrite(false);
                              setHelpMeWritePrompt("");
                            }}
                            className="inline-flex items-center px-5 py-1.5 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors gap-2 cursor-pointer"
                            suppressHydrationWarning
                          >
                            <Reply size={14} />
                            Reply
                          </button>
                          <button className="inline-flex items-center px-5 py-1.5 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors gap-2" suppressHydrationWarning>
                            <Forward size={14} />
                            Forward
                          </button>
                          <button className="p-1.5 rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-500" title="Add reaction" suppressHydrationWarning>
                            <Smile size={18} />
                          </button>
                        </div>

                        {/* Inline Reply Composer box */}
                        {replyingMessageId === msg.id && (
                          <div className="pl-[52px] mt-4 flex flex-col gap-4 animate-fadeIn select-text">
                            <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[320px] transition-all hover:shadow-md">
                              {/* Header Section of Reply */}
                              <div className="px-6 py-3 flex items-center justify-between border-b border-transparent">
                                <div className="flex items-center gap-2">
                                  <button className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant" suppressHydrationWarning>
                                    <Reply size={20} />
                                  </button>
                                  <button className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant" suppressHydrationWarning>
                                    <ChevronDown size={20} />
                                  </button>
                                  <div className="text-body-md text-on-surface font-medium flex items-center gap-1 cursor-default select-none">
                                    {msg.sender} <span className="text-on-surface-variant font-normal">({msg.senderEmail})</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant" suppressHydrationWarning>
                                    <Maximize2 size={20} />
                                  </button>
                                </div>
                              </div>

                              {/* Editor Body */}
                              <div className="flex-1 px-6 py-4 relative flex flex-col gap-3">
                                {showHelpMeWrite && (
                                  <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl flex items-center gap-3 animate-fadeIn shadow-sm">
                                    <Sparkles size={16} className="text-blue-600 animate-pulse shrink-0" />
                                    <input
                                      type="text"
                                      value={helpMeWritePrompt}
                                      onChange={(e) => setHelpMeWritePrompt(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          if (helpMeWritePrompt.trim()) {
                                            draftMutation.mutate({
                                              threadId: params.threadId,
                                              userBriefPrompt: helpMeWritePrompt,
                                            });
                                          }
                                        } else if (e.key === "Escape") {
                                          setShowHelpMeWrite(false);
                                          setHelpMeWritePrompt("");
                                          if (replyText === "/") {
                                            setReplyText("");
                                          }
                                        }
                                      }}
                                      placeholder="What should the reply say? (e.g. say yes, but ask to reschedule to Tuesday)"
                                      className="flex-1 bg-transparent border-none outline-none text-sm text-[#202124] placeholder:text-gray-400 font-sans"
                                      autoFocus
                                      suppressHydrationWarning
                                    />
                                    <button
                                      onClick={() => {
                                        if (helpMeWritePrompt.trim()) {
                                          draftMutation.mutate({
                                            threadId: params.threadId,
                                            userBriefPrompt: helpMeWritePrompt,
                                          });
                                        }
                                      }}
                                      disabled={draftMutation.isPending || !helpMeWritePrompt.trim()}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                      suppressHydrationWarning
                                    >
                                      {draftMutation.isPending ? (
                                        <>
                                          <Loader2 size={12} className="animate-spin" />
                                          Drafting...
                                        </>
                                      ) : (
                                        "Draft"
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowHelpMeWrite(false);
                                        setHelpMeWritePrompt("");
                                        if (replyText === "/") {
                                          setReplyText("");
                                        }
                                      }}
                                      className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors cursor-pointer"
                                      suppressHydrationWarning
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                )}

                                <textarea
                                  value={replyText}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setReplyText(val);
                                    if (val === "/") {
                                      setShowHelpMeWrite(true);
                                      setHelpMeWritePrompt("");
                                    }
                                  }}
                                  placeholder="Type your response here..."
                                  className="w-full flex-1 min-h-[140px] bg-transparent resize-none outline-none text-body-md text-on-surface pt-1 placeholder:text-outline/70 font-sans"
                                  suppressHydrationWarning
                                />
                                {!replyText && !showHelpMeWrite && (
                                  <div
                                    onClick={() => {
                                      setShowHelpMeWrite(true);
                                      setReplyText("/");
                                    }}
                                    className="flex items-start gap-1 mt-2 select-none cursor-pointer group"
                                  >
                                    <div className="text-body-md text-outline font-body-md flex items-center gap-1.5 text-gray-500 group-hover:text-blue-600 transition-colors">
                                      Press <span className="bg-surface-container px-1.5 py-0.5 rounded text-[12px] font-mono-label text-on-surface border border-outline-variant">/</span> to draft reply
                                    </div>
                                  </div>
                                )}
                                {/* Expandable area */}
                              </div>

                              {/* Footer Actions */}
                              <div className="px-6 py-4 flex items-center justify-between border-t border-outline-variant/10">
                                <div className="flex items-center gap-2">
                                  {/* Send Button Group */}
                                  <div className="flex items-center bg-primary rounded-full overflow-hidden hover:bg-primary-container transition-colors active:scale-95 duration-100">
                                    <button
                                      onClick={() => {
                                        if (!replyText.trim()) return;
                                        sendEmailMutation.mutate({
                                          to: msg.senderEmail ?? "",
                                          subject: msg.subject.startsWith("Re:") ? msg.subject : "Re: " + msg.subject,
                                          body: replyText,
                                        });
                                      }}
                                      disabled={sendEmailMutation.isPending || !replyText.trim()}
                                      className="pl-6 pr-3 py-2 text-white font-bold text-body-md cursor-pointer disabled:opacity-50"
                                      suppressHydrationWarning
                                    >
                                      {sendEmailMutation.isPending ? "Sending..." : "Send"}
                                    </button>
                                    <div className="w-[1px] h-6 bg-white/20"></div>
                                    <button className="pl-2 pr-3 py-2 text-white cursor-pointer" suppressHydrationWarning>
                                      <ChevronDown size={20} />
                                    </button>
                                  </div>

                                  {/* Formatting Bar */}
                                  <div className="flex items-center gap-1 ml-2 text-on-surface-variant select-none">
                                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer" title="Formatting" suppressHydrationWarning>
                                      <Type size={20} />
                                    </button>
                                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer" title="Attach files" suppressHydrationWarning>
                                      <Paperclip size={20} />
                                    </button>
                                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer" title="Insert link" suppressHydrationWarning>
                                      <Link size={20} />
                                    </button>
                                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer" title="Insert emoji" suppressHydrationWarning>
                                      <Smile size={20} />
                                    </button>
                                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer" title="Insert from Drive" suppressHydrationWarning>
                                      <Cloud size={20} />
                                    </button>
                                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer" title="Insert image" suppressHydrationWarning>
                                      <ImageIcon size={20} />
                                    </button>
                                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer" title="Confidential mode" suppressHydrationWarning>
                                      <Lock size={20} />
                                    </button>
                                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer" title="Insert signature" suppressHydrationWarning>
                                      <PenTool size={20} />
                                    </button>
                                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer" suppressHydrationWarning>
                                      <MoreVertical size={20} />
                                    </button>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    setReplyingMessageId(null);
                                    setReplyText("");
                                    setShowHelpMeWrite(false);
                                    setHelpMeWritePrompt("");
                                  }}
                                  className="p-2 hover:bg-error-container/20 text-on-surface-variant hover:text-error rounded-full transition-all active:scale-90 cursor-pointer"
                                  title="Discard draft"
                                  suppressHydrationWarning
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>

                            {/* AI Suggested Replies */}
                            <div className="max-w-5xl w-full mx-auto mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
                              {suggestionsLoading ? (
                                <div className="col-span-3 flex items-center justify-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl gap-2 text-sm text-gray-500 shadow-sm animate-pulse">
                                  <Loader2 className="animate-spin text-primary" size={16} />
                                  <span>Analyzing message to generate replies...</span>
                                </div>
                              ) : (
                                (suggestedRepliesData || []).map((suggestion, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setReplyText(suggestion)}
                                    className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-left hover:border-primary/50 transition-all hover:-translate-y-0.5 duration-200 group cursor-pointer shadow-sm active:scale-95"
                                    suppressHydrationWarning
                                  >
                                    {idx === 0 && (
                                      <div className="flex items-center gap-2 text-primary mb-2">
                                        <Sparkles size={18} className="fill-current animate-pulse" />
                                        <span className="text-label-caps font-label-caps">AI SUGGESTION</span>
                                      </div>
                                    )}
                                    <p className="text-body-md text-on-surface font-sans">"{suggestion}"</p>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Intelligence Panel */}
        <AiPanel defaultOpen={true} threadId={params.threadId} />
      </div>
    </div>
  );
}