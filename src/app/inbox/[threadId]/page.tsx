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
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ThreadPage(props: {
  params: Promise<{ threadId: string }>;
}) {
  const params = use(props.params);
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");
  const [aiDraftText, setAiDraftText] = useState<string | undefined>(undefined);
  const [showHelpMeWrite, setShowHelpMeWrite] = useState(false);
  const [helpMeWritePrompt, setHelpMeWritePrompt] = useState("");
  const [showAiReplies, setShowAiReplies] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('superman_settings_auto_summarize');
    if (stored !== null) {
      setShowAiReplies(stored === 'true');
    }
  }, []);

  const { data: thread, isPending } = api.email.getThread.useQuery({
    threadId: params.threadId,
  });
  const utils = api.useUtils();

  const { data: suggestedRepliesData, isLoading: suggestionsLoading } =
    api.ai.getSuggestedReplies.useQuery(
      { threadId: params.threadId, messageId: replyingMessageId ?? "" },
      { enabled: !!replyingMessageId, refetchOnWindowFocus: false },
    );

  const draftMutation = api.ai.generateReplyDraft.useMutation({
    onSuccess: (data) => {
      setReplyText(data.draft);
      setAiDraftText(data.draft);
      setShowHelpMeWrite(false);
      setHelpMeWritePrompt("");
    },
    onError: (err) => {
      alert("Failed to draft reply: " + err.message);
    },
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
    },
  });

  useEffect(() => {
    if (thread && thread.messages.some((m) => m.unread)) {
      markReadMutation.mutate({ threadId: params.threadId });
    }
  }, [thread, params.threadId]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-[#202124] antialiased select-none">
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
        <main className="flex flex-1 flex-col overflow-y-auto bg-white">
          {/* Email Context Actions Row */}
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between bg-white/95 px-4 backdrop-blur">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => router.back()}
                className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                title="Back to Inbox"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="mx-2 h-6 w-[1px] bg-gray-200"></div>

              <button
                className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                title="Archive"
              >
                <Archive size={20} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                title="Report spam"
              >
                <AlertTriangle size={20} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>

              <div className="mx-2 h-6 w-[1px] bg-gray-200"></div>

              <button
                className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                title="Mark as unread"
              >
                <Mail size={20} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                title="Move to"
              >
                <Folder size={20} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                title="More"
              >
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-4">1 of 1</span>
              <button className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full p-2 text-gray-300">
                <ChevronLeft size={16} />
              </button>
              <button className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full p-2 text-gray-300">
                <ChevronLeft size={16} className="rotate-180" />
              </button>
            </div>
          </header>

          {/* Dynamic Thread Content Viewport */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-8 py-6">
              {isPending ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="animate-spin text-[#1a73e8]" size={32} />
                </div>
              ) : !thread ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Thread not found.
                </div>
              ) : (
                <div className="mx-auto w-full max-w-4xl">
                  {/* Subject Line & Thread Properties */}
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h1 className="text-[32px] font-light tracking-tight text-[#202124]">
                        {thread.subject}
                      </h1>
                      <span className="ml-2 flex items-center gap-1 rounded bg-[#f1f3f4] px-2 py-0.5 text-xs font-medium text-[#5f6368]">
                        Inbox
                        <button className="ml-0.5 hover:text-black">
                          <X size={12} />
                        </button>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                        title="Print all"
                      >
                        <Printer size={20} />
                      </button>
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                        title="In new window"
                      >
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Messages Sequence Stack */}
                  <div className="flex flex-col gap-8">
                    {thread.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                      >
                        {/* Message Sender Metadata Row */}
                        <div className="mb-4 flex items-start">
                          <div className="mt-0.5 mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e67e22] text-lg font-medium text-white select-none">
                            {msg.sender.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[15px] font-semibold text-[#202124]">
                                  {msg.sender}
                                </span>
                                <span className="ml-1.5 text-xs text-gray-500">
                                  &lt;{msg.senderEmail}&gt;
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span>
                                  {formatDistanceToNow(msg.date, {
                                    addSuffix: true,
                                  })}
                                </span>
                                <div className="ml-1 flex items-center">
                                  <button className="flex h-8 w-8 items-center justify-center rounded-full p-1 text-gray-500 hover:bg-gray-100">
                                    <Star size={18} />
                                  </button>
                                  <button className="flex h-8 w-8 items-center justify-center rounded-full p-1 text-gray-500 hover:bg-gray-100">
                                    <Reply size={18} />
                                  </button>
                                  <button className="flex h-8 w-8 items-center justify-center rounded-full p-1 text-gray-500 hover:bg-gray-100">
                                    <MoreVertical size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-0.5 flex items-center gap-0.5 text-xs text-gray-500">
                              <span>to {msg.to || "me"}</span>
                              <button className="rounded p-0.5 hover:bg-gray-100">
                                <ChevronDown size={12} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Cleaned Message Content Box */}
                        <article className="mb-6 pl-[52px]">
                          <div className="prose prose-sm prose-a:text-[#1a73e8] max-w-none text-sm leading-relaxed text-[#202124]">
                            {msg.htmlBody ? (
                              <div
                                className="email-content"
                                dangerouslySetInnerHTML={{
                                  __html: msg.htmlBody,
                                }}
                              />
                            ) : (
                              <div className="whitespace-pre-wrap">
                                {msg.plainBody || msg.snippet}
                              </div>
                            )}
                          </div>
                        </article>

                        {/* Dynamic Attachments Grid Layout */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mb-6 flex flex-wrap gap-3 pl-[52px]">
                            {msg.attachments.map((att: any) => (
                              <div
                                key={att.id}
                                className="flex max-w-xs cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs transition-colors hover:bg-gray-100"
                              >
                                <Paperclip
                                  size={14}
                                  className="shrink-0 text-gray-500"
                                />
                                <span
                                  className="truncate font-medium text-gray-700"
                                  title={att.filename}
                                >
                                  {att.filename}
                                </span>
                                {att.size > 0 && (
                                  <span className="shrink-0 font-normal text-gray-400">
                                    ({Math.round(att.size / 1024)} KB)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Immediate Contextual Reply Actions Footer */}
                        <div className="flex items-center gap-2 pl-[52px]">
                          <button
                            onClick={() => {
                              setReplyingMessageId(msg.id);
                              setReplyText("");
                              setShowHelpMeWrite(false);
                              setHelpMeWritePrompt("");
                            }}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 px-5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            suppressHydrationWarning
                          >
                            <Reply size={14} />
                            Reply
                          </button>
                          <button
                            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            suppressHydrationWarning
                          >
                            <Forward size={14} />
                            Forward
                          </button>
                          <button
                            className="rounded-full border border-transparent p-1.5 text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                            title="Add reaction"
                            suppressHydrationWarning
                          >
                            <Smile size={18} />
                          </button>
                        </div>

                        {/* Inline Reply Composer box */}
                        {replyingMessageId === msg.id && (
                          <div className="animate-fadeIn mt-4 flex flex-col gap-4 pl-[52px] select-text">
                            <div className="bg-surface-container-lowest border-outline-variant flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md">
                              {/* Header Section of Reply */}
                              <div className="flex items-center justify-between border-b border-transparent px-6 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    className="hover:bg-surface-container-high text-on-surface-variant rounded p-1"
                                    suppressHydrationWarning
                                  >
                                    <Reply size={20} />
                                  </button>
                                  <button
                                    className="hover:bg-surface-container-high text-on-surface-variant rounded p-1"
                                    suppressHydrationWarning
                                  >
                                    <ChevronDown size={20} />
                                  </button>
                                  <div className="text-body-md text-on-surface flex cursor-default items-center gap-1 font-medium select-none">
                                    {msg.sender}{" "}
                                    <span className="text-on-surface-variant font-normal">
                                      ({msg.senderEmail})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="hover:bg-surface-container-high text-on-surface-variant rounded p-1"
                                    suppressHydrationWarning
                                  >
                                    <Maximize2 size={20} />
                                  </button>
                                </div>
                              </div>

                              {/* Editor Body */}
                              <div className="relative flex flex-1 flex-col gap-3 px-6 py-4">
                                {showHelpMeWrite && (
                                  <div className="animate-fadeIn flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3 shadow-sm">
                                    <Sparkles
                                      size={16}
                                      className="shrink-0 animate-pulse text-blue-600"
                                    />
                                    <input
                                      type="text"
                                      value={helpMeWritePrompt}
                                      onChange={(e) =>
                                        setHelpMeWritePrompt(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          if (helpMeWritePrompt.trim()) {
                                            draftMutation.mutate({
                                              threadId: params.threadId,
                                              userBriefPrompt:
                                                helpMeWritePrompt,
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
                                      className="flex-1 border-none bg-transparent font-sans text-sm text-[#202124] outline-none placeholder:text-gray-400"
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
                                      disabled={
                                        draftMutation.isPending ||
                                        !helpMeWritePrompt.trim()
                                      }
                                      className="flex cursor-pointer items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                                      suppressHydrationWarning
                                    >
                                      {draftMutation.isPending ? (
                                        <>
                                          <Loader2
                                            size={12}
                                            className="animate-spin"
                                          />
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
                                      className="cursor-pointer rounded p-1 text-gray-500 transition-colors hover:bg-gray-200"
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
                                  className="text-body-md text-on-surface placeholder:text-outline/70 min-h-[140px] w-full flex-1 resize-none bg-transparent pt-1 font-sans outline-none"
                                  suppressHydrationWarning
                                />
                                {!replyText && !showHelpMeWrite && (
                                  <div
                                    onClick={() => {
                                      setShowHelpMeWrite(true);
                                      setReplyText("/");
                                    }}
                                    className="group mt-2 flex cursor-pointer items-start gap-1 select-none"
                                  >
                                    <div className="text-body-md text-outline font-body-md flex items-center gap-1.5 text-gray-500 transition-colors group-hover:text-blue-600">
                                      Press{" "}
                                      <span className="bg-surface-container font-mono-label text-on-surface border-outline-variant rounded border px-1.5 py-0.5 text-[12px]">
                                        /
                                      </span>{" "}
                                      to draft reply
                                    </div>
                                  </div>
                                )}
                                {/* Expandable area */}
                              </div>

                              {/* Footer Actions */}
                              <div className="border-outline-variant/10 flex items-center justify-between border-t px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {/* Send Button Group */}
                                  <div className="bg-primary hover:bg-primary-container flex items-center overflow-hidden rounded-full transition-colors duration-100 active:scale-95">
                                    <button
                                      onClick={() => {
                                        if (!replyText.trim()) return;
                                        sendEmailMutation.mutate({
                                          to: msg.senderEmail ?? "",
                                          subject: msg.subject.startsWith("Re:")
                                            ? msg.subject
                                            : "Re: " + msg.subject,
                                          body: replyText,
                                          aiDraftText: aiDraftText,
                                          threadId: params.threadId,
                                        });
                                      }}
                                      disabled={
                                        sendEmailMutation.isPending ||
                                        !replyText.trim()
                                      }
                                      className="text-body-md cursor-pointer py-2 pr-3 pl-6 font-bold text-white disabled:opacity-50"
                                      suppressHydrationWarning
                                    >
                                      {sendEmailMutation.isPending
                                        ? "Sending..."
                                        : "Send"}
                                    </button>
                                    <div className="h-6 w-[1px] bg-white/20"></div>
                                    <button
                                      className="cursor-pointer py-2 pr-3 pl-2 text-white"
                                      suppressHydrationWarning
                                    >
                                      <ChevronDown size={20} />
                                    </button>
                                  </div>

                                  {/* Formatting Bar */}
                                  <div className="text-on-surface-variant ml-2 flex items-center gap-1 select-none">
                                    <button
                                      className="hover:bg-surface-container-high cursor-pointer rounded-full p-2 transition-colors"
                                      title="Formatting"
                                      suppressHydrationWarning
                                    >
                                      <Type size={20} />
                                    </button>
                                    <button
                                      className="hover:bg-surface-container-high cursor-pointer rounded-full p-2 transition-colors"
                                      title="Attach files"
                                      suppressHydrationWarning
                                    >
                                      <Paperclip size={20} />
                                    </button>
                                    <button
                                      className="hover:bg-surface-container-high cursor-pointer rounded-full p-2 transition-colors"
                                      title="Insert link"
                                      suppressHydrationWarning
                                    >
                                      <Link size={20} />
                                    </button>
                                    <button
                                      className="hover:bg-surface-container-high cursor-pointer rounded-full p-2 transition-colors"
                                      title="Insert emoji"
                                      suppressHydrationWarning
                                    >
                                      <Smile size={20} />
                                    </button>
                                    <button
                                      className="hover:bg-surface-container-high cursor-pointer rounded-full p-2 transition-colors"
                                      title="Insert from Drive"
                                      suppressHydrationWarning
                                    >
                                      <Cloud size={20} />
                                    </button>
                                    <button
                                      className="hover:bg-surface-container-high cursor-pointer rounded-full p-2 transition-colors"
                                      title="Insert image"
                                      suppressHydrationWarning
                                    >
                                      <ImageIcon size={20} />
                                    </button>
                                    <button
                                      className="hover:bg-surface-container-high cursor-pointer rounded-full p-2 transition-colors"
                                      title="Confidential mode"
                                      suppressHydrationWarning
                                    >
                                      <Lock size={20} />
                                    </button>
                                    <button
                                      className="hover:bg-surface-container-high cursor-pointer rounded-full p-2 transition-colors"
                                      title="Insert signature"
                                      suppressHydrationWarning
                                    >
                                      <PenTool size={20} />
                                    </button>
                                    <button
                                      className="hover:bg-surface-container-high cursor-pointer rounded-full p-2 transition-colors"
                                      suppressHydrationWarning
                                    >
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
                                  className="hover:bg-error-container/20 text-on-surface-variant hover:text-error cursor-pointer rounded-full p-2 transition-all active:scale-90"
                                  title="Discard draft"
                                  suppressHydrationWarning
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>

                            {/* AI Suggested Replies */}
                            {showAiReplies && (
                              <div className="mx-auto mt-4 grid w-full max-w-5xl grid-cols-1 gap-4 select-none md:grid-cols-3">
                                {suggestionsLoading ? (
                                  <div className="bg-surface-container-lowest border-outline-variant col-span-3 flex animate-pulse items-center justify-center gap-2 rounded-xl border p-6 text-sm text-gray-500 shadow-sm">
                                    <Loader2
                                      className="text-primary animate-spin"
                                      size={16}
                                    />
                                    <span>
                                      Analyzing message to generate replies...
                                    </span>
                                  </div>
                                ) : (
                                  (suggestedRepliesData || []).map(
                                    (suggestion, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => {
                                          setReplyText(suggestion);
                                          setAiDraftText(suggestion);
                                        }}
                                        className="bg-surface-container-lowest border-outline-variant hover:border-primary/50 group cursor-pointer rounded-xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                                        suppressHydrationWarning
                                      >
                                        {idx === 0 && (
                                          <div className="text-primary mb-2 flex items-center gap-2">
                                            <Sparkles
                                              size={18}
                                              className="animate-pulse fill-current"
                                            />
                                            <span className="text-label-caps font-label-caps">
                                              AI SUGGESTION
                                            </span>
                                          </div>
                                        )}
                                        <p className="text-body-md text-on-surface font-sans">
                                          "{suggestion}"
                                        </p>
                                      </button>
                                    ),
                                  )
                                )}
                              </div>
                            )}
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
