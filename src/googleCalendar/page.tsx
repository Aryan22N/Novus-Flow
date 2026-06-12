import Link from 'next/link';
import React from 'react';

export default function googlecalendar() {
    return (
        <>
            <style>{`
        body {
          background-color: #ffffff;
          color: #3c4043;
          overflow: hidden;
          height: 100vh;
        }
        .app-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .calendar-grid div {
          border-right: 1px solid #dadce0;
          border-bottom: 1px solid #dadce0;
        }
        .calendar-grid .no-border-right {
          border-right: none;
        }
        .mini-calendar-cell {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          cursor: pointer;
        }
        .mini-calendar-cell:hover {
          background-color: #f1f3f4;
          border-radius: 50%;
        }
        .mini-calendar-today {
          background-color: #1a73e8 !important;
          color: white !important;
          border-radius: 50%;
        }
        .current-day-circle {
          background-color: #1a73e8;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .event-badge-green {
          background-color: #388e3c;
          color: white;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          margin: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

            <div className="app-container font-sans">
                {/* Main Header */}
                <header
                    className="h-16 border-b border-google-border flex items-center justify-between px-4 flex-shrink-0"
                    data-purpose="top-navigation"
                >
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-google-hover rounded-full" title="Main menu">
                            <svg className="w-6 h-6 text-google-text" focusable="false" viewBox="0 0 24 24">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
                            </svg>
                        </button>
                        <Link href="/inbox">
                            <img
                                src="/Nexus_Flow_logo.png"
                                alt="Logo"
                                className="w-32 h-auto ml-2 object-contain select-none"
                            />
                        </Link>
                        <div className="flex items-center ml-10 gap-2">
                            <button className="px-4 py-2 border border-google-border rounded-custom text-sm font-medium hover:bg-google-hover">
                                Today
                            </button>
                            <div className="flex items-center ml-2">
                                <button className="p-2 hover:bg-google-hover rounded-full" title="Previous month">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                </button>
                                <button className="p-2 hover:bg-google-hover rounded-full" title="Next month">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </button>
                            </div>
                            <h1 className="text-[22px] text-google-text ml-4">June 2026</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-google-hover rounded-full">
                            <svg className="w-6 h-6 text-google-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </button>
                        <button className="p-2 hover:bg-google-hover rounded-full">
                            <svg className="w-6 h-6 text-google-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </button>
                        <button className="p-2 hover:bg-google-hover rounded-full mr-2">
                            <svg className="w-6 h-6 text-google-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </button>
                        <div className="relative inline-block text-left mr-2">
                            <button className="flex items-center px-3 py-1.5 border border-google-border rounded-custom text-sm font-medium hover:bg-google-hover">
                                Month
                                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="flex bg-[#e8f0fe] p-1 rounded-custom mx-1">
                            <button className="p-1.5 bg-[#d2e3fc] rounded-custom">
                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"></path>
                                </svg>
                            </button>
                            <button className="p-1.5 hover:bg-[#d2e3fc] rounded-custom">
                                <svg className="w-5 h-5 text-google-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </button>
                        </div>
                        <button className="p-2 hover:bg-google-hover rounded-full">
                            <svg className="w-6 h-6 text-google-text" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 16a2 2 0 100-4 2 2 0 000 4zM12 20a2 2 0 100-4 2 2 0 000 4zM12 8a2 2 0 100-4 2 2 0 000 4z"></path>
                            </svg>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-[#d56e3c] flex items-center justify-center text-white text-sm font-semibold ml-2">
                            D
                        </div>
                    </div>
                </header>

                <main className="main-content">
                    {/* Left Sidebar */}
                    <aside className="w-64 border-r border-google-border flex-shrink-0 p-4 flex flex-col gap-6" data-purpose="sidebar-navigation">
                        <button className="flex items-center shadow-md border border-google-border py-2 px-4 rounded-full gap-3 hover:shadow-lg transition-shadow">
                            <svg height="36" viewBox="0 0 36 36" width="36">
                                <path d="M16 16v14h4V20z" fill="#34A853"></path>
                                <path d="M30 16H20l-4 4h14z" fill="#4285F4"></path>
                                <path d="M6 16v4h10l4-4z" fill="#FBBC05"></path>
                                <path d="M20 16V6h-4v14z" fill="#EA4335"></path>
                                <path d="M0 0h36v36H0z" fill="none"></path>
                            </svg>
                            <span className="text-sm font-medium">Create</span>
                            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
                            </svg>
                        </button>

                        {/* Mini Calendar */}
                        <div className="mt-4" data-purpose="mini-calendar">
                            <div className="flex items-center justify-between px-2 mb-4">
                                <span className="text-sm font-medium">June 2026</span>
                                <div className="flex gap-2">
                                    <button className="hover:bg-google-hover p-1 rounded-full">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"></path>
                                        </svg>
                                    </button>
                                    <button className="hover:bg-google-hover p-1 rounded-full">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 text-center text-[10px] text-google-gray font-medium mb-2">
                                <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                            </div>
                            <div className="grid grid-cols-7 gap-y-1">
                                <div className="mini-calendar-cell text-gray-400">31</div>
                                <div className="mini-calendar-cell">1</div><div className="mini-calendar-cell">2</div><div className="mini-calendar-cell">3</div>
                                <div className="mini-calendar-cell">4</div><div className="mini-calendar-cell">5</div><div className="mini-calendar-cell">6</div>
                                <div className="mini-calendar-cell">7</div><div className="mini-calendar-cell">8</div><div className="mini-calendar-cell">9</div>
                                <div className="mini-calendar-cell">10</div><div className="mini-calendar-cell mini-calendar-today">11</div>
                                <div className="mini-calendar-cell bg-blue-100 rounded-full">12</div><div className="mini-calendar-cell">13</div>
                                <div className="mini-calendar-cell">14</div><div className="mini-calendar-cell">15</div><div className="mini-calendar-cell">16</div>
                                <div className="mini-calendar-cell">17</div><div className="mini-calendar-cell">18</div><div className="mini-calendar-cell">19</div>
                                <div className="mini-calendar-cell">20</div><div className="mini-calendar-cell">21</div><div className="mini-calendar-cell">22</div>
                                <div className="mini-calendar-cell">23</div><div className="mini-calendar-cell">24</div><div className="mini-calendar-cell">25</div>
                                <div className="mini-calendar-cell">26</div><div className="mini-calendar-cell">27</div><div className="mini-calendar-cell">28</div>
                                <div className="mini-calendar-cell">29</div><div className="mini-calendar-cell">30</div>
                                <div className="mini-calendar-cell text-gray-400">1</div><div className="mini-calendar-cell text-gray-400">2</div>
                                <div className="mini-calendar-cell text-gray-400">3</div><div className="mini-calendar-cell text-gray-400">4</div>
                                <div className="mini-calendar-cell text-gray-400">5</div><div className="mini-calendar-cell text-gray-400">6</div>
                                <div className="mini-calendar-cell text-gray-400">7</div><div className="mini-calendar-cell text-gray-400">8</div>
                                <div className="mini-calendar-cell text-gray-400">9</div><div className="mini-calendar-cell text-gray-400">10</div>
                                <div className="mini-calendar-cell text-gray-400">11</div>
                            </div>
                        </div>

                        {/* Search People */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-google-gray" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                                </svg>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 border-none bg-google-hover rounded-custom text-sm focus:ring-primary focus:bg-white"
                                placeholder="Search for people"
                                type="text"
                            />
                        </div>

                        {/* Categories Section */}
                        <div className="space-y-4" data-purpose="calendar-categories">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span>Booking pages</span>
                                <svg className="w-4 h-4 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"></path>
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-sm font-medium mb-2">
                                    <span>My calendars</span>
                                    <svg className="w-4 h-4 cursor-pointer rotate-180 transform" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
                                    </svg>
                                </div>
                                <div className="space-y-1 ml-1">
                                    <label className="flex items-center gap-3 py-1 cursor-pointer hover:bg-google-hover rounded px-1">
                                        <input defaultChecked className="rounded border-gray-400 text-primary focus:ring-primary h-4 w-4" type="checkbox" />
                                        <span className="text-xs">Demo Account</span>
                                    </label>
                                    <label className="flex items-center gap-3 py-1 cursor-pointer hover:bg-google-hover rounded px-1">
                                        <input defaultChecked className="rounded border-gray-400 text-green-600 focus:ring-green-600 h-4 w-4" type="checkbox" />
                                        <span className="text-xs">Birthdays</span>
                                    </label>
                                    <label className="flex items-center gap-3 py-1 cursor-pointer hover:bg-google-hover rounded px-1">
                                        <input defaultChecked className="rounded border-gray-400 text-blue-800 focus:ring-blue-800 h-4 w-4" type="checkbox" />
                                        <span className="text-xs">Tasks</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-sm font-medium mb-2">
                                    <span>Other calendars</span>
                                    <div className="flex gap-2">
                                        <svg className="w-4 h-4 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"></path>
                                        </svg>
                                        <svg className="w-4 h-4 cursor-pointer rotate-180 transform" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
                                        </svg>
                                    </div>
                                </div>
                                <label className="flex items-center gap-3 py-1 cursor-pointer hover:bg-google-hover rounded px-1">
                                    <input defaultChecked className="rounded border-gray-400 text-green-700 focus:ring-green-700 h-4 w-4" type="checkbox" />
                                    <span className="text-xs">Holidays in India</span>
                                </label>
                            </div>
                        </div>
                    </aside>

                    {/* Calendar Grid */}
                    <section className="flex-1 overflow-hidden flex flex-col bg-white" data-purpose="calendar-month-view">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 border-b border-google-border flex-shrink-0" data-purpose="grid-headers">
                            <div className="text-center py-2 text-[11px] font-medium text-google-gray border-r border-google-border">SUN<br /><span className="text-xs">31</span></div>
                            <div className="text-center py-2 text-[11px] font-medium text-google-gray border-r border-google-border">MON<br /><span className="text-xs">Jun 1</span></div>
                            <div className="text-center py-2 text-[11px] font-medium text-google-gray border-r border-google-border">TUE<br /><span className="text-xs">2</span></div>
                            <div className="text-center py-2 text-[11px] font-medium text-google-gray border-r border-google-border">WED<br /><span className="text-xs">3</span></div>
                            <div className="text-center py-2 text-[11px] font-medium text-google-gray border-r border-google-border">THU<br /><span className="text-xs">4</span></div>
                            <div className="text-center py-2 text-[11px] font-medium text-google-gray border-r border-google-border">FRI<br /><span className="text-xs">5</span></div>
                            <div className="text-center py-2 text-[11px] font-medium text-google-gray">SAT<br /><span className="text-xs">6</span></div>
                        </div>

                        {/* Main Grid */}
                        <div className="flex-1 grid grid-cols-7 grid-rows-5 calendar-grid" data-purpose="grid-body">
                            {/* Row 1 */}
                            <div className="p-2 relative min-h-[120px]"></div>
                            <div className="p-2 relative min-h-[120px]"></div>
                            <div className="p-2 relative min-h-[120px]"></div>
                            <div className="p-2 relative min-h-[120px]"></div>
                            <div className="p-2 relative min-h-[120px]"></div>
                            <div className="p-2 relative min-h-[120px]"></div>
                            <div className="p-2 relative min-h-[120px] no-border-right"></div>

                            {/* Row 2 */}
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">7</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">8</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">9</span></div>
                            <div className="p-2 relative min-h-[120px]">
                                <span className="text-xs font-medium text-google-text">10</span>
                                <div className="mt-1 flex items-center gap-1 cursor-pointer hover:bg-google-hover rounded px-1 py-0.5">
                                    <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                                    <span className="text-[11px] font-medium">6:30pm meeting</span>
                                </div>
                            </div>
                            <div className="p-2 relative min-h-[120px]">
                                <div className="flex justify-center">
                                    <span className="current-day-circle text-xs font-medium">11</span>
                                </div>
                            </div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">12</span></div>
                            <div className="p-2 relative min-h-[120px] no-border-right"><span className="text-xs font-medium text-google-text">13</span></div>

                            {/* Row 3 */}
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">14</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">15</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">16</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">17</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">18</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">19</span></div>
                            <div className="p-2 relative min-h-[120px] no-border-right"><span className="text-xs font-medium text-google-text">20</span></div>

                            {/* Row 4 */}
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">21</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">22</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">23</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">24</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">25</span></div>
                            <div className="p-2 relative min-h-[120px]">
                                <span className="text-xs font-medium text-google-text">26</span>
                                <div className="event-badge-green mt-1">Muharram/Ashura (tentativ</div>
                            </div>
                            <div className="p-2 relative min-h-[120px] no-border-right"><span className="text-xs font-medium text-google-text">27</span></div>

                            {/* Row 5 */}
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">28</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">29</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-google-text">30</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-gray-400">Jul 1</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-gray-400">2</span></div>
                            <div className="p-2 relative min-h-[120px]"><span className="text-xs font-medium text-gray-400">3</span></div>
                            <div className="p-2 relative min-h-[120px] no-border-right"><span className="text-xs font-medium text-gray-400">4</span></div>
                        </div>
                    </section>
                </main>

                {/* Floating Button Right Bottom */}
                <div className="fixed bottom-4 right-4 bg-white border border-google-border rounded-full p-2 shadow-md cursor-pointer hover:bg-google-hover">
                    <svg className="w-5 h-5 text-google-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </div>
            </div>
        </>
    );
}