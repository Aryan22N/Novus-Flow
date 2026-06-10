"use client";

import {
  Menu,
  Search,
  SlidersHorizontal,
  CircleHelp,
  Settings,
  Grid3X3,
} from "lucide-react";

export default function TopSearchBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 w-full bg-white/80 backdrop-blur-md h-16 border-b shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4 w-1/4">
        <button 
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={onToggleSidebar}
        >
          <Menu size={20} className="text-gray-600" />
        </button>

        <span className="text-lg font-bold text-blue-600">
          Nexus Flow
        </span>
      </div>

      {/* Search Section */}
      <div className="flex-1 max-w-2xl px-4">
        <div className="relative flex items-center w-full h-12 rounded-full bg-gray-100 border border-transparent focus-within:bg-white focus-within:border-blue-200 focus-within:shadow-sm transition-all">
          <Search
            size={18}
            className="absolute left-4 text-gray-500"
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
        <div className="w-9 h-9 rounded-full overflow-hidden ml-2 cursor-pointer border">
          <img
            src="https://ui-avatars.com/api/?name=Aryan&background=2563eb&color=fff"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}