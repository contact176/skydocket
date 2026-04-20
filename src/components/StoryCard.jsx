import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CloudRain,
  Car,
  Users,
  Dog,
  Thermometer,
  Trees,
  Flower2,
  Sun,
} from "lucide-react";

// ── Category → icon ───────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  pickup:  Users,
  commute: Car,
  pet:     Dog,
  cold:    Thermometer,
  rain:    CloudRain,
  outdoor: Trees,
  allergy: Flower2,
  clear:   Sun,
};

// ── Urgency → visual treatment ────────────────────────────────────────────────

const URGENCY = {
  "act-now": {
    label:       "ACT NOW",
    wrapperBg:   "bg-rose-500/[0.07]",
    border:      "border-rose-500/40",
    badgeBg:     "bg-rose-500/20 border-rose-500/30 text-rose-300",
    dot:         "bg-rose-400 shadow-[0_0_6px_2px_rgba(251,113,133,0.5)]",
    iconColor:   "text-rose-400",
    divider:     "border-rose-500/20",
    actionColor: "text-rose-300",
  },
  "heads-up": {
    label:       "HEADS UP",
    wrapperBg:   "bg-amber-500/[0.06]",
    border:      "border-amber-500/35",
    badgeBg:     "bg-amber-500/20 border-amber-500/30 text-amber-300",
    dot:         "bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.45)]",
    iconColor:   "text-amber-400",
    divider:     "border-amber-500/20",
    actionColor: "text-amber-300",
  },
  "calm": {
    label:       "TODAY",
    wrapperBg:   "bg-blue-500/[0.05]",
    border:      "border-blue-500/25",
    badgeBg:     "bg-blue-500/15 border-blue-500/25 text-blue-300",
    dot:         "bg-blue-400 shadow-[0_0_6px_2px_rgba(96,165,250,0.4)]",
    iconColor:   "text-blue-400",
    divider:     "border-blue-500/15",
    actionColor: "text-blue-300",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StoryCard({ story }) {
  if (!story) return null;

  const cfg  = URGENCY[story.urgency] ?? URGENCY["calm"];
  const Icon = CATEGORY_ICONS[story.category] ?? Sun;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`mb-8 rounded-[28px] border ${cfg.border} ${cfg.wrapperBg} p-6 shadow-xl`}
    >
      {/* ── Top row: urgency badge + category icon ── */}
      <div className="flex items-center justify-between mb-5">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest ${cfg.badgeBg}`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
        <Icon className={`h-5 w-5 opacity-50 ${cfg.iconColor}`} />
      </div>

      {/* ── Headline ── */}
      <h2 className="text-2xl font-bold leading-snug text-white">
        {story.headline}
      </h2>

      {/* ── Support line ── */}
      {story.support && (
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {story.support}
        </p>
      )}

      {/* ── Divider + action ── */}
      <div className={`mt-5 flex items-center gap-2 border-t ${cfg.divider} pt-4`}>
        <ArrowRight className={`h-4 w-4 shrink-0 ${cfg.actionColor}`} />
        <span className={`text-sm font-semibold ${cfg.actionColor}`}>
          {story.action}
        </span>
      </div>
    </motion.div>
  );
}
