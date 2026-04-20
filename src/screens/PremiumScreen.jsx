import React, { useState } from "react";
import { Check, Star, Zap, Shield, Bell, MapPin, HeartHandshake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePremium } from "../context/PremiumContext";
import CheckoutModal from "../components/CheckoutModal";

const FREE_FEATURES = [
  "Daily weather summary",
  "Basic clothing advice",
  "Outdoor play window",
  "1 household profile",
];

const PREMIUM_FEATURES = [
  { icon: Bell,           text: "Real-time alerts & push notifications" },
  { icon: Shield,         text: "Pollen & allergy tracker with daily score" },
  { icon: Zap,            text: "School & commute live monitoring" },
  { icon: Star,           text: "Multi-day forecast planning (7 days)" },
  { icon: MapPin,         text: "Multi-city support — home, school, work" },
  { icon: HeartHandshake, text: "Pet walk optimizer with breed-aware temps" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const featureVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const featureItem = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export default function PremiumScreen({ user }) {
  const [billing, setBilling]         = useState("annual");
  const [showCheckout, setShowCheckout] = useState(false);
  const { isPremium, setIsPremium }   = usePremium();

  const monthly = billing === "monthly" ? 4.99 : (44.99 / 12).toFixed(2);

  function handleUpgradeClick() {
    setShowCheckout(true);
  }

  function handleCheckoutSuccess() {
    setIsPremium(true);
  }

  return (
    <>
      {/* Checkout modal */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            billing={billing}
            user={user}
            onClose={() => setShowCheckout(false)}
            onSuccess={handleCheckoutSuccess}
          />
        )}
      </AnimatePresence>

      {/* Hero */}
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-sm font-medium text-blue-300">
          <Star className="h-3.5 w-3.5" />
          Peace of Mind Plan
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Weather clarity for your whole family
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
          Upgrade once. Stop second-guessing the forecast every morning.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center rounded-2xl border border-slate-700 bg-slate-900 p-1 shadow-xl">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-xl px-5 py-2 text-sm font-medium transition-colors ${
              billing === "monthly"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition-colors ${
              billing === "annual"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Annual
            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-white">
              −25%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Free */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="rounded-3xl border border-slate-700/50 bg-slate-900 p-8"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Free</h2>
            <p className="mt-1 text-sm text-slate-400">Everything you need to get started.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="ml-1 text-slate-400">/ month</span>
          </div>
          <ul className="mb-8 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                <Check className="h-4 w-4 shrink-0 text-slate-500" />
                {f}
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 py-3 text-sm font-semibold text-slate-500 cursor-default"
          >
            Current plan
          </button>
        </motion.div>

        {/* Premium */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          className="relative rounded-3xl border-2 border-blue-500/70 bg-slate-900 p-8 shadow-2xl shadow-blue-500/10"
        >
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-blue-600/40">
              <Star className="h-3 w-3" />
              Most popular
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Peace of Mind</h2>
            <p className="mt-1 text-sm text-slate-400">Full household weather intelligence.</p>
          </div>

          <div className="mb-1 flex items-end gap-1">
            <span className="text-4xl font-bold text-white">${monthly}</span>
            <span className="mb-1 text-slate-400">/ month</span>
          </div>
          {billing === "annual" && (
            <p className="mb-6 text-sm text-emerald-400 font-medium">
              Billed as $44.99/year · Save $14.89
            </p>
          )}
          {billing === "monthly" && <div className="mb-6" />}

          <motion.ul
            className="mb-8 space-y-3"
            variants={featureVariants}
            initial="hidden"
            animate="show"
          >
            <motion.li variants={featureItem} className="flex items-center gap-3 text-sm font-medium text-slate-100">
              <Check className="h-4 w-4 shrink-0 text-blue-400" />
              Everything in Free
            </motion.li>
            {PREMIUM_FEATURES.map(({ text }) => (
              <motion.li key={text} variants={featureItem} className="flex items-center gap-3 text-sm text-slate-300">
                <Check className="h-4 w-4 shrink-0 text-blue-400" />
                {text}
              </motion.li>
            ))}
          </motion.ul>

          {isPremium ? (
            <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-center text-sm font-semibold text-emerald-400">
              ✓ SkyDocket Pro — Active
            </div>
          ) : (
            <button
              onClick={handleUpgradeClick}
              className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-[0.98] transition-all"
            >
              {billing === "annual"
                ? "Upgrade now · $44.99/yr"
                : "Upgrade now · $4.99/mo"}
            </button>
          )}
          <p className="mt-3 text-center text-xs text-slate-500">
            Secure payment · Cancel anytime
          </p>
        </motion.div>
      </div>

      {/* Feature highlight strip */}
      <div className="mt-14 rounded-3xl border border-slate-700/50 bg-slate-900 p-8">
        <h3 className="mb-6 text-center text-lg font-semibold text-white">
          What makes Peace of Mind different
        </h3>
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={featureVariants}
          initial="hidden"
          animate="show"
        >
          {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
            <motion.div key={text} variants={featureItem} className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-blue-500/20 border border-blue-500/20 p-2 text-blue-400">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm text-slate-300">{text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
