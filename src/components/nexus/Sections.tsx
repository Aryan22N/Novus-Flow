"use client";
import { motion } from "framer-motion";
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
    <div className="grid h-full grid-cols-[180px_1fr_240px] text-[11px] text-white/85">
      {/* sidebar */}
      <div className="border-r border-white/5 bg-white/[0.02] p-3">
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
      <div className="border-l border-white/5 bg-gradient-to-b from-[#1A73E8]/[0.10] to-[#6063EE]/[0.08] p-3">
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
    <section className="relative pt-32 pb-24">
      <AuroraBackground />
      <Particles count={22} />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <div>


          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px] lg:text-[72px] font-[family-name:var(--font-plus-jakarta-sans)]"
          >
            Manage Email, Calendar, and{" "}
            <span className="text-gradient">AI</span> in One Place.
          </motion.h1>



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
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[44px]">
            Stop switching between five different apps.
          </h2>
          <p className="mt-4 text-[17px] text-ink-soft">Modern work is fragmented. Nexus Flow brings it back together.</p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          <div className="relative h-[420px]">
            {apps.map((a, i) => {
              const positions = [
                "left-2 top-4",
                "right-6 top-0",
                "left-16 top-40",
                "right-2 top-44",
                "left-1/3 bottom-2",
              ];
              return (
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`absolute ${positions[i]} glass rounded-2xl px-4 py-3`}
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
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 420" fill="none">
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
                  <div className="text-sm font-semibold text-ink">Nexus Flow workspace</div>
                  <div className="text-[12px] text-ink-soft">One context. Everything connected.</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { i: Mail, t: "Inbox" },
                  { i: CalendarDays, t: "Calendar" },
                  { i: Sparkles, t: "AI Threads" },
                  { i: Mic, t: "Nova" },
                ].map((c, i) => (
                  <div key={i} className="rounded-2xl bg-white/70 p-3 ring-1 ring-black/[0.04]">
                    <c.i className="h-4 w-4 text-[#1A73E8]" />
                    <div className="mt-2 text-sm font-semibold text-ink">{c.t}</div>
                    <div className="text-[11px] text-ink-soft">Unified · live</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-ai p-4">
                <div className="text-[12px] font-semibold text-[#1c2541]">Nova just now</div>
                <div className="text-[13px] text-[#1c2541]/80">Summarized 12 emails, scheduled 2 meetings, drafted 1 reply.</div>
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
    title: "Nexus Assistant",
    features: ["Thread Analysis", "Draft Generation", "Summaries", "Task Extraction"],
  },
  {
    icon: Mic,
    title: "Nova Voice",
    features: ["Voice Commands", "Inbox Navigation", "Meeting Creation", "Email Drafting"],
  },
];
export function Overview() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-ai px-3 py-1 text-[12px] font-medium text-[#1c2541]">Product</span>
          <h2 className="mt-4 text-[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[44px]">
            Everything you need. <span className="text-gradient">One workspace.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {overview.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.03 }}
              className="group relative overflow-hidden rounded-3xl glass p-6 transition hover:ring-glow"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ai opacity-60 blur-2xl transition group-hover:opacity-100" />
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-cta text-white shadow-[0_10px_30px_-10px_rgba(26,115,232,0.6)]">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-5 text-[18px] font-semibold text-ink">{c.title}</h3>
              <ul className="relative mt-3 space-y-1.5 text-[13.5px] text-ink-soft">
                {c.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#1A73E8]" /> {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
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
          <h2 className="mt-4 text-[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[48px]">
            Talk to your <span className="text-gradient">inbox.</span>
          </h2>
          <p className="mt-4 text-[17px] text-ink-soft">
            Use natural language to search emails, summarize conversations, create meetings, and send replies.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          <div className="relative flex h-[420px] items-center justify-center">
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
export function Capabilities() {
  return (
    <section id="assistant" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[44px]">
            Powered by <span className="text-gradient">Nexus Intelligence.</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {caps.map((c, i) => (
            <motion.div
              key={c.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.03 }}
              className="group relative overflow-hidden rounded-3xl glass p-6 transition hover:ring-glow"
            >
              <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-ai opacity-60 blur-2xl transition group-hover:opacity-100" />
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-ai">
                <c.i className="h-5 w-5 text-[#4648D4]" />
              </span>
              <h3 className="relative mt-5 text-[17px] font-semibold text-ink">{c.t}</h3>
              <p className="relative mt-2 text-[13.5px] leading-relaxed text-ink-soft">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ HOW IT WORKS ============ */
const steps = [
  { i: Plug, t: "Connect Gmail", d: "Secure OAuth. Your mail stays yours." },
  { i: CalendarDays, t: "Connect Google Calendar", d: "Two-way sync, instantly." },
  { i: Cpu, t: "AI understands context", d: "Nexus learns your people, projects, priorities." },
  { i: Zap, t: "Work faster with Nova", d: "Voice or keyboard. Inbox-zero on autopilot." },
];
export function Timeline() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[44px]">How Nexus works.</h2>
        </div>
        <div className="relative mt-16">
          <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-[#1A73E8]/0 via-[#6063EE]/60 to-[#1A73E8]/0 md:left-1/2" />
          <div className="space-y-10">
            {steps.map((s, i) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.08 }}
                className={`relative grid items-center gap-6 md:grid-cols-2 ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}
              >
                <div className={`pl-16 md:pl-0 ${i % 2 ? "md:pl-14" : "md:pr-14 md:text-right"}`}>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#1A73E8]">Step 0{i + 1}</div>
                  <h3 className="mt-1 text-[22px] font-semibold text-ink">{s.t}</h3>
                  <p className="mt-2 text-[14px] text-ink-soft">{s.d}</p>
                </div>
                <div className="absolute left-0 top-1 md:left-1/2 md:-translate-x-1/2">
                  <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-cta text-white shadow-[0_14px_40px_-12px_rgba(70,72,212,0.6)]">
                    <s.i className="h-5 w-5" />
                    <span className="absolute inset-0 rounded-2xl ring-2 ring-[#1A73E8]/20 animate-pulse-ring" />
                  </span>
                </div>
                <div className="hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ SCREENSHOTS ============ */
const shots = [
  { t: "Inbox", sub: "Priority + categorized" },
  { t: "Email Thread", sub: "With AI summary" },
  { t: "Assistant Panel", sub: "Draft · summarize · extract" },
  { t: "Calendar", sub: "Two-way Google sync" },
  { t: "Voice Interface", sub: "Nova listening" },
];
export function Screenshots() {
  return (
    <section id="demo" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[44px]">
            Designed for <span className="text-gradient">modern work.</span>
          </h2>
        </div>
      </div>
      <div className="mt-14 overflow-x-auto pb-6">
        <div className="flex min-w-max gap-6 px-6 lg:px-16">
          {shots.map((s, i) => (
            <motion.div
              key={s.t}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.06 }}
              className="group relative w-[460px] shrink-0 rounded-3xl glass-strong p-3 transition hover:-translate-y-2"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#0c1220]">
                <FakeAppUI />
              </div>
              <div className="flex items-end justify-between px-2 pt-3">
                <div>
                  <div className="text-[15px] font-semibold text-ink">{s.t}</div>
                  <div className="text-[12px] text-ink-soft">{s.sub}</div>
                </div>
                <span className="rounded-full bg-ai px-2.5 py-1 text-[10px] font-mono text-[#1c2541]">0{i + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ FUTURE OF WORK ============ */
export function Future() {
  const principles = [
    { n: "01", t: "Context-aware", d: "Understands who matters, why, and when to surface them.", icon: Brain },
    { n: "02", t: "Voice-first", d: "Talk to Nova naturally. No menus. No friction.", icon: Mic },
    { n: "03", t: "Always learning", d: "Adapts to your tone, priorities, and rhythm every day.", icon: Cpu },
  ];

  return (
    <section className="relative overflow-hidden py-32" style={{ background: "#05070F" }}>
      {/* Grid + glow backdrop */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 75%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(700px circle at 75% 25%, rgba(96,99,238,0.30), transparent 60%), radial-gradient(600px circle at 15% 85%, rgba(26,115,232,0.25), transparent 60%)",
        }}
      />
      <Particles count={36} />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Top eyebrow row */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6063EE] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6063EE]" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/60">
              Manifesto / 2026
            </span>
          </div>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.25em] text-white/40 sm:block">
            §04 — The Future of Work
          </span>
        </div>

        {/* Hero statement */}
        <div className="mt-12 grid items-end gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-8"
          >
            <h2 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] text-white sm:text-[72px] lg:text-[88px]">
              The future
              <br />
              isn't another{" "}
              <span className="relative inline-block">
                <span className="relative z-10 italic font-light text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.55)" }}>
                  inbox.
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" height="14" viewBox="0 0 300 14" preserveAspectRatio="none">
                  <path d="M2 8 Q 75 2, 150 7 T 298 6" stroke="url(#fline)" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="fline" x1="0" x2="1">
                      <stop offset="0" stopColor="#1A73E8" />
                      <stop offset="1" stopColor="#6063EE" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />
              <span className="text-gradient">It's an intelligence layer.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-4"
          >
            <div className="border-l border-white/15 pl-5">
              <p className="text-[15px] leading-relaxed text-white/70">
                Nexus Flow doesn't just hold your messages. It reads context, understands intent, and quietly orchestrates your day — so the work that matters surfaces first.
              </p>
              <div className="mt-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                <span className="h-px w-8 bg-white/30" />
                Nexus Flow OS
              </div>
            </div>
          </motion.div>
        </div>

        {/* Principles */}
        <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-3">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative overflow-hidden bg-[#05070F] p-8 transition-colors hover:bg-[#0A0F1F]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-white/40">{p.n}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/80 transition-all group-hover:border-[#6063EE]/50 group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-12 text-[22px] font-semibold tracking-[-0.01em] text-white">
                  {p.t}
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">{p.d}</p>
                <div
                  className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ background: "radial-gradient(circle, #6063EE, transparent 70%)" }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============ CTA ============ */
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
    <section id="cta" className="relative px-6 py-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[36px] bg-cta p-12 text-center shadow-[0_40px_120px_-30px_rgba(70,72,212,0.6)] sm:p-16">
        <div className="absolute inset-0 opacity-50" style={{
          background:
            "radial-gradient(600px circle at 20% 0%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(600px circle at 100% 100%, rgba(255,255,255,0.25), transparent 60%)",
        }} />
        <div className="relative">
          <Sparkles className="mx-auto h-7 w-7 text-white/90" />
          <h2 className="mt-4 text-[40px] font-semibold tracking-[-0.02em] text-white sm:text-[52px]">
            Ready to work smarter?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] text-white/85">
            Join the future of email, calendar, and AI productivity.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={handleSignIn}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1A73E8] shadow-soft hover:shadow-glow"
            >
              {session ? "Go to Inbox" : "Get Started"} <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#demo" className="inline-flex items-center gap-2 rounded-full glass-dark px-5 py-3 text-sm font-semibold text-white">
              <PlayCircle className="h-4 w-4" /> Watch Demo
            </a>
          </div>
        </div>
      </div>
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
    <footer className="border-t border-black/[0.06] bg-white/60 px-6 py-14">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cta text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-semibold text-ink">
              Nexus<span className="text-gradient"> Flow</span>
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
        <div>© 2026 Nexus Flow</div>
        <div>Built with AI-powered productivity at its core.</div>
      </div>
    </footer>
  );
}
