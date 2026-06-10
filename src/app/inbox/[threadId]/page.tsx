"use client";

import { use, useState } from "react";
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
  Paperclip
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ThreadPage(props: { params: Promise<{ threadId: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  const { data: thread, isPending } = api.email.getThread.useQuery({ threadId: params.threadId });

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
          <header className="h-14 flex items-center justify-between px-4 shrink-0 sticky top-0 z-20 bg-white/95 backdrop-blur  ">
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
                          <button className="inline-flex items-center px-5 py-1.5 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors gap-2">
                            <Reply size={14} />
                            Reply
                          </button>
                          <button className="inline-flex items-center px-5 py-1.5 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors gap-2">
                            <Forward size={14} />
                            Forward
                          </button>
                          <button className="p-1.5 rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-500" title="Add reaction">
                            <Smile size={18} />
                          </button>
                        </div>

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