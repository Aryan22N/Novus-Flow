"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 antialiased select-none overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[60%] -right-[10%] w-[40%] h-[50%] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto">
        <h1 className="text-[150px] md:text-[200px] font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 opacity-90 drop-shadow-sm">
          404
        </h1>
        
        <div className="glass dark:glass-strong px-8 py-10 mt-4 rounded-3xl flex flex-col items-center max-w-lg w-full border border-white/40 dark:border-white/10 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-base md:text-lg leading-relaxed max-w-md">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link 
              href="/inbox"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95"
            >
              <Home size={18} />
              Return Home
            </Link>
            <button 
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
