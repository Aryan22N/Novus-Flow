"use client";

import React, { useState } from 'react';
import AppSidebar from '~/components/layout/app-sidebar';
import TopSearchBar from '~/components/layout/top-search-bar';
import { api } from "~/trpc/react";
import { MessageSquare, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function NovusAssistantLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  
  const { data: chats, isLoading } = api.ai.getNovaChats.useQuery(undefined, {
    refetchInterval: 10000,
  });
  
  const params = useParams();
  const activeChatId = params?.chatId as string;
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background font-body-md text-on-surface">
      {/* Shared CSS Injection */}
      <style>{`
        .ai-glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(224, 224, 224, 0.5); }
        .ai-glow { box-shadow: 0 0 40px rgba(0, 91, 191, 0.05); }
        .ai-glow-border {
          border: 1px solid transparent;
          background: linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #005bbf, #4648d4) border-box;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c6d6; border-radius: 10px; }
        .message-fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes inputGlowExpand {
          0% {
            transform: scale(0.95) translateY(10px);
            opacity: 0;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        @keyframes inputGlowPulse {
          0%, 100% {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0px 0px rgba(59, 130, 246, 0);
            border-color: rgba(226, 232, 240, 0.3);
          }
          50% {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 35px 8px rgba(59, 130, 246, 0.4);
            border-color: rgba(59, 130, 246, 0.8);
          }
        }
        .input-glow-expand {
          animation: 
            inputGlowExpand 0.6s cubic-bezier(0.16, 1, 0.3, 1), 
            inputGlowPulse 3s ease-in-out infinite;
        }
      `}</style>

      <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden relative">
        <AppSidebar isOpen={isSidebarOpen} />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative w-full bg-gradient-to-br from-[#f7f9fc] via-[#eef3fb] to-[#e2eaf5] dark:from-[#0a0f1c] dark:via-[#0f172a] dark:to-[#1e293b] transition-colors duration-300 pr-12">
          {children}
        </main>

        {/* Chat History Sidebar (Right Side) */}
        <div 
          onMouseEnter={() => setIsChatSidebarOpen(true)}
          onMouseLeave={() => setIsChatSidebarOpen(false)}
          className={`absolute right-0 top-0 bottom-0 z-20 border-l border-outline-variant dark:border-slate-800 bg-[#F3F6FB] dark:bg-[#0a0f1c] transition-all duration-300 ease-in-out flex flex-col ${isChatSidebarOpen ? 'w-64 shadow-2xl dark:shadow-black/50' : 'w-12'}`}
        >
          {isChatSidebarOpen && (
            <div className="flex flex-col h-full overflow-hidden message-fade-in w-64">
              <div className="p-4 flex-shrink-0 border-b border-outline-variant/50">
                <button
                  onClick={() => router.push('/Novus_assistent')}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white p-2.5 rounded-xl hover:bg-primary-container transition-colors font-medium text-sm shadow-sm"
                >
                  <Plus size={18} />
                  New Chat
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                <div className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-3 px-2">Recent Chats</div>
                {isLoading ? (
                  <div className="px-2 text-sm text-outline">Loading...</div>
                ) : chats?.length === 0 ? (
                  <div className="px-2 text-sm text-outline">No recent chats.</div>
                ) : (
                  chats?.map((chat) => (
                    <Link
                      key={chat.chatId}
                      href={`/Novus_assistent/${chat.chatId}`}
                      className={`flex flex-col gap-1 p-3 rounded-xl transition-all ${activeChatId === chat.chatId ? 'bg-primary-container/20 border border-primary/20 shadow-sm' : 'hover:bg-surface-container-low border border-transparent'}`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className={activeChatId === chat.chatId ? "text-primary" : "text-outline"} />
                        <span className={`text-sm truncate font-medium ${activeChatId === chat.chatId ? 'text-primary' : 'text-on-surface dark:text-slate-300'}`}>
                          {chat.initialText || "New Conversation"}
                        </span>
                      </div>
                      <span className="text-[10px] text-outline px-5">
                        {new Date(chat.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
          
          {!isChatSidebarOpen && (
            <div className="flex flex-col items-center py-4 w-12 h-full border-l border-outline-variant dark:border-slate-800 bg-[#F3F6FB] dark:bg-[#0a0f1c]">
               <button
                  onClick={() => router.push('/Novus_assistent')}
                  className="p-2 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors shadow-sm"
                  title="New Chat"
                >
                  <Plus size={18} />
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
