"use client";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

const nav = [
  { label: "Features", href: "#features" },
  // { label: "AI Assistant", href: "#assistant" },
  { label: "Nova Voice", href: "#nova" },
  { label: "Calendar", href: "#calendar" },
  { label: "Demo", href: "#demo" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const router = useRouter();

  const { data: connectedIntegrations = [], isPending: isCheckingAccounts } =
    api.account.getConnectedIntegrations.useQuery(undefined, {
      enabled: !!session?.user,
    });

  const hasEmail = connectedIntegrations.includes("gmail");
  const hasCalendar = connectedIntegrations.includes("googlecalendar");
  const isFullyOnboarded = hasEmail && hasCalendar;

  const isPending = isSessionPending || (!!session?.user && isCheckingAccounts);

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboarding",
    });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 h-[72px] transition-all duration-300 ${scrolled ? "glass-strong" : "bg-transparent"
        }`}
      style={scrolled ? undefined : { backdropFilter: "blur(6px)" }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <motion.a
          href="/"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="inline-block"
        >
          <img
            src="/Nexus_Flow_logo.png"
            alt="Logo"
            className="h-35 w-35 pt-5 pb-3 object-contain select-none"
          />
        </motion.a>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full px-4 py-2 text-[13.5px] font-medium text-ink-soft transition hover:text-ink hover:bg-black/[0.04]"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isPending ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-black/5" />
          ) : session ? (
            <button
              onClick={() => router.push(isFullyOnboarded ? "/inbox" : "/onboarding")}
              className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-cta px-4 py-2 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(26,115,232,0.7)] transition hover:shadow-[0_14px_40px_-12px_rgba(70,72,212,0.7)]"
            >
              {isFullyOnboarded ? "Go to Inbox" : "Continue Setup"}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
