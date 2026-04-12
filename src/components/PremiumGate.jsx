import React from "react";
import { Lock } from "lucide-react";
import { usePremium } from "../context/PremiumContext";

/**
 * PremiumGate — wraps any content that requires a Pro subscription.
 *
 * If isPremium is true: renders children normally.
 * If isPremium is false: renders children blurred with a lock overlay
 *   and an "Upgrade" CTA that navigates to the Premium tab.
 *
 * Props:
 *   feature  — display name shown in the lock overlay, e.g. "Advanced Planning"
 *   children — the content to conditionally reveal
 */
export default function PremiumGate({ feature, children }) {
  const { isPremium, onUpgrade } = usePremium();

  if (isPremium) return <>{children}</>;

  return (
    <div className="relative rounded-3xl overflow-hidden">
      {/* Blurred content — pointer-events disabled so clicks don't leak through */}
      <div
        className="blur-sm pointer-events-none select-none"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-slate-950/70 backdrop-blur-sm border border-blue-500/20 p-6 text-center">
        <div className="mb-3 inline-flex rounded-2xl bg-blue-500/20 border border-blue-500/30 p-4 text-blue-400">
          <Lock className="h-6 w-6" />
        </div>
        <p className="text-base font-semibold text-white">{feature}</p>
        <p className="mt-1 text-sm text-slate-400">Available with SkyDocket Pro</p>
        <button
          onClick={onUpgrade}
          className="mt-5 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
        >
          Upgrade to SkyDocket Pro
        </button>
      </div>
    </div>
  );
}
