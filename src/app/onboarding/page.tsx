"use client";

import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import { Mail, Calendar, ArrowRight } from "lucide-react";
import { api } from "~/trpc/react";
import { useEffect } from "react";

export default function OnboardingPage() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const router = useRouter();
  const { data: hasConnectedAccounts, isPending: isCheckingAccounts } =
    api.account.hasConnectedAccounts.useQuery(undefined, {
      enabled: !!session?.user,
    });

  useEffect(() => {
    if (hasConnectedAccounts) {
      router.push("/inbox");
    }
  }, [hasConnectedAccounts, router]);

  const isPending =
    isSessionPending || isCheckingAccounts || hasConnectedAccounts;

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="Avatar"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-blue-600">
                {session.user.name?.charAt(0) || "U"}
              </span>
            )}
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            Welcome, {session.user.name?.split(" ")[0]}!
          </h1>
          <p className="text-slate-500">
            Let&apos;s set up your workspace by connecting your essential
            accounts.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() =>
              (window.location.href = "/api/corsair/connect?plugin=gmail")
            }
            className="group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-red-200 hover:shadow-md"
          >
            <div className="absolute inset-0 bg-red-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Mail size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900">Connect Gmail</h3>
                <p className="text-sm text-slate-500">
                  Sync your inbox & emails
                </p>
              </div>
            </div>
            <ArrowRight
              size={20}
              className="relative transform text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-red-500"
            />
          </button>

          <button
            onClick={() =>
              (window.location.href =
                "/api/corsair/connect?plugin=googlecalendar")
            }
            className="group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:shadow-md"
          >
            <div className="absolute inset-0 bg-blue-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Calendar size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900">
                  Connect Calendar
                </h3>
                <p className="text-sm text-slate-500">
                  Sync your events & meetings
                </p>
              </div>
            </div>
            <ArrowRight
              size={20}
              className="relative transform text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500"
            />
          </button>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => router.push("/inbox")}
            className="text-primary hover:text-primary/80 mx-auto flex cursor-pointer items-center justify-center gap-2 text-sm font-semibold transition-colors"
          >
            Continue to Inbox <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
