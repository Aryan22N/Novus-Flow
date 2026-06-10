"use client";

import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import { Mail, Calendar, ArrowRight } from "lucide-react";
import { api } from "~/trpc/react";
import { useEffect } from "react";

export default function OnboardingPage() {
    const { data: session, isPending: isSessionPending } = authClient.useSession();
    const router = useRouter();
    const { data: hasConnectedAccounts, isPending: isCheckingAccounts } = api.account.hasConnectedAccounts.useQuery(
        undefined,
        { enabled: !!session?.user }
    );

    useEffect(() => {
        if (hasConnectedAccounts) {
            router.push("/inbox");
        }
    }, [hasConnectedAccounts, router]);

    const isPending = isSessionPending || isCheckingAccounts || hasConnectedAccounts;

    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {session.user.image ? (
                            <img src={session.user.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-blue-600">
                                {session.user.name?.charAt(0) || "U"}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {session.user.name?.split(' ')[0]}!</h1>
                    <p className="text-slate-500">Let&apos;s set up your workspace by connecting your essential accounts.</p>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={() => window.location.href = "/api/corsair/connect?plugin=gmail"}
                        className="w-full group relative flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-red-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        <div className="relative flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                                <Mail size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-slate-900">Connect Gmail</h3>
                                <p className="text-sm text-slate-500">Sync your inbox & emails</p>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-slate-400 group-hover:text-red-500 transform group-hover:translate-x-1 transition-all relative" />
                    </button>

                    <button 
                        onClick={() => window.location.href = "/api/corsair/connect?plugin=googlecalendar"}
                        className="w-full group relative flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        <div className="relative flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <Calendar size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-slate-900">Connect Calendar</h3>
                                <p className="text-sm text-slate-500">Sync your events & meetings</p>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all relative" />
                    </button>
                </div>

                <div className="mt-10 text-center">
                    <button 
                        onClick={() => router.push("/inbox")}
                        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer flex items-center justify-center gap-2 mx-auto"
                    >
                        Continue to Inbox <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
