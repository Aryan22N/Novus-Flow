"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { CheckCircle2, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = () => {
    setIsUpgrading(true);
    // Placeholder for Stripe/Billing logic
    setTimeout(() => {
      setIsUpgrading(false);
      onOpenChange(false);
      alert("Redirecting to billing...");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-none bg-transparent shadow-2xl">
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] rounded-2xl">
          <div className="bg-surface dark:bg-slate-900 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <DialogHeader className="relative z-10 space-y-3 pb-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-4 mx-auto border border-white/10 shadow-inner">
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
              <DialogTitle className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                🚀 Upgrade To Pro
              </DialogTitle>
              <DialogDescription className="text-center text-on-surface-variant/80 dark:text-slate-300 text-base">
                Unlock the full power of your AI assistant and supercharge your workflow.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 relative z-10 py-4">
              {[
                "Unlimited AI Requests",
                "Unlimited Summaries",
                "Nova Voice Assistant",
                "Writing Style Learning",
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-3 text-sm font-medium text-on-surface dark:text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 relative z-10">
              <Button 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25 border-0 h-12 rounded-xl text-base font-semibold group relative overflow-hidden transition-all duration-300"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                
                <span className="flex items-center justify-center gap-2">
                  {isUpgrading ? "Processing..." : "Upgrade Now"}
                  {!isUpgrading && <Zap className="w-4 h-4" />}
                </span>
              </Button>
              <p className="text-center text-xs text-on-surface-variant dark:text-slate-400 mt-4">
                Cancel anytime. Secure payment via Stripe.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
