"use client";

import { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  SlidersHorizontal,
  CircleHelp,
  Settings,
  Grid3X3,
  LogOut,
  User as UserIcon,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { authClient } from "~/server/better-auth/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function TopSearchBar({
  onToggleSidebar,
}: {
  onToggleSidebar?: () => void;
}) {
  const { data: session } = authClient.useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isSettings = pathname === '/settings';

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <header className="sticky top-0.5 z-50 flex h-16 w-full shrink-0 items-center justify-between bg-[#f7f9fc] dark:bg-[#0a0f1c] px-6 backdrop-blur-md transition-colors duration-300">
      {/* Left Section */}
      <div className="flex w-1/4 items-center">
        <button
          className="mt-2 rounded-full pl-2 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none"
          onClick={onToggleSidebar}
        >
          <Menu size={23} className="text-gray-600 dark:text-slate-300" />
        </button>
        <Link href="/inbox" className="flex flex-col items-center ml-1">
          <img
            src="/Nexus_Flow_logo.png"
            alt="Logo"
            className="h-32  w-35  object-contain select-none"
          />
          {/* <span
            className="text-[11px] sm:text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#497FC3] dark:text-blue-400"
            style={{
              fontFamily: 'var(--font-plus-jakarta-sans), sans-serif'
            }}
          >
            Novus Flow
          </span> */}
        </Link>
      </div>

      {/* Search Section */}
      <div className="max-w-2xl flex-1 px-4">
        <div className="relative flex h-12 w-full items-center rounded-full border border-transparent bg-[#EAEEF5] dark:bg-slate-800/60 transition-all focus-within:border-blue-200 dark:focus-within:border-blue-800 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:shadow-sm">
          <Search size={18} className="absolute left-4 text-gray-500 dark:text-slate-400" />

          <input
            type="text"
            spellCheck={false}
            placeholder="Search mail, people, and files..."
            className="h-full w-full rounded-full bg-transparent py-2 pr-12 pl-12 text-sm outline-none dark:text-white dark:placeholder-slate-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const query = e.currentTarget.value.trim();
                if (query) {
                  router.push(`/inbox?q=${encodeURIComponent(query)}`);
                } else {
                  router.push(`/inbox`);
                }
              }
            }}
          />

          <button className="absolute right-4">
            <SlidersHorizontal size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex w-1/4 items-center justify-end gap-2">
        <button className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800">
          <CircleHelp size={20} className="text-gray-600 dark:text-slate-300" />
        </button>

        <button
          onClick={() => router.push('/settings')}
          className={`rounded-full p-2 transition-colors ${isSettings ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
        >
          <Settings size={20} className={isSettings ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-slate-300"} />
        </button>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? (
              <Sun size={20} className="text-gray-600 dark:text-slate-300" />
            ) : (
              <Moon size={20} className="text-gray-600 dark:text-slate-300" />
            )}
          </button>
        )}

        {/* User Avatar */}
        <div className="relative ml-2" ref={dropdownRef}>
          <div
            className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-gray-200 dark:border-slate-700 bg-blue-50 dark:bg-slate-800 font-semibold text-blue-600 dark:text-blue-400 shadow-sm transition-all hover:ring-2 hover:ring-blue-100 dark:hover:ring-blue-900"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session?.user?.name || "User Avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-64 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-1 shadow-lg duration-200">
              <div className="flex items-center gap-3 border-b border-gray-50 dark:border-slate-800 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 dark:border-slate-700 bg-blue-50 dark:bg-slate-800 font-semibold text-blue-600 dark:text-blue-400">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session?.user?.name || "User Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {session?.user?.name || "User"}
                  </span>
                  <span className="truncate text-xs text-gray-500 dark:text-slate-400">
                    {session?.user?.email || "No email provided"}
                  </span>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
