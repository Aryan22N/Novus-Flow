'use client';

import React, { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import {
    Mic,
    MicOff,
    Sparkles,
    Lightbulb,
    MoreVertical,
    CheckCircle2,
    Circle,
    ArrowRight,
    Database,
    Volume2,
    VolumeX,
    Lock
} from 'lucide-react';
import AppSidebar from "~/components/layout/app-sidebar";
import TopSearchBar from "~/components/layout/top-search-bar";
import { api } from "~/trpc/react";
import { UpgradeModal } from "~/components/upgrade-modal";

interface Task {
    id: string;
    text: string;
    source: string;
    completed: boolean;
}

import { useNova } from '~/hooks/use-nova';

function VoiceInteractionInner({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (v: boolean) => void }) {
    const { state: novaState, transcript: novaTranscript, responseText, startRecording, stopRecording, confirm, pendingAction, setPendingAction } = useNova();

    const isListening = novaState === "recording";
    const statusText = novaState === "recording" ? "listening" : (novaState === "transcribing" || novaState === "thinking" || novaState === "confirming") ? "processing" : "paused";
    const transcript = novaTranscript || "Press the microphone to start speaking...";

    const [isContinuous, setIsContinuous] = useState(true);
    const [isMuted, setIsMuted] = useState(false);

    const [tasks, setTasks] = useState<Task[]>([
        {
            id: 'task-1',
            text: 'Review Analytics Report',
            source: 'Q3 Performance Deck',
            completed: false,
        },
        {
            id: 'task-2',
            text: 'Schedule Briefing',
            source: 'Marketing Team • Tomorrow',
            completed: false,
        },
    ]);

    const insight = responseText || "I'm Nova. How can I help you today?";



    const toggleTask = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        );
    };

    const toggleListening = () => {
        if (novaState === "idle") startRecording();
        else if (novaState === "recording") stopRecording();
    };

    useEffect(() => {
        const cleanSplineLogo = () => {
            // Check inside spline-wrapper (for standard DOM logo)
            const wrapper = document.querySelector('.spline-wrapper');
            if (wrapper) {
                const logo = wrapper.querySelector('a[href*="spline"]') ?? wrapper.querySelector('#logo') ?? wrapper.querySelector('a');
                if (logo) {
                    (logo as HTMLElement).style.setProperty('display', 'none', 'important');
                    (logo as HTMLElement).style.setProperty('opacity', '0', 'important');
                    (logo as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
                }
            }

            // Check globally in case it is appended elsewhere
            const logos = document.querySelectorAll('a[href*="spline"], #logo');
            logos.forEach((logo) => {
                if (logo) {
                    (logo as HTMLElement).style.setProperty('display', 'none', 'important');
                    (logo as HTMLElement).style.setProperty('opacity', '0', 'important');
                    (logo as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
                }
            });

            // If a shadow DOM-based spline-viewer is used, try to pierce shadow root
            const viewers = document.querySelectorAll('spline-viewer');
            viewers.forEach((viewer) => {
                if (viewer.shadowRoot) {
                    const shadowLogo = viewer.shadowRoot.querySelector('#logo') ?? viewer.shadowRoot.querySelector('a');
                    if (shadowLogo) {
                        (shadowLogo as HTMLElement).style.setProperty('display', 'none', 'important');
                        (shadowLogo as HTMLElement).style.setProperty('opacity', '0', 'important');
                        (shadowLogo as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
                    }
                }
            });
        };

        cleanSplineLogo();
        const interval = setInterval(cleanSplineLogo, 500);

        return () => clearInterval(interval);
    }, []);



    return (
        <>
            <style>{`
                .glass-panel {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .glass-panel-hover:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.09);
                }

                .ai-gradient-text {
                    background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; transform: scale(0.97); }
                    50% { opacity: 0.85; transform: scale(1.03); }
                }

                .voice-core-glow {
                    animation: pulse-glow 6s ease-in-out infinite;
                }

                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }

                .float-orb {
                    animation: float-slow 6s ease-in-out infinite;
                }

                @keyframes wave-dance {
                    0%, 100% { transform: scaleY(0.25); }
                    50% { transform: scaleY(1); }
                }

                .bar {
                    width: 3px;
                    border-radius: 9999px;
                    transform-origin: center;
                    transition: all 0.3s ease;
                }

                .bar-anim {
                    animation: wave-dance 1.2s infinite ease-in-out;
                }

                .bar-anim-fast {
                    animation: wave-dance 0.5s infinite ease-in-out;
                }

                @keyframes pulse-ring {
                    0% { transform: scale(0.95); opacity: 0.15; }
                    50% { transform: scale(1.15); opacity: 0.35; }
                    100% { transform: scale(1.3); opacity: 0; }
                }

                .pulse-ring-1 {
                    animation: pulse-ring 3s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
                }

                .pulse-ring-2 {
                    animation: pulse-ring 3s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
                    animation-delay: 1.5s;
                }

                .spline-wrapper a,
                a[href*="spline.design"],
                a[href*="spline"],
                #logo {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                }
            `}</style>

            <div className="flex flex-col h-screen overflow-hidden antialiased bg-background text-on-background">
                <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                <div className="flex flex-1 pt-1 overflow-hidden">
                    <AppSidebar isOpen={isSidebarOpen} />

                    {/* Voice Interaction Canvas */}
                    <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden rounded-xl bg-gradient-to-t from-[#dfe9f3] to-white dark:from-[#0f172a] dark:to-[#0a0f1c]" >
                        {/* Radial Gradient Background Effect */}
                        {/* <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-fixed/30 via-background to-background pointer-events-none"></div> */}

                        {/* Left / Center Visualizer */}
                        <div className="flex-1 flex flex-col justify-between items-center relative z-10 px-6 py-8 md:py-12">

                            {/* Orb Visualization Area */}
                            <div className="flex-1 flex items-center justify-center w-full relative min-h-[300px]">
                                <div className="relative w-120 h-64 md:w-[440px] pt-3 md:h-[470px] flex items-center justify-center float-orb">
                                    {/* Rotating Pulsing Rings */}
                                    {isListening && (
                                        <>
                                            <div className="absolute inset-0 border border-primary/10 rounded-full pulse-ring-1"></div>
                                            <div className="absolute inset-0 border border-primary/20 rounded-full pulse-ring-2"></div>
                                        </>
                                    )}

                                    {/* Active Glow Backdrop */}
                                    {/* <div className={`absolute w-[85%] h-[85%] rounded-full filter blur-[40px] opacity-15 transition-all duration-1000 ${statusText === 'listening'
                                        ? 'bg-primary shadow-[0_0_80px_rgba(26,115,232,0.3)]'
                                        : statusText === 'processing'
                                            ? 'bg-indigo-500 shadow-[0_0_80px_rgba(99,102,241,0.3)]'
                                            : 'bg-zinc-300'
                                        }`} /> */}

                                    {/* Orb Spline Wrapper */}
                                    <div className="w-[150%] h-[180%] z-10 rounded-full overflow-hidden relative z-20 transition-all duration-300 pointer-events-none spline-wrapper">
                                        <Spline scene="https://prod.spline.design/GKlt5TQk0HxtTzuv/scene.splinecode" />
                                    </div>
                                </div>
                            </div>

                            {/* Live Transcription & Waveform Panel */}
                            <div className="w-full max-w-2xl text-center space-y-6">
                                {/* Dynamic Waveform */}
                                <div className="h-12 flex justify-center items-center gap-1.5 mb-2">
                                    {Array.from({ length: 15 }).map((_, i) => {
                                        const baseHeights = [10, 16, 24, 32, 40, 48, 56, 64, 56, 48, 40, 32, 24, 16, 10];
                                        const height = baseHeights[i % baseHeights.length];
                                        const delays = [0.1, 0.3, 0.5, 0.2, 0.4, 0.6, 0.1, 0.3, 0.5, 0.2, 0.4, 0.6, 0.1, 0.3, 0.5];
                                        const delay = delays[i % delays.length];

                                        return (
                                            <div
                                                key={i}
                                                className={`bar bg-gradient-to-t from-primary via-primary-container to-primary-fixed-dim dark:from-indigo-500 dark:via-indigo-400 dark:to-indigo-300 ${statusText === 'listening' ? 'bar-anim' : statusText === 'processing' ? 'bar-anim-fast' : ''
                                                    }`}
                                                style={{
                                                    height: statusText === 'paused' ? '4px' : `${height}px`,
                                                    animationDelay: `${delay}s`,
                                                    animationDuration: statusText === 'processing' ? '0.6s' : '1.2s',
                                                    opacity: statusText === 'paused' ? 0.2 : 0.85,
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest text-primary">
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusText === 'listening' ? 'bg-green-500 animate-pulse' : statusText === 'processing' ? 'bg-purple-500 animate-bounce' : 'bg-red-500'
                                            }`} />
                                        <span>
                                            {statusText === 'listening' ? 'Listening' : statusText === 'processing' ? 'Processing command' : 'Muted'}
                                        </span>
                                    </div>
                                    <div className="min-h-[72px]">
                                        <h2 className="text-lg md:text-xl font-light text-on-background tracking-wide leading-relaxed px-4 max-w-xl mx-auto">
                                            &quot;{transcript.split(' ').map((word: string, idx: number) => {
                                                const isHighlighted = ['schedule', 'briefing', 'analytics', 'reply', 'unread', 'emails', 'calendar'].includes(word.toLowerCase().replace(/[^a-z]/g, ''));
                                                return (
                                                    <span key={idx} className={isHighlighted ? 'ai-gradient-text font-semibold' : 'text-on-surface dark:text-slate-300'}>
                                                        {word}{' '}
                                                    </span>
                                                );
                                            })}&quot;
                                        </h2>
                                    </div>
                                </div>

                                {/* Suggestion Chips */}
                                {/* <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mr-1 hidden sm:inline">Suggestions:</span>
                                    {suggestions.map((s, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestionClick(s)}
                                            className="text-xs bg-surface-container-low hover:bg-primary/5 text-on-surface-variant hover:text-primary px-3 py-1.5 border border-outline-variant hover:border-primary/20 rounded-full transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1"
                                        >
                                            <span>{s.label}</span>
                                            <ArrowRight className="w-3 h-3 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                                        </button>
                                    ))}
                                </div> */}
                            </div>

                            {/* Floating bottom capsule controls */}
                            <div className="w-full flex justify-center pt-8">
                                <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-3 shadow-sm border border-outline-variant/40">
                                    <button
                                        onClick={toggleListening}
                                        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer ${isListening
                                            ? 'bg-primary hover:bg-primary-container text-on-primary hover:scale-105'
                                            : 'bg-error-container text-error hover:bg-error-container/80 hover:scale-105 shadow-sm border border-error/10'
                                            }`}
                                        title={isListening ? 'Mute microphone' : 'Activate microphone'}
                                    >
                                        {isListening ? (
                                            <Mic className="w-4 h-4 font-semibold" />
                                        ) : (
                                            <MicOff className="w-4 h-4" />
                                        )}
                                    </button>

                                    <div className="h-6 w-px bg-outline-variant/50" />

                                    <div className="px-2 flex flex-col justify-center min-w-[110px]">
                                        <span className="text-[10px] text-on-surface-variant font-medium">Continuous Mode</span>
                                        <button
                                            onClick={() => setIsContinuous(!isContinuous)}
                                            className="text-[9px] text-primary font-bold uppercase tracking-wider text-left hover:text-primary-container transition-colors"
                                        >
                                            {isContinuous ? 'Always Active' : 'Push to Talk'}
                                        </button>
                                    </div>

                                    <div className="h-6 w-px bg-outline-variant/50" />

                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="p-2.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors cursor-pointer"
                                        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                                    >
                                        {isMuted ? (
                                            <VolumeX className="w-4 h-4 text-error" />
                                        ) : (
                                            <Volume2 className="w-4 h-4 text-on-surface-variant" />
                                        )}
                                    </button>

                                    <button className="p-2.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors cursor-pointer">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Rail: Assistant Context */}
                        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l-2 border-outline-variant/50 dark:border-slate-800 p-5 flex flex-col gap-5 overflow-y-auto flex-shrink-0 z-10 relative bg-gradient-to-t from-[#dfe9f3] to-white dark:from-[#0f172a] dark:to-[#0a0f1c]">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                <h3 className="text-xs font-semibold text-on-surface tracking-wider uppercase">Nexus Insight Drawer</h3>
                            </div>

                            {/* Detected Tasks Checklist */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant dark:text-slate-400">Action Items</span>
                                    <span className="text-[9px] bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                                        {tasks.filter(t => t.completed).length}/{tasks.length} Done
                                    </span>
                                </div>
                                <div className="bg-surface dark:bg-slate-800/50 border border-outline-variant dark:border-slate-800 p-3.5 rounded-xl space-y-3 shadow-xs">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={() => toggleTask(task.id)}
                                            className="flex items-start gap-2.5 cursor-pointer group"
                                        >
                                            <button className="mt-0.5 text-outline hover:text-primary transition-colors flex-shrink-0">
                                                {task.completed ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <Circle className="w-4 h-4 group-hover:border-primary transition-all text-outline" />
                                                )}
                                            </button>
                                            <div className="min-w-0">
                                                <p className={`text-xs font-medium transition-colors ${task.completed ? 'line-through text-on-surface-variant/60 dark:text-slate-500' : 'text-on-surface dark:text-slate-200 group-hover:text-primary dark:group-hover:text-indigo-400'
                                                    }`}>
                                                    {task.text}
                                                </p>
                                                <p className="text-[10px] text-on-surface-variant/70 dark:text-slate-400 mt-0.5 truncate">{task.source}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {tasks.length === 0 && (
                                        <p className="text-xs text-on-surface-variant/60 text-center py-2">No tasks detected yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Confirmation UI */}
                            {novaState === "confirming" && pendingAction && (
                                <div className="space-y-2 mb-4">
                                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-error dark:text-red-400">Action Required</h4>
                                    <div className="bg-error-container/30 dark:bg-red-900/20 border border-error/20 dark:border-red-900/50 p-3.5 rounded-xl space-y-3">
                                        <div className="flex flex-col gap-3">
                                            {Array.isArray(pendingAction) ? pendingAction.map((action: any, idx: number) => {
                                                if (action.tool === "sendEmail") {
                                                    return (
                                                        <div key={idx} className="flex flex-col gap-2">
                                                            <div className="text-[10px] font-bold text-error dark:text-red-400 uppercase tracking-wider">Send Email</div>
                                                            <input
                                                                className="text-xs p-1.5 border border-error/20 dark:border-red-900/50 rounded bg-white dark:bg-slate-900 dark:text-slate-200 w-full"
                                                                value={action.args.to || ""}
                                                                onChange={(e) => {
                                                                    const newActions = [...pendingAction];
                                                                    newActions[idx].args.to = e.target.value;
                                                                    setPendingAction(newActions);
                                                                }}
                                                            />
                                                            <input
                                                                className="text-xs p-1.5 border border-error/20 dark:border-red-900/50 rounded bg-white dark:bg-slate-900 dark:text-slate-200 w-full"
                                                                value={action.args.subject || ""}
                                                                onChange={(e) => {
                                                                    const newActions = [...pendingAction];
                                                                    newActions[idx].args.subject = e.target.value;
                                                                    setPendingAction(newActions);
                                                                }}
                                                            />
                                                            <textarea
                                                                className="text-xs p-1.5 border border-error/20 dark:border-red-900/50 rounded bg-white dark:bg-slate-900 dark:text-slate-200 w-full min-h-[60px]"
                                                                value={action.args.body || ""}
                                                                onChange={(e) => {
                                                                    const newActions = [...pendingAction];
                                                                    newActions[idx].args.body = e.target.value;
                                                                    setPendingAction(newActions);
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <p key={idx} className="text-xs text-on-surface dark:text-slate-200 font-medium leading-relaxed">
                                                        {action.draft}
                                                    </p>
                                                );
                                            }) : (
                                                <p className="text-xs text-on-surface dark:text-slate-200 font-medium leading-relaxed">
                                                    {pendingAction.draft}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const actionsToSubmit = Array.isArray(pendingAction) ? [...pendingAction] : [];
                                                    confirm(true, actionsToSubmit);
                                                }}
                                                className="flex-1 bg-primary dark:bg-indigo-600 text-on-primary dark:text-white text-xs py-1.5 rounded-lg hover:bg-primary/90 dark:hover:bg-indigo-500 transition-colors"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => confirm(false)}
                                                className="flex-1 bg-surface-container dark:bg-slate-800 text-on-surface dark:text-slate-200 text-xs py-1.5 rounded-lg hover:bg-surface-container-high dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Voice Insights */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant dark:text-slate-400">Live Insight</h4>
                                <div className="bg-primary-fixed/30 dark:bg-indigo-900/20 p-3.5 rounded-xl flex items-start gap-2.5 border-l-2 border-l-primary dark:border-l-indigo-500 border-t-0 border-r-0 border-b-0">
                                    <Lightbulb className="w-4 h-4 text-primary dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-on-surface dark:text-slate-300 leading-relaxed">
                                        {insight}
                                    </p>
                                </div>
                            </div>

                            {/* Status Indicator */}
                            {/* <div className="mt-auto pt-4 border-t border-outline-variant flex items-center justify-between text-[10px] text-on-surface-variant/60">
                                <div className="flex items-center gap-1.5">
                                    <Database className="w-3 h-3 text-primary/45" />
                                    <span>Sync: 100% cloud</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/80" />
                                    <span>Connected • 24ms</span>
                                </div>
                            </div> */}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

export default function NexusAIVoiceInteraction() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { data: billingData, isPending } = api.billing.getPlanAndUsage.useQuery();
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    if (isPending) return null;

    if (billingData?.plan === "free") {
        return (
            <div className="flex flex-col h-screen overflow-hidden antialiased bg-background text-on-background">
                <TopSearchBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className="flex flex-1 pt-1 overflow-hidden">
                    <AppSidebar isOpen={isSidebarOpen} />
                    <main className="flex-1 flex items-center justify-center p-6 rounded-xl relative bg-gradient-to-t from-[#dfe9f3] to-white dark:from-[#0f172a] dark:to-[#0a0f1c]">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800 rounded-3xl p-10 max-w-lg w-full text-center shadow-xl dark:shadow-2xl">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Lock className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-3 tracking-tight">Nova Voice is Pro Only</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-10 text-base leading-relaxed">
                                Upgrade to Pro to unlock the interactive voice assistant. Speak naturally to Nova, create tasks instantly, and supercharge your productivity.
                            </p>
                            <button
                                onClick={() => setUpgradeModalOpen(true)}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                            >
                                Upgrade To Pro
                            </button>
                        </div>
                    </main>
                </div>
                <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
            </div>
        );
    }

    return <VoiceInteractionInner isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />;
}
