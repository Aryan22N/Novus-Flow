"use client";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Menu, X, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

import { useTheme } from "next-themes";

const nav = [
  { label: "Features", href: "#features" },
  // { label: "AI Assistant", href: "#assistant" },
  { label: "Nova Voice", href: "#nova" },
  { label: "Calendar", href: "#calendar" },
  { label: "Demo", href: "#demo" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const router = useRouter();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
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
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? "glass-strong border-b border-black/5" : "bg-transparent"
        }`}
      style={(scrolled || mobileMenuOpen) ? undefined : { backdropFilter: "blur(6px)" }}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 md:px-6">
        <motion.a
          href="/"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="inline-block"
        >
          <img
            src="/Nexus_Flow_logo.png"
            alt="Novus_Logo"
            className="h-28 w-28 md:h-35 md:w-35 pt-5 pb-3 object-contain select-none"
          />
        </motion.a>

        {/* Desktop Navigation */}
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
              <span className="hidden sm:inline">{isFullyOnboarded ? "Go to Inbox" : "Continue Setup"}</span>
              <span className="sm:hidden">{isFullyOnboarded ? "Inbox" : "Setup"}</span>
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="rounded-full px-3 md:px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Sign in
            </button>
          )}

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors ml-1"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 text-slate-600 hover:bg-black/5 rounded-full transition-colors ml-1"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-white/90 backdrop-blur-3xl border-t border-black/5"
          >
            <nav className="flex flex-col px-4 py-4 space-y-1">
              {nav.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-[15px] font-medium text-slate-700 transition hover:text-slate-900 hover:bg-black/5 active:bg-black/10"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

