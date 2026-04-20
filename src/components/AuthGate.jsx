import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudSun, LogIn, UserPlus, ShieldCheck, Zap, RefreshCw } from "lucide-react";
import AuthModal from "./AuthModal";

const FEATURES = [
  { icon: Zap,         label: "Daily decisions",     sub: "Personalized for your household" },
  { icon: RefreshCw,   label: "Sync across devices", sub: "Your profile, everywhere"        },
  { icon: ShieldCheck, label: "Private by default",  sub: "No ads. No data selling."        },
];

/**
 * AuthGate — fullscreen sign-in / register wall shown after the splash screen.
 *
 * Props:
 *   profile     — current local profile (passed to AuthModal for Supabase sync)
 *   onContinue  — called when gate should close (sign-in success OR guest choice)
 *   onAuthSuccess — called with (user) when Supabase auth succeeds
 */
export default function AuthGate({ profile, onContinue, onAuthSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [initialMode, setInitialMode] = useState("signin");

  function openSignIn()  { setInitialMode("signin");  setShowModal(true); }
  function openSignUp()  { setInitialMode("signup");  setShowModal(true); }

  function handleAuthSuccess(user) {
    onAuthSuccess(user);
    onContinue();
  }

  return (
    <>
      {/* ── Auth modal (sign in / create account) ────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <AuthModal
            profile={profile}
            initialMode={initialMode}
            onClose={() => setShowModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

      {/* ── Gate overlay ─────────────────────────────────────────────────── */}
      <motion.div
        className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#070d1b] px-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }}
        exit={{ opacity: 0, transition: { duration: 0.35 } }}
      >
        {/* Background orb */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-blue-700/10 blur-[100px] pointer-events-none" />

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/35">
            <CloudSun className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Skydocket</h1>
          <p className="mt-2 max-w-xs text-center text-sm text-slate-400">
            Your household's daily weather intelligence — free, personalized, and private.
          </p>
        </motion.div>

        {/* ── Auth buttons ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm space-y-3"
        >
          <button
            onClick={openSignIn}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-[0.98] transition-all"
          >
            <LogIn className="h-5 w-5" />
            Sign in
          </button>

          <button
            onClick={openSignUp}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-600 bg-slate-800/80 px-6 py-4 text-base font-semibold text-slate-200 hover:bg-slate-700 hover:border-slate-500 active:scale-[0.98] transition-all"
          >
            <UserPlus className="h-5 w-5" />
            Create free account
          </button>

          <p className="pt-1 text-center text-xs text-slate-600">
            Free forever · No credit card required to sign up
          </p>
        </motion.div>

        {/* ── Feature strip ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="mt-10 grid grid-cols-3 gap-3 w-full max-w-sm"
        >
          {FEATURES.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-center"
            >
              <Icon className="mb-2 h-4 w-4 text-blue-400" />
              <p className="text-xs font-semibold text-slate-300 leading-tight">{label}</p>
              <p className="mt-0.5 text-[10px] text-slate-500 leading-tight">{sub}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Version badge ─────────────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-xs text-slate-700"
        >
          v6.0 · Weather, translated into action.
        </motion.p>
      </motion.div>
    </>
  );
}
