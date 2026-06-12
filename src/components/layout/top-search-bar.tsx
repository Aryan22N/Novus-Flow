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
} from "lucide-react";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TopSearchBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { data: session } = authClient.useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <header className="sticky top-0.5 z-50 flex items-center justify-between px-6 w-full bg-[#f7f9fc] backdrop-blur-md h-16 shrink-0">
      {/* Left Section */}
      <div className="flex items-center w-1/4">
        <button
          className="pl-2 rounded-full mt-2 hover:bg-gray-100 transition-colors focus:outline-none"
          onClick={onToggleSidebar}
        >
          <Menu size={23} className="text-gray-600" />
        </button>
        <Link href="/inbox">
          <img
            src="/Nexus_Flow_logo.png"
            alt="Logo"
            className="w-32 h-auto ml-2 object-contain select-none"
          />
        </Link>
      </div>


      {/* Search Section */}
      <div className="flex-1 max-w-2xl px-4">
        <div className="relative  flex items-center w-full h-12 rounded-full bg-gray-100 border border-transparent focus-within:bg-white focus-within:border-blue-200 focus-within:shadow-sm transition-all">
          <Search
            size={18}
            className="absolute  left-4 text-gray-500"
          />

          <input
            type="text"
            placeholder="Search mail, people, and files..."
            className="w-full pl-12 pr-12 py-2 bg-transparent outline-none text-sm rounded-full h-full"
          />

          <button className="absolute right-4">
            <SlidersHorizontal
              size={18}
              className="text-gray-500"
            />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-end gap-2 w-1/4">
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <CircleHelp size={20} className="text-gray-600" />
        </button>

        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Settings size={20} className="text-gray-600" />
        </button>

        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Grid3X3 size={20} className="text-gray-600" />
        </button>

        {/* User Avatar */}
        <div className="relative ml-2" ref={dropdownRef}>
          <div
            className="w-9 h-9 rounded-full overflow-hidden cursor-pointer border border-gray-200 hover:ring-2 hover:ring-blue-100 transition-all flex items-center justify-center bg-blue-50 text-blue-600 font-semibold shadow-sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session?.user?.name || "User Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{session?.user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            )}
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center shrink-0 border border-gray-200 text-blue-600 font-semibold">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{session?.user?.name?.charAt(0)?.toUpperCase() || <UserIcon size={20} />}</span>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-gray-900 text-sm truncate">{session?.user?.name || "Guest User"}</span>
                  <span className="text-xs text-gray-500 truncate">{session?.user?.email || "Not signed in"}</span>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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