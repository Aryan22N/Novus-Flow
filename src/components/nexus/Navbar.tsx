"use client";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";

const nav = [
  { label: "Features", href: "#features" },
  { label: "AI Assistant", href: "#assistant" },
  { label: "Nova Voice", href: "#nova" },
  { label: "Calendar", href: "#calendar" },
  { label: "Demo", href: "#demo" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

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
        <a href="#" className="flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-cta text-white shadow-[0_8px_24px_-8px_rgba(26,115,232,0.6)]">
            <Sparkles className="h-4.5 w-4.5" strokeWidth={2.4} />
            <span className="absolute inset-0 rounded-xl ring-1 ring-white/40" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Novus<span className="text-gradient"> Flow</span>
          </span>
        </a>
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
            <div className="h-9 w-20 animate-pulse rounded-full bg-black/5" />
          ) : session ? (
            <button
              onClick={() => router.push("/inbox")}
              className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-cta px-4 py-2 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(26,115,232,0.7)] transition hover:shadow-[0_14px_40px_-12px_rgba(70,72,212,0.7)]"
            >
              Go to Inbox
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                className="hidden cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-medium text-ink-soft hover:bg-black/[0.04] hover:text-ink sm:inline-block"
              >
                Sign in
              </button>
              <button
                onClick={handleSignIn}
                className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-cta px-4 py-2 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(26,115,232,0.7)] transition hover:shadow-[0_14px_40px_-12px_rgba(70,72,212,0.7)]"
              >
                Get Started
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
