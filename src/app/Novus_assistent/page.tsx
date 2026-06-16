"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Pin, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '~/server/better-auth/client';
import { CldUploadWidget } from 'next-cloudinary';
import { FileUpload } from "~/components/ui/file-upload";
import { env } from "~/env";

export default function WorkspacePage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: session } = authClient.useSession();
  const [greeting, setGreeting] = useState('Evening');
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = (result: any) => {
    if (result.event === "success") {
      setAttachments(prev => [...prev, {
        name: result.info.original_filename + "." + result.info.format,
        url: result.info.secure_url
      }]);
    }
  };

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
          alert("Cloudinary Upload Error: " + data.error.message);
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Upload failed. Please check the console.");
      }
    }
    setIsUploading(false);
    setShowUploadModal(false);
  };

  useEffect(() => {
    const updateGreeting = () => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false
      });
      const currentHour = parseInt(formatter.format(new Date()), 10);

      if (currentHour >= 5 && currentHour < 12) setGreeting('Morning');
      else if (currentHour >= 12 && currentHour < 17) setGreeting('Afternoon');
      else setGreeting('Evening');
    };

    updateGreeting();
  }, []);

  const handleStartChat = () => {
    if (inputValue.trim() || attachments.length > 0) {
      const chatId = crypto.randomUUID();
      if (attachments.length > 0) {
        sessionStorage.setItem(`nova_attachments_${chatId}`, JSON.stringify(attachments));
      }
      router.push(`/Novus_assistent/${chatId}?q=${encodeURIComponent(inputValue)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (inputValue.trim() || attachments.length > 0)) {
      handleStartChat();
    }
  };

  const userName = session?.user?.name?.split(' ')[0] || '';

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
            {greeting}{userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-on-surface-variant max-w-md mx-auto">
            Your workspace is optimized. Novus AI continuously learns from every interaction to deliver a flawless experience.          </p>
        </div>

        <div className="w-full space-y-6">
          <div className="bg-white/90 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-2 transition-all duration-300 focus-within:shadow-2xl focus-within:ring-4 focus-within:ring-blue-500/10 input-glow-expand flex flex-col">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-100 border border-gray-200 shadow-sm rounded-xl px-3 py-1.5 text-sm font-medium text-gray-700">
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 px-4 h-14 md:h-16">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-body-md text-gray-800 placeholder:text-gray-400 outline-none w-full"
                placeholder="How can I help you today?"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-[#3C69A0] text-white p-2 rounded-2xl flex items-center justify-center shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Paperclip className="w-5 h-5 cursor-pointer" />
                </button>
                <button
                  onClick={handleStartChat}
                  disabled={!inputValue.trim() && attachments.length === 0}
                  className="bg-[#3C69A0] text-white p-2 rounded-2xl flex items-center justify-center shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >

                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Uploading to Cloudinary...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
