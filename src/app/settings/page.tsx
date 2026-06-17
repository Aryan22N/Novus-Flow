"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Settings, User, CreditCard, Sparkles,
    Bell, Shield, Zap, Info, Lock
} from "lucide-react";
import TopSearchBar from "~/components/layout/top-search-bar";
import AppSidebar from "~/components/layout/app-sidebar";
import { api } from "~/trpc/react";
import { UpgradeModal } from "~/components/upgrade-modal";

export default function SettingsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const router = useRouter();

    const { data: billingData } = api.billing.getPlanAndUsage.useQuery(undefined, {
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    });

    React.useEffect(() => {
        const stored = localStorage.getItem('superman_settings_auto_summarize');
        if (stored !== null) {
            setAiEnabled(stored === 'true');
        }
    }, []);

    const handleToggle = () => {
        setAiEnabled(!aiEnabled);
    };

    const handleSave = () => {
        localStorage.setItem('superman_settings_auto_summarize', String(aiEnabled));
        router.push('/inbox');
    };

    const handleCancel = () => {
        router.push('/inbox');
    };

    return (
        <div className="bg-background text-on-background flex h-screen overflow-hidden flex-col font-sans">
            <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="flex flex-1 overflow-hidden min-h-0">
                <AppSidebar isOpen={isSidebarOpen} />
                <main className="flex flex-1 flex-col transition-all overflow-y-auto bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mx-auto w-full max-w-5xl mb-8">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage your account preferences, billing, and AI features.</p>
                    </div>

            <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-8">



                {/* Main Content Area */}
                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex-1 space-y-6"
                >

                    {/* ==================== CREDITS & USAGE SECTION ==================== */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-indigo-600" />
                                <h2 className="text-lg font-semibold text-slate-900">Usage & Billing</h2>
                            </div>
                            {billingData?.plan && (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Current Plan: {billingData.plan}
                                </span>
                            )}
                        </div>

                        <div className="p-6 space-y-6">
                            {/* AI Requests */}
                            <div>
                                <div className="flex items-end justify-between mb-2">
                                    <p className="text-sm font-semibold text-slate-700">AI Requests</p>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-slate-900">{billingData?.usage.aiRequests || 0}</span>
                                        <span className="text-xs text-slate-500 font-medium"> / {billingData?.limits.aiRequests === Infinity ? "∞" : billingData?.limits.aiRequests} used</span>
                                        {billingData?.remaining.aiRequests !== Infinity && (
                                            <span className="text-xs text-indigo-600 font-semibold ml-2">({billingData?.remaining.aiRequests || 0} remaining)</span>
                                        )}
                                    </div>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: billingData?.limits.aiRequests === Infinity ? '100%' : `${Math.min(100, ((billingData?.usage.aiRequests || 0) / (billingData?.limits.aiRequests || 1)) * 100)}%` }}
                                        className="h-full rounded-full bg-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Summaries */}
                            <div>
                                <div className="flex items-end justify-between mb-2">
                                    <p className="text-sm font-semibold text-slate-700">Summaries</p>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-slate-900">{billingData?.usage.summaries || 0}</span>
                                        <span className="text-xs text-slate-500 font-medium"> / {billingData?.limits.summaries === Infinity ? "∞" : billingData?.limits.summaries} used</span>
                                        {billingData?.remaining.summaries !== Infinity && (
                                            <span className="text-xs text-indigo-600 font-semibold ml-2">({billingData?.remaining.summaries || 0} remaining)</span>
                                        )}
                                    </div>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: billingData?.limits.summaries === Infinity ? '100%' : `${Math.min(100, ((billingData?.usage.summaries || 0) / (billingData?.limits.summaries || 1)) * 100)}%` }}
                                        className="h-full rounded-full bg-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Nova Voice */}
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Sparkles className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Nova Voice</h3>
                                        <p className="text-xs text-slate-500">Interactive voice assistant</p>
                                    </div>
                                </div>
                                {billingData?.limits.voice ? (
                                    <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Enabled</span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                        <Lock className="w-3.5 h-3.5" /> Pro Only
                                    </span>
                                )}
                            </div>

                            {/* Upgrade CTA */}
                            {billingData?.plan !== 'pro' && (
                                <div className="pt-2">
                                    <button 
                                        onClick={() => setUpgradeModalOpen(true)}
                                        className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all"
                                    >
                                        Upgrade To Pro
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ==================== AI PREFERENCES SECTION ==================== */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-lg font-semibold text-slate-900">Nova AI Features</h2>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Feature Toggle Item */}
                            <div className="flex items-center justify-between">
                                <div className="pr-8">
                                    <h3 className="text-sm font-semibold text-slate-900">Auto-Summarize Threads</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Automatically generate a brief summary at the top of long email threads and event descriptions.
                                    </p>
                                </div>

                                {/* Custom Tailwind Toggle Switch */}
                                <button
                                    type="button"
                                    onClick={handleToggle}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${aiEnabled ? 'bg-blue-600' : 'bg-slate-200'
                                        }`}
                                    role="switch"
                                    aria-checked={aiEnabled}
                                >
                                    <span className="sr-only">Use AI Summarization</span>
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${aiEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="h-px w-full bg-slate-100" />

                            {/* Mock Disabled Feature */}
                            <div className="flex items-center justify-between opacity-60">
                                <div className="pr-8">
                                    <h3 className="text-sm font-semibold text-slate-900">Voice-to-Task (Beta)</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Allow Nova to listen to voice notes and automatically create tasks.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled
                                    className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-slate-200 transition-colors duration-200 ease-in-out"
                                >
                                    <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button 
                            onClick={handleCancel}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>

                </motion.main>
            </div>
          </main>
          
          <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
        </div>
      </div>
    );
}

