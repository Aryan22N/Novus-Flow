"use client";

import React, { useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkspacePage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartChat = () => {
    if (inputValue.trim()) {
      const chatId = crypto.randomUUID();
      // We encode the initial query in the URL search params so the chat page can process it
      router.push(`/Novus_assistent/${chatId}?q=${encodeURIComponent(inputValue)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleStartChat();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent relative flex items-center justify-center p-4 h-full">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-400/10 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-sky-300/5 rounded-full blur-[100px] mix-blend-multiply"></div>
      </div>

      <div className="relative w-full max-w-3xl z-10 flex flex-col items-center">
        <div className="text-center mb-10 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="font-serif text-5xl md:text-7xl text-on-surface tracking-tight leading-tight">
            Evening, Aryan
          </h1>
          <p className="text-on-surface-variant max-w-md mx-auto">
            Your workspace is optimized. Novus AI has prepared priority insights.
          </p>
        </div>

        <div className="w-full space-y-6">
          <div className="bg-white/90 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-2 transition-all duration-300 focus-within:shadow-2xl focus-within:ring-4 focus-within:ring-blue-500/10 input-glow-expand">
            <div className="flex items-center gap-2 px-4 h-14 md:h-16">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-body-md text-gray-800 placeholder:text-gray-400 outline-none w-full"
                placeholder="How can I help you today?"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleStartChat}
                  disabled={!inputValue.trim()}
                  className="bg-blue-600 text-white p-2 rounded-2xl flex items-center justify-center shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
