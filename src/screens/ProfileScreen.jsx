import React, { useState } from "react";
import { RefreshCw, LogIn, LogOut, UserCircle2, Cloud, TrendingUp } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import ProfileForm from "../components/ProfileForm";
import ScheduleManager from "../components/ScheduleManager";
import AuthModal from "../components/AuthModal";
import { SUPABASE_ENABLED } from "../lib/supabaseClient";

// ── Category display metadata ──────────────────────────────────────────────────

const CATEGORY_META = {
  pickup:  { label: "School pickup rain",   color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20"    },
  commute: { label: "Commute disruption",   color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20"  },
  outdoor: { label: "Outdoor window",       color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  rain:    { label: "Rain at home",         color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20"      },
  cold:    { label: "Cold morning",         color: "text-slate-400",   bg: "bg-slate-700/50 border-slate-600/30"  },
  pet:     { label: "Pet walk window",      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  pollen:  { label: "Pollen alert",         color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20" },
  clear:   { label: "Clear day",            color: "text-slate-400",   bg: "bg-slate-700/50 border-slate-600/30"  },
};

const MIN_DATA_POINTS = 5;

// ── PatternInsight ─────────────────────────────────────────────────────────────
// Reads localStorage pattern counters, surfaces the top friction category
// once there are enough data points to be meaningful.

function PatternInsight() {
  let patterns = {};
  try {
    const raw = localStorage.getItem("skydocket_patterns");
    if (raw) patterns = JSON.parse(raw);
  } catch {
    // ignore
  }

  const entries = Object.entries(patterns);
  const total   = entries.reduce((sum, [, n]) => sum + n, 0);

  if (total < MIN_DATA_POINTS) return null;

  // Find top category (excluding "clear" — that's not friction)
  const friction = entries
    .filter(([cat]) => cat !== "clear")
    .sort(([, a], [, b]) => b - a);

  if (friction.length === 0) return null;

  const [topCat, topCount] = friction[0];
  const meta = CATEGORY_META[topCat] ?? { label: topCat, color: "text-slate-300", bg: "bg-slate-800 border-slate-700" };
  const pct  = Math.round((topCount / total) * 100);

  // Build ranked bar list (top 4, skip "clear")
  const bars = friction.slice(0, 4).map(([cat, count]) => {
    const m   = CATEGORY_META[cat] ?? { label: cat, color: "text-slate-400" };
    const pct = Math.round((count / total) * 100);
    return { cat, label: m.label, color: m.color, pct, count };
  });

  return (
    <div className="mt-8 rounded-3xl border border-slate-700/50 bg-slate-900 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="inline-flex rounded-xl bg-violet-500/20 border border-violet-500/20 p-3 text-violet-400">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Your weather patterns</h2>
          <p className="text-sm text-slate-400">Based on {total} daily observations</p>
        </div>
      </div>

      {/* Top friction callout */}
      <div className={`rounded-2xl border px-4 py-3 mb-5 ${meta.bg}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Top friction</p>
        <p className={`text-base font-bold ${meta.color}`}>{meta.label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{pct}% of your daily alerts — this is where the weather costs you most.</p>
      </div>

      {/* Ranked bars */}
      <div className="space-y-3">
        {bars.map(({ cat, label, color, pct: p, count }) => (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${color}`}>{label}</span>
              <span className="text-xs text-slate-500">{count}×</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full bg-current ${color}`}
                style={{ width: `${p}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ProfileScreen — household settings + account management.
 *
 * Props:
 *   profile             — current profile object
 *   onChange            — profile updater (passed to ProfileForm)
 *   onResetOnboarding   — clears the onboarded flag, re-shows the setup wizard
 *   user                — Supabase user object or null
 *   onSignOut           — called when user clicks sign out
 */
export default function ProfileScreen({ profile, onChange, onResetOnboarding, user, onSignOut }) {
  const [showAuth, setShowAuth] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  function handleAuthSuccess(signedInUser) {
    // Flash a success state — the auth listener in App.jsx handles the rest
    if (signedInUser) setAuthSuccess(true);
  }

  return (
    <>
      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            profile={profile}
            onClose={() => setShowAuth(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Your profile</h1>
          <p className="mt-2 text-slate-400">
            Edit your household details. Every change updates your recommendations instantly.
          </p>
        </div>

        {/* Redo onboarding */}
        <button
          type="button"
          onClick={onResetOnboarding}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Redo setup wizard
        </button>
      </div>

      {/* Profile form */}
      <ProfileForm profile={profile} onChange={onChange} />

      {/* Schedule manager */}
      <ScheduleManager schedule={profile.schedule ?? []} onChange={onChange} />

      {/* Pattern insight */}
      <PatternInsight />

      {/* Account sync section */}
      {SUPABASE_ENABLED && (
        <div className="mt-8 rounded-3xl border border-slate-700/50 bg-slate-900 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex rounded-xl bg-blue-500/20 border border-blue-500/20 p-3 text-blue-400">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Account &amp; sync</h2>
              <p className="text-sm text-slate-400">
                {user
                  ? "Your profile syncs automatically across devices."
                  : "Sign in to sync your profile across devices."}
              </p>
            </div>
          </div>

          {user ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <UserCircle2 className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{user.email}</p>
                  <p className="text-xs text-emerald-400 mt-0.5">&#10003; Profile synced</p>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div>
              {authSuccess && (
                <p className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
                  &#10003; Signed in successfully. Your profile is now syncing.
                </p>
              )}
              <button
                onClick={() => { setAuthSuccess(false); setShowAuth(true); }}
                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign in or create account
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
