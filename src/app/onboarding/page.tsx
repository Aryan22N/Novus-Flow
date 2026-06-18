"use client";

import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import { Mail, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "~/trpc/react";
import { useEffect, useRef, useState } from "react";

export default function OnboardingPage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const router = useRouter();

  const { data: connectedIntegrations = [], isPending: isCheckingAccounts } =
    api.account.getConnectedIntegrations.useQuery(undefined, {
      enabled: !!session?.user,
    });

  const registerCalendarWebhook = api.calendar.registerWebhook.useMutation();
  const registerEmailWebhook = api.email.registerWebhook.useMutation();
  const hasTriggeredRef = useRef(false);

  const hasEmail = connectedIntegrations.includes("gmail");
  const hasCalendar = connectedIntegrations.includes("googlecalendar");

  // Auto-route to inbox if both are connected
  useEffect(() => {
    if (hasEmail && hasCalendar && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      Promise.allSettled([
        registerCalendarWebhook.mutateAsync(),
        registerEmailWebhook.mutateAsync()
      ]).then(() => {
        router.push("/inbox");
      });
    }
  }, [hasEmail, hasCalendar, router, registerCalendarWebhook, registerEmailWebhook]);

  const isPending = isSessionPending || isCheckingAccounts || (hasEmail && hasCalendar);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0f1c]">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!session?.user) {
    if (typeof window !== "undefined") {
      router.push("/");
    }
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F6FB] dark:bg-[#0a0f1c] p-4 font-sans">
      <div className="w-full max-w-[480px] overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        {/* Header Section */}
        <div className="bg-gradient-to-b from-blue-50/50 dark:from-indigo-900/20 to-white dark:to-slate-900 p-8 pb-6 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white dark:border-slate-800 bg-blue-100 dark:bg-indigo-900/50 shadow-sm">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-blue-600 dark:text-indigo-400">
                {session.user.name?.charAt(0) || "U"}
              </span>
            )}
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {session.user.name?.split(" ")[0]}!
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400">
            {!hasEmail 
              ? "Let's set up your workspace by connecting your email account."
              : "Great! Now let's connect your calendar to sync your schedule."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-8">
          <div className="flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full ${hasEmail ? 'bg-blue-600 dark:bg-indigo-500' : 'bg-blue-600 dark:bg-indigo-500'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${hasEmail ? 'bg-blue-600 dark:bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
          </div>
          <div className="mt-2 flex justify-between text-xs font-medium text-slate-400">
            <span className={hasEmail ? "text-slate-600 dark:text-slate-300" : "text-blue-600 dark:text-indigo-400"}>Email Sync</span>
            <span className={hasEmail ? "text-blue-600 dark:text-indigo-400" : ""}>Calendar Sync</span>
          </div>
        </div>

        {/* Steps Content */}
        <div className="p-8 pt-8">
          {!hasEmail ? (
            // STEP 1: Connect Email
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-red-500 shadow-sm">
                  <Mail size={24} strokeWidth={2.5} />
                </div>
                <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Gmail Integration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Required to sync your inbox, send emails, and use AI features.
                </p>
              </div>

              <button
                onClick={() => (window.location.href = "/api/corsair/connect?plugin=gmail")}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-blue-600 dark:bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 dark:hover:bg-indigo-500 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]"
              >
                Connect Gmail
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ) : (
            // STEP 2: Connect Calendar
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-blue-500 dark:text-indigo-400 shadow-sm">
                  <Calendar size={24} strokeWidth={2.5} />
                </div>
                <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Google Calendar</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Required to sync your meetings, schedule events, and manage your time.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => (window.location.href = "/api/corsair/connect?plugin=googlecalendar")}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-blue-600 dark:bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 dark:hover:bg-indigo-500 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]"
                >
                  Connect Calendar
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
