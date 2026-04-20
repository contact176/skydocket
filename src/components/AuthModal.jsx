import React, { useState } from "react";
import { X, Mail, Lock, Loader2, UserPlus, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, signUp } from "../lib/authService";

/**
 * AuthModal — sign in / sign up form.
 *
 * Props:
 *   profile   — current local profile (pushed to Supabase on sign-up)
 *   onClose   — called when the modal should close
 *   onSuccess — called with (user) when auth succeeds
 */
export default function AuthModal({ profile, onClose, onSuccess, initialMode = "signin" }) {
  const [mode, setMode]       = useState(initialMode); // "signin" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data =
        mode === "signup"
          ? await signUp(email, password, profile)
          : await signIn(email, password);

      onSuccess(data.user ?? data.session?.user ?? null);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-3xl border border-slate-700/50 bg-slate-900 p-8 shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Mode toggle */}
        <div className="mb-7 inline-flex rounded-2xl border border-slate-700 bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              mode === "signin" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" /> Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              mode === "signup" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" /> Create account
          </button>
        </div>

        <h2 className="mb-1 text-xl font-bold text-white">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          {mode === "signup"
            ? "Your profile syncs across all your devices."
            : "Sign in to sync your household profile."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} pl-10`}
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              placeholder="Password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pl-10`}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "signup" ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {mode === "signup" && (
          <p className="mt-4 text-center text-xs text-slate-500">
            By signing up you agree to our terms. No spam. Ever.
          </p>
        )}
      </motion.div>
    </div>
  );
}
