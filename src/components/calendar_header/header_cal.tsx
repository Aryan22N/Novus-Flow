// import React from 'react'

// const header = () => {
//     return (
//         <div>  {/* ── Top Header ── */}
//             <header className="h-16 border-b border-[#dadce0] flex items-center justify-between px-4 flex-shrink-0">
//                 <div className="flex items-center ">
//                     <button
//                         className="pl-2 hover:bg-[#f1f3f4] rounded-full transition-colors"
//                         onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//                     >
//                         <svg className="w-6 h-6 text-[#3c4043]" focusable="false" viewBox="0 0 24 24">
//                             <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
//                         </svg>
//                     </button>
//                     <Link href="/inbox">
//                         <img
//                             src="/Nexus_Flow_logo.png"
//                             alt="Logo"
//                             className="w-32 h-auto  object-contain select-none"
//                         />
//                     </Link>

//                     <div className="flex items-center gap-2 ml-6">
//                         <button
//                             onClick={goToday}
//                             className="px-4 py-1.5 border border-[#dadce0] rounded-lg text-sm font-medium text-[#3c4043] hover:bg-[#f1f3f4] transition-colors"
//                         >
//                             Today
//                         </button>
//                         <button onClick={prevMonth} className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors">
//                             <ChevronLeft size={18} className="text-[#3c4043]" />
//                         </button>
//                         <button onClick={nextMonth} className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors">
//                             <ChevronRight size={18} className="text-[#3c4043]" />
//                         </button>
//                         <h1 className="text-[22px] text-[#3c4043] font-normal ml-2">
//                             {MONTHS[month - 1]} {year}
//                         </h1>
//                     </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                     {/* Sync button */}
//                     <button
//                         onClick={() => syncMutation.mutate({ daysAhead: 90 })}
//                         disabled={isBusy}
//                         title="Sync from Google Calendar"
//                         className="flex items-center gap-1.5 px-3 py-1.5 border border-[#dadce0] rounded-lg text-sm text-[#3c4043] hover:bg-[#f1f3f4] transition-colors disabled:opacity-50"
//                     >
//                         {isBusy
//                             ? <Loader2 size={15} className="animate-spin" />
//                             : <RefreshCw size={15} />
//                         }
//                         {isBusy ? "Syncing…" : "Sync"}
//                     </button>
//                 </div>
//             </header></div>
//     )
// }

// export default header