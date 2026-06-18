"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  PlayCircle,
  Check,
  Mail,
  CalendarDays,
  Sparkles,
  Mic,
  Brain,
  PenTool,
  CheckCircle,
  CalendarClock,
  Search,
  Inbox,
  Send,
  Plug,
  CalendarCheck,
  Cpu,
  Zap,
  ChevronRight,
} from "lucide-react";
import { AuroraBackground, Particles } from "./Background";

/* ============ HERO ============ */
function MacFrame() {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-[22px] bg-gradient-to-b from-[#2a2d33] to-[#0f1115] p-2.5 shadow-float"
      >
        <div className="flex items-center gap-1.5 px-2 pb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="mx-auto rounded-md bg-white/5 px-3 py-1 text-[10px] font-mono text-white/60">
            app.novusflow.ai
          </div>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-[#0c1220]">
          <FakeAppUI />
        </div>
      </motion.div>
      <div className="mx-auto h-2 w-[88%] rounded-b-xl bg-gradient-to-b from-[#1a1c20] to-[#0a0b0e]" />
      <div className="mx-auto h-1 w-[40%] rounded-b-md bg-black/30" />

      {/* floating chips */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute -left-6 top-10 hidden glass rounded-2xl px-3 py-2 text-xs font-medium md:flex items-center gap-2"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ai">
          <Sparkles className="h-3.5 w-3.5 text-[#4648D4]" />
        </span>
        AI summary ready
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute -right-4 top-28 hidden glass rounded-2xl px-3 py-2 text-xs font-medium md:flex items-center gap-2"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ai">
          <Mic className="h-3.5 w-3.5 text-[#1A73E8]" />
        </span>
        "Nova, draft reply"
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute -left-4 bottom-10 hidden glass rounded-2xl px-3 py-2 text-xs font-medium md:flex items-center gap-2"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ai">
          <CalendarCheck className="h-3.5 w-3.5 text-[#005BBF]" />
        </span>
        Meeting scheduled · 3pm
      </motion.div>
    </div>
  );
}

function FakeAppUI() {
  const emails = [
    { from: "Amazon Recruiting", subj: "Final round — interview details", time: "9:42", tag: "Priority", color: "bg-[#1A73E8]" },
    { from: "Prof. Martinez", subj: "Re: Capstone milestone review", time: "9:08", tag: "Academic", color: "bg-[#6063EE]" },
    { from: "Linear", subj: "3 new comments in NXS-214", time: "8:30", tag: "Work", color: "bg-[#4648D4]" },
    { from: "Stripe", subj: "Your November payout is on its way", time: "Yesterday", tag: "Finance", color: "bg-[#005BBF]" },
  ];
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[180px_1fr_240px] text-[11px] text-white/85">
      {/* sidebar */}
      <div className="hidden border-r border-white/5 bg-white/[0.02] p-3 md:block">
        <div className="flex items-center gap-2 px-1 pb-3">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-cta">
            <Sparkles className="h-3 w-3 text-white" />
          </span>
          <span className="text-[12px] font-semibold">Novus</span>
        </div>
        <div className="space-y-0.5">
          {[
            { i: <Inbox className="h-3 w-3" />, t: "Inbox", n: 12, on: true },
            { i: <Sparkles className="h-3 w-3" />, t: "AI Threads", n: 4 },
            { i: <Send className="h-3 w-3" />, t: "Sent" },
            { i: <CalendarDays className="h-3 w-3" />, t: "Calendar" },
            { i: <Mic className="h-3 w-3" />, t: "Nova Voice" },
          ].map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 ${r.on ? "bg-white/10 text-white" : "text-white/65"
                }`}
            >
              <span className="flex items-center gap-2">
                {r.i}
                {r.t}
              </span>
              {r.n ? <span className="text-[9px] text-white/50">{r.n}</span> : null}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-ai p-2 text-[10px] text-[#1c2541]">
          <div className="font-semibold">Nova suggests</div>
          <div className="opacity-70">Reply to Amazon recruiter</div>
        </div>
      </div>

      {/* list */}
      <div className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 flex-1 items-center gap-2 rounded-md bg-white/[0.06] px-2 text-white/60">
            <Search className="h-3 w-3" />
            <span>Search inbox semantically…</span>
          </div>
          <span className="rounded-md bg-[#1A73E8]/20 px-1.5 py-0.5 text-[9px] text-[#9DC2FF]">⌘K</span>
        </div>
        <div className="space-y-1">
          {emails.map((e, i) => (
            <div
              key={i}
              className={`rounded-md px-2 py-2 ${i === 0 ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <span className={`h-1.5 w-1.5 rounded-full ${e.color}`} />
                  {e.from}
                </span>
                <span className="text-[9px] text-white/45">{e.time}</span>
              </div>
              <div className="truncate text-white/65">{e.subj}</div>
              <span className="mt-1 inline-block rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/55">
                {e.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ai panel */}
      <div className="hidden border-l border-white/5 bg-gradient-to-b from-[#1A73E8]/[0.10] to-[#6063EE]/[0.08] p-3 md:block">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-white/90">
          <Sparkles className="h-3 w-3 text-[#9DC2FF]" /> Nexus AI
        </div>
        <div className="rounded-lg bg-white/[0.06] p-2 text-[10px] leading-relaxed text-white/85">
          <div className="mb-1 font-semibold text-white">Thread summary</div>
          Amazon recruiter confirmed your <b>onsite for Tue 2pm</b>. Includes system design + behavioral. Two follow-ups needed.
        </div>
        <div className="mt-2 space-y-1">
          {["Draft reply", "Add to calendar", "Mark as priority"].map((a) => (
            <button key={a} className="flex w-full items-center justify-between rounded-md bg-white/[0.05] px-2 py-1.5 text-left text-white/80 hover:bg-white/[0.1]">
              {a} <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-white/[0.06] p-2 text-[10px] text-white/75">
          <div className="mb-1 flex items-center gap-1.5 text-white">
            <Mic className="h-3 w-3 text-[#9DC2FF]" /> Nova listening…
          </div>
          <div className="flex h-5 items-end gap-0.5">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-gradient-to-t from-[#1A73E8] to-[#6063EE]"
                suppressHydrationWarning
                style={{
                  height: `${20 + Math.abs(Math.sin(i * 0.9)) * 80}%`,
                  animation: `float-y ${1 + (i % 5) * 0.2}s ease-in-out ${i * 0.05}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (session) {
      router.push("/inbox");
      return;
    }
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboarding",
    });
  };

  return (
    <section className="relative pb-24 pt-32 md:pb-32">
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <div>


          {/* <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px] lg:text-[72px] font-[family-name:var(--font-plus-jakarta-sans)]"
          >
            Manage Email, Calendar with{" "}
            <span className="text-gradient">AI</span> in One Place.
          </motion.h1> */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-[43px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px] lg:text-[69px] font-[family-name:var(--font-plus-jakarta-sans)]"
          >
            Every Opportunity Starts
            <br />
            With an <span className="text-gradient">Email.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink-soft"
          >
            Leads, meetings, follow-ups, and important conversations all start in your inbox.
            Nexus Flow ensures nothing slips through the cracks.
          </motion.p>


          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft"
          >
            Manage emails, schedule meetings, draft replies, and get AI assistance from one intelligent workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              onClick={handleSignIn}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-cta px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_-12px_rgba(70,72,212,0.7)] transition hover:shadow-[0_20px_50px_-12px_rgba(70,72,212,0.85)]"
            >
              {session ? "Go to Inbox" : "Get Started"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm font-semibold text-ink hover:bg-white"
            >
              <PlayCircle className="h-4.5 w-4.5 text-[#1A73E8]" />
              Watch Demo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-soft"
          >
            {["Gmail Sync", "Google Calendar", "AI Assistant", "Voice Control"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#1A73E8]" /> {t}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-10 -z-10 rounded-[40px] bg-ai blur-2xl opacity-70" />
          <MacFrame />
        </motion.div>
      </div>
    </section>
  );
}

/* ============ PROBLEM ============ */
export function Problem() {
  const apps = [
    { name: "Gmail", c: "#EA4335" },
    { name: "Calendar", c: "#1A73E8" },
    { name: "ChatGPT", c: "#10A37F" },
    { name: "Notes", c: "#F5A623" },
    { name: "Tasks", c: "#6063EE" },
  ];
  return (
    <section className="relative py-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-[44px]">
            Stop switching between five different apps.
          </h2>
          <p className="mt-4 text-[17px] text-ink-soft">Modern work is fragmented. Novus Flow brings it back together.</p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          <div className="relative mx-auto h-[420px] w-full max-w-[450px]">
            {apps.map((a, i) => {
              const positions = [
                "left-[2%] top-[4%]",
                "right-[6%] top-[0%]",
                "left-[12%] top-[38%]",
                "right-[2%] top-[42%]",
                "left-[33%] bottom-[2%]",
              ];
              return (
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`absolute ${positions[i]} glass rounded-2xl px-4 py-3 z-10`}
                  suppressHydrationWarning
                  style={{ animation: `float-y ${5 + i}s ease-in-out ${i * 0.4}s infinite` }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: a.c }}>
                      <Mail className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-ink">{a.name}</div>
                      <div className="text-[11px] text-ink-soft">Disconnected</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 420" preserveAspectRatio="none" fill="none">
              <defs>
                <linearGradient id="cline" x1="0" x2="1">
                  <stop offset="0" stopColor="#1A73E8" stopOpacity="0.0" />
                  <stop offset="0.5" stopColor="#6063EE" stopOpacity="0.6" />
                  <stop offset="1" stopColor="#1A73E8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {[
                "M60 60 C 150 120, 250 80, 320 60",
                "M80 220 C 180 180, 260 260, 320 240",
                "M170 380 C 220 320, 120 280, 70 240",
              ].map((d, i) => (
                <path key={i} d={d} stroke="url(#cline)" strokeWidth="1.5" strokeDasharray="4 6" />
              ))}
            </svg>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[36px] bg-ai blur-2xl opacity-70" />
            <div className="glass-strong rounded-3xl p-6">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-cta text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink">Novus Flow workspace</div>
                  <div className="text-[12px] text-ink-soft">One context. Everything connected.</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { i: Mail, t: "Inbox" },
                  { i: CalendarDays, t: "Calendar" },
                  { i: Sparkles, t: "AI Threads" },
                  { i: Mic, t: "Nova" },
                ].map((c, i) => (
                  <div key={i} className="rounded-2xl bg-white/70 dark:bg-slate-800/50 p-3 ring-1 ring-black/[0.04] dark:ring-white/[0.05] transition-colors">
                    <c.i className="h-4 w-4 text-[#1A73E8]" />
                    <div className="mt-2 text-sm font-semibold text-ink">{c.t}</div>
                    <div className="text-[11px] text-ink-soft">Unified · live</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-ai p-4 transition-colors">
                <div className="text-[12px] font-semibold text-[#1c2541] dark:text-blue-300">Nova just now</div>
                <div className="text-[13px] text-[#1c2541]/80 dark:text-blue-200/80">Summarized 12 emails, scheduled 2 meetings, drafted 1 reply.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ PRODUCT OVERVIEW ============ */
const overview = [
  {
    icon: Mail,
    title: "AI Inbox",
    features: ["Gmail Sync", "Priority Inbox", "Smart Categorization", "Unified Threads"],
  },
  {
    icon: CalendarDays,
    title: "Smart Calendar",
    features: ["Event Management", "Meeting Detection", "Calendar Sync", "Scheduling"],
  },
  {
    icon: Sparkles,
    title: "Novus Assistant",
    features: ["Thread Analysis", "Draft Generation", "Summaries", "Task Extraction"],
  },
  {
    icon: Mic,
    title: "Nova Voice",
    features: ["Voice Commands", "Inbox Navigation", "Meeting Creation", "Email Drafting"],
  },
];
// export function Overview() {
//   return (
//     // <section id="features" className="relative py-28">
//     //   <div className="mx-auto max-w-7xl px-6">
//     //     <div className="mx-auto max-w-2xl text-center">
//     //       <span className="rounded-full bg-ai px-3 py-1 text-[12px] font-medium text-[#1c2541]">Product</span>
//     //       <h2 className="mt-4 text-[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[44px]">
//     //         Everything you need. <span className="text-gradient">One workspace.</span>
//     //       </h2>
//     //     </div>

//     //     <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
//     //       {overview.map((c, i) => (
//     //         <motion.div
//     //           key={c.title}
//     //           initial={{ opacity: 0, y: 20 }}
//     //           whileInView={{ opacity: 1, y: 0 }}
//     //           viewport={{ once: true, margin: "-80px" }}
//     //           transition={{ delay: i * 0.06 }}
//     //           whileHover={{ scale: 1.03 }}
//     //           className="group relative overflow-hidden rounded-3xl glass p-6 transition hover:ring-glow"
//     //         >
//     //           <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ai opacity-60 blur-2xl transition group-hover:opacity-100" />
//     //           <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-cta text-white shadow-[0_10px_30px_-10px_rgba(26,115,232,0.6)]">
//     //             <c.icon className="h-5 w-5" />
//     //           </span>
//     //           <h3 className="relative mt-5 text-[18px] font-semibold text-ink">{c.title}</h3>
//     //           <ul className="relative mt-3 space-y-1.5 text-[13.5px] text-ink-soft">
//     //             {c.features.map((f) => (
//     //               <li key={f} className="flex items-center gap-2">
//     //                 <Check className="h-3.5 w-3.5 text-[#1A73E8]" /> {f}
//     //               </li>
//     //             ))}
//     //           </ul>
//     //         </motion.div>
//     //       ))}
//     //     </div>
//     //   </div>
//     // </section>
//     <section id="features" className="relative overflow-hidden bg-slate-50 py-24 sm:py-32">
//       {/* Subtle Background Glow */}
//       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-50"></div>

//       <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
//         <div className="mx-auto max-w-2xl text-center">
//           <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600 shadow-sm">
//             Product Features
//           </span>
//           <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
//             Everything you need.{" "}
//             <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
//               One workspace.
//             </span>
//           </h2>
//         </div>

//         <div className="mx-auto mt-16 max-w-7xl">
//           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
//             {overview.map((c, i) => (
//               <motion.div
//                 key={c.title}
//                 initial={{ opacity: 0, y: 30 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true, margin: "-100px" }}
//                 transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
//                 whileHover={{ y: -5 }}
//                 className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
//               >
//                 {/* Decorative Corner Glow on Hover */}
//                 <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl transition-opacity duration-500 group-hover:bg-blue-500/20" />

//                 {/* Modern Icon Container */}
//                 <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100/50 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
//                   <c.icon className="h-6 w-6" />
//                 </div>

//                 <h3 className="mb-3 text-lg font-bold text-slate-900">{c.title}</h3>

//                 {/* Feature List */}
//                 <ul className="mt-auto flex flex-col gap-3">
//                   {c.features.map((f) => (
//                     <li key={f} className="flex items-start text-sm text-slate-600">
//                       <span className="mr-3 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
//                         <Check className="h-3 w-3" strokeWidth={3} />
//                       </span>
//                       {f}
//                     </li>
//                   ))}
//                 </ul>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
export function Overview() {
  // Helper to create the asymmetrical bento pattern
  const getSpanClass = (index: number) => {
    // Top row: Wide (2), Square (1)
    // Bottom row: Square (1), Wide (2)
    if (index === 0) return "md:col-span-2 lg:col-span-2";
    if (index === 1) return "md:col-span-2 lg:col-span-1";
    if (index === 2) return "md:col-span-2 lg:col-span-1";
    if (index === 3) return "md:col-span-2 lg:col-span-2";
    return "col-span-1";
  };

  return (
    <section id="features" className="relative overflow-hidden bg-[#f8fafc] dark:bg-transparent py-24 sm:py-32 transition-colors duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 dark:from-blue-900/20 via-[#f8fafc] dark:via-transparent to-[#f8fafc] dark:to-transparent"></div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-4 py-1.5 text-sm font-semibold text-slate-900 dark:text-white shadow-sm">
            Never Miss an Opportunity
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Everything you need.{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              One workspace.
            </span>
          </h2>
        </div>

        <div className="mx-auto mt-20 max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {overview.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-8 sm:p-10 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 ${getSpanClass(i)}`}
              >
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-50/50 dark:from-blue-900/20 to-indigo-50/50 dark:to-indigo-900/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className={`relative z-10 flex h-full flex-col ${i === 0 || i === 3 ? "lg:flex-row lg:gap-10" : ""}`}>

                  <div className="flex flex-1 flex-col">
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-100 dark:ring-slate-700">
                      <c.icon className="h-5 w-5" strokeWidth={2.5} />
                    </div>

                    <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">{c.title}</h3>

                    <ul className="mt-auto flex flex-col gap-3 pt-6">
                      {c.features.map((f) => (
                        <li key={f} className="flex items-start text-sm text-slate-600 dark:text-slate-300">
                          <span className="mr-3 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual Asset for Wide Cards */}
                  {(i === 0 || i === 3) && (
                    <div className="relative mt-8 hidden flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 lg:mt-0 lg:flex overflow-hidden shadow-inner">

                      {/* Subtle gradient overlay to make labels pop */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent z-10 pointer-events-none" />

                      {i === 0 && (
                        <>
                          <img
                            src="/inbox_novus.png"
                            alt="Inbox Novus"
                            className="h-full w-full object-cover object-left-top transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          {/* Overlay Label */}
                          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-md ring-1 ring-black/5">
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            Inbox Synced
                          </div>
                        </>
                      )}

                      {i === 3 && (
                        <>
                          <img
                            src="/voice_nova.png"
                            alt="Voice Nova"
                            className="h-full w-full object-cover object-left-top transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          {/* Overlay Label */}
                          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-md ring-1 ring-black/5">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                            Voice AI Active
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ NOVA VOICE ============ */
export function Nova() {
  const messages = [
    { who: "user", text: "Nova, summarize today's emails." },
    {
      who: "nova",
      text: "You have three important emails. One from Amazon Recruiting, one from your professor, and one meeting request.",
    },
    { who: "user", text: "Draft a reply to Amazon." },
    { who: "nova", text: "Draft ready. Would you like me to send it?" },
  ];
  return (
    <section id="nova" className="relative py-28">
      <div className="absolute inset-0 bg-ai" />
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]">
        <Particles count={16} />
      </div>
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full glass px-3 py-1 text-[12px] font-medium text-ink-soft">Nova Voice</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-[48px]">
            Talk to your <span className="text-gradient">inbox.</span>
          </h2>
          <p className="mt-4 text-[17px] text-ink-soft">
            Use natural language to search emails, summarize conversations, create meetings, and send replies.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          <div className="relative flex h-[300px] items-center justify-center md:h-[420px]">
            <span className="absolute h-56 w-56 rounded-full border border-[#1A73E8]/30 animate-pulse-ring" />
            <span className="absolute h-56 w-56 rounded-full border border-[#6063EE]/30 animate-pulse-ring" style={{ animationDelay: "0.8s" }} />
            <span className="absolute h-56 w-56 rounded-full border border-[#1A73E8]/30 animate-pulse-ring" style={{ animationDelay: "1.6s" }} />

            <div className="relative grid h-32 w-32 place-items-center rounded-full bg-cta text-white shadow-[0_30px_80px_-20px_rgba(70,72,212,0.7)]">
              <Mic className="h-12 w-12" strokeWidth={2.2} />
            </div>

            <div className="absolute bottom-6 left-1/2 flex h-14 -translate-x-1/2 items-end gap-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-[#1A73E8] to-[#6063EE]"
                  suppressHydrationWarning
                  style={{
                    height: `${20 + Math.abs(Math.sin(i * 0.6)) * 100}%`,
                    animation: `float-y ${0.8 + (i % 6) * 0.15}s ease-in-out ${i * 0.04}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`flex ${m.who === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] ${m.who === "user"
                    ? "bg-cta text-white rounded-br-md"
                    : "glass-strong text-ink rounded-bl-md"
                    }`}
                >
                  {m.who === "nova" && (
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-gradient">
                      <Sparkles className="h-3 w-3" /> Nova
                    </div>
                  )}
                  {m.text}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ AI CAPABILITIES ============ */
const caps = [
  { i: Brain, t: "Thread Analysis", d: "Understands long email threads and surfaces what matters." },
  { i: PenTool, t: "Smart Replies", d: "Adaptive drafts in your tone, ready to send." },
  { i: CheckCircle, t: "Task Extraction", d: "Pulls action items out of every conversation." },
  { i: CalendarClock, t: "Meeting Detection", d: "Spots scheduling intent and proposes times." },
  { i: Sparkles, t: "Adaptive Learning", d: "Gets sharper as it learns your workflows." },
  { i: Search, t: "Semantic Search", d: "Find anything by meaning — not just keywords." },
];


/* ============ HOW IT WORKS ============ */
// const steps = [
//   { i: Plug, t: "Connect Gmail", d: "Secure OAuth. Your mail stays yours." },
//   { i: CalendarDays, t: "Connect Google Calendar", d: "Two-way sync, instantly." },
//   { i: Cpu, t: "AI understands context", d: "Nexus learns your people, projects, priorities." },
//   { i: Zap, t: "Work faster with Nova", d: "Voice or keyboard. Inbox-zero on autopilot." },
// ];
// export function Timeline() {
//   return (
//     <section className="relative overflow-hidden bg-white py-24 sm:py-32">
//       {/* Subtle grid background for a tech-focused feel */}
//       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

//       <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
//         {/* Header */}
//         <div className="mx-auto max-w-2xl text-center">
//           <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600 shadow-sm">
//             The Process
//           </span>
//           <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
//             How Nexus works.
//           </h2>
//           <p className="mt-4 text-lg text-slate-500">
//             Get up and running in minutes with our simple, streamlined workflow.
//           </p>
//         </div>

//         {/* Timeline Container */}
//         <div className="relative mt-20">
//           {/* Central Line (Left-aligned on mobile, centered on desktop) */}
//           <div className="absolute bottom-4 left-[23px] top-4 w-0.5 bg-gradient-to-b from-transparent via-slate-200 to-transparent md:left-1/2 md:-ml-[1px]" />

//           <div className="space-y-12 md:space-y-8">
//             {steps.map((s, i) => {
//               const isEven = i % 2 === 0;

//               return (
//                 <motion.div
//                   key={s.t}
//                   initial={{ opacity: 0, y: 20 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   viewport={{ once: true, margin: "-100px" }}
//                   transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
//                   className="relative flex flex-col md:flex-row md:items-center"
//                 >
//                   {/* Icon Indicator */}
//                   <div className="absolute left-0 top-4 flex h-12 w-12 items-center justify-center md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
//                     <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-white transition-transform duration-300 hover:scale-110">
//                       <s.i className="h-6 w-6" strokeWidth={2} />
//                       {/* Pulse effect */}
//                       <span className="absolute inset-0 rounded-2xl ring-2 ring-blue-600/20 animate-[ping_3s_ease-in-out_infinite]" />
//                     </span>
//                   </div>

//                   {/* Content Card */}
//                   <div
//                     className={`w-full md:w-1/2 ${isEven
//                       ? "pl-20 md:pl-0 md:pr-16 md:text-right"
//                       : "pl-20 md:ml-auto md:pl-16"
//                       }`}
//                   >
//                     <div className="group relative rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-100 hover:shadow-md sm:p-8">
//                       <div className="mb-2 font-mono text-xs font-bold tracking-widest text-blue-600 uppercase">
//                         Step 0{i + 1}
//                       </div>
//                       <h3 className="mb-3 text-xl font-bold text-slate-900">
//                         {s.t}
//                       </h3>
//                       <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
//                         {s.d}
//                       </p>
//                     </div>
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }


/* ============ HOW IT WORKS ============ */
const steps = [
  { i: Plug, t: "Connect Gmail", d: "Secure OAuth. Your mail stays yours." },
  { i: CalendarDays, t: "Connect Google Calendar", d: "Two-way sync, instantly." },
  { i: Cpu, t: "AI understands context", d: "Novus learns your people, projects, priorities." },
  { i: Zap, t: "Work faster with Nova", d: "Voice or keyboard. Inbox-zero on autopilot." },
];

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-transparent py-24 sm:py-32 transition-colors duration-500">
      {/* Interactive Aurora & Grid Background */}
      <AuroraBackground />
      <Particles count={15} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 shadow-sm">
            The Process
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            How Novus works.
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            Get up and running in minutes with our simple, streamlined workflow.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative mt-20">
          {/* Central Line (Left-aligned on mobile, centered on desktop) */}
          <div className="absolute bottom-4 left-[23px] top-4 w-0.5 bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-800 to-transparent md:left-1/2 md:-ml-[1px]" />

          <div className="space-y-12 md:space-y-8">
            {steps.map((s, i) => {
              const isEven = i % 2 === 0;

              return (
                <motion.div
                  key={s.t}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                  className="relative flex flex-col md:flex-row md:items-center"
                >
                  {/* Icon Indicator */}
                  <div className="absolute left-0 top-4 flex h-12 w-12 items-center justify-center md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-600/30 dark:shadow-blue-500/20 ring-4 ring-white dark:ring-[#0B0F19] transition-transform duration-300 hover:scale-110">
                      <s.i className="h-6 w-6" strokeWidth={2} />
                      {/* Pulse effect */}
                      <span className="absolute inset-0 rounded-2xl ring-2 ring-blue-600/20 dark:ring-blue-500/20 animate-[ping_3s_ease-in-out_infinite]" />
                    </span>
                  </div>

                  {/* Content Card */}
                  <div
                    className={`w-full md:w-1/2 ${isEven
                      ? "pl-20 md:pl-0 md:pr-16 md:text-right"
                      : "pl-20 md:ml-auto md:pl-16"
                      }`}
                  >
                    <div className="group relative rounded-3xl border border-slate-100 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-blue-100 dark:hover:border-white/20 hover:shadow-md dark:hover:shadow-black/50 sm:p-8">
                      <div className="mb-2 font-mono text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                        Step 0{i + 1}
                      </div>
                      <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                        {s.t}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                        {s.d}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}














/* ============ SCREENSHOTS DATA ============ */
const shots = [
  { t: "Inbox", sub: "Priority + categorized", video: "/Nova_inbox_assisst_vid.mp4" },
  { t: "Email Thread", sub: "With AI summary", video: "/Nova_summary_vid.mp4" },
  { t: "Assistant Panel", sub: "Draft · summarize · extract", video: "/Nova_assistent_vid.mp4" },
  { t: "Calendar", sub: "Two-way Google sync", video: "/Nova_calendar_vid.mp4" },
  { t: "Voice Interface", sub: "Nova listening", video: "/Nova_voice_vid.mp4" },
];

/* Minimal Wireframe Placeholder for the UI */
const ScreenshotsFakeUI = () => (
  <div className="flex h-full w-full flex-col bg-slate-50/50">
    {/* Browser/Window Top Bar */}
    <div className="flex h-10 items-center border-b border-slate-200/60 bg-white/50 px-4 backdrop-blur-md">
      <div className="flex gap-2">
        <div className="h-3 w-3 rounded-full bg-slate-200" />
        <div className="h-3 w-3 rounded-full bg-slate-200" />
        <div className="h-3 w-3 rounded-full bg-slate-200" />
      </div>
    </div>
    {/* Dashboard Body */}
    <div className="flex flex-1 gap-4 p-4">
      {/* Sidebar */}
      <div className="w-1/4 rounded-xl border border-slate-100 bg-white/50 shadow-sm" />
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-12 w-full rounded-xl border border-slate-100 bg-white shadow-sm" />
        <div className="flex-1 rounded-xl border border-slate-100 bg-white shadow-sm" />
      </div>
    </div>
  </div>
);

export function Screenshots() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Moving by -35% shifts it by roughly two cards, leaving 3, 4, and 5 fully visible on large screens!
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);

  return (
    <div ref={targetRef} className="relative h-[200vh] bg-white dark:bg-transparent transition-colors duration-500">
      <section id="demo" className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-white dark:bg-transparent transition-colors duration-500">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 left-1/2 -ml-[50vw] h-1/2 w-screen bg-gradient-to-b from-slate-50 dark:from-slate-900/20 to-white dark:to-transparent pointer-events-none" />

        <div className="relative mx-auto w-full max-w-7xl shrink-0 px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Designed for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                modern work.
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              A seamless interface that adapts to your workflow, not the other way around.
            </p>
          </div>
        </div>

        {/* Scrolling Carousel Area */}
        <div className="relative mt-16 flex w-full shrink-0 items-center overflow-hidden">
          <motion.div style={{ x }} className="flex w-max gap-4 px-4 sm:gap-6 sm:px-6 lg:px-[10vw]">
            {shots.map((s, i) => (
              <div
                key={s.t}
                className="group relative w-[85vw] max-w-[460px] shrink-0 sm:w-[460px]"
              >
                {/* Card Container */}
                <div className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-black/50">
                  {/* Image / Mockup Area */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 ring-1 ring-inset ring-slate-900/5 dark:ring-white/10">
                    {s.video ? (
                      <video
                        src={s.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover object-left-top"
                      />
                    ) : (
                      <ScreenshotsFakeUI />
                    )}
                    {/* Subtle inner overlay for gloss effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/5 dark:from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  {/* Meta details */}
                  <div className="mt-4 flex items-center justify-between px-3 pb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.t}</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.sub}</p>
                    </div>

                    {/* Index Pill */}
                    <span className="flex h-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-100 dark:ring-blue-800 transition-colors group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600 dark:group-hover:ring-blue-500">
                      0{i + 1}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {/* End spacer to create breathing room after the last card */}
            <div className="w-[10vw] shrink-0" />
          </motion.div>
        </div>
      </section>
    </div>
  );
}




export function CTA() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (session) {
      router.push("/inbox");
      return;
    }
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboarding",
    });
  };

  return (
    <section id="cta" className="relative px-6 py-24 sm:py-32 bg-slate-50 dark:bg-transparent transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-10 text-center shadow-xl shadow-blue-900/5 dark:shadow-black/50 sm:rounded-[3rem] sm:p-16"
      >
        {/* Soft, Light Background Glow - No dark/violet colors */}
        <div className="absolute inset-0 pointer-events-none opacity-80" style={{ background: "radial-gradient(ellipse at bottom, var(--color-blue-400), transparent 70%)" }} />

        {/* Content */}
        <div className="relative z-10">


          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Ready to work smarter?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500 dark:text-slate-300">
            Join the future of email, calendar, and AI productivity. Experience the workspace that adapts to your rhythm.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
            <button
              onClick={handleSignIn}
              className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 sm:w-auto"
            >
              {session ? "Go to Inbox" : "Get Started"}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <a
              href="#demo"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-800 px-8 py-3.5 text-sm font-bold text-slate-700 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-700 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-700 sm:w-auto"
            >
              <PlayCircle className="h-4 w-4 text-slate-400 dark:text-slate-300 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              Watch Demo
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ============ FOOTER ============ */
export function Footer() {
  const cols = [
    { h: "Product", l: ["Features", "AI Assistant", "Nova Voice", "Calendar"] },
    { h: "Resources", l: ["Documentation", "API", "GitHub"] },
    { h: "Company", l: ["About", "Contact"] },
  ];
  return (
    <footer className="border-t border-black/[0.06] dark:border-white/[0.06] bg-white/60 dark:bg-transparent px-6 py-14 transition-colors duration-500">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">

            <span className="text-[15px] font-semibold text-ink">
              Novus<span className="text-gradient"> Flow</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] text-ink-soft">
            The intelligent workspace for email, calendar, and AI. Built with AI-powered productivity at its core.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">{c.h}</div>
            <ul className="mt-4 space-y-2 text-[13.5px] text-ink-soft">
              {c.l.map((x) => (
                <li key={x}><a className="hover:text-ink" href="#">{x}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-6 text-[12px] text-ink-soft">
        <div>© 2026 Novus Flow</div>
        <div>Built with AI-powered productivity at its core.</div>
      </div>
    </footer>
  );
}
