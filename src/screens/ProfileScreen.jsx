import React, { useState } from "react";
import { RefreshCw, LogIn, LogOut, UserCircle2, Cloud } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import ProfileForm from "../components/ProfileForm";
import AuthModal from "../components/AuthModal";
import { SUPABASE_ENABLED } from "../lib/supabaseClient";

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
