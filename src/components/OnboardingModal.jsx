import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Baby, Dog, Briefcase, Thermometer, Clock, ArrowRight, Check } from "lucide-react";

const TOTAL_STEPS = 3;

// Departure time options — 5 AM through noon
const DEPARTURE_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12];

function hourLabel(h) {
  if (h === 12) return "12:00 PM";
  if (h > 12) return `${h - 12}:00 PM`;
  return `${h}:00 AM`;
}

function ProgressBar({ step }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-xs text-slate-500">
          {step === 1 ? "Household" : step === 2 ? "Comfort zone" : "Schedule"}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-700">
        <motion.div
          className="h-full rounded-full bg-blue-500"
          initial={false}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function HouseholdStep({ values, onChange }) {
  function toggle(key) {
    onChange((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const options = [
    {
      key: "hasKids",
      icon: Baby,
      label: "Kids",
      desc: "School pickup & outdoor alerts",
    },
    {
      key: "hasDog",
      icon: Dog,
      label: "Dog",
      desc: "Walk windows & pet weather tips",
    },
    {
      key: "isCommuter",
      icon: Briefcase,
      label: "Commuter",
      desc: "Leave-by alerts & rain warnings",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Who&rsquo;s in your household?</h2>
      <p className="text-sm text-slate-400 mb-6">Select all that apply. You can change this later.</p>
      <div className="space-y-3">
        {options.map(({ key, icon: Icon, label, desc }) => {
          const selected = values[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                selected
                  ? "border-blue-500/60 bg-blue-500/10"
                  : "border-slate-700 bg-slate-800 hover:border-slate-600"
              }`}
            >
              <div
                className={`shrink-0 rounded-xl p-2.5 transition-colors ${
                  selected ? "bg-blue-500/20 text-blue-400" : "bg-slate-700 text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className={`text-sm font-semibold ${selected ? "text-white" : "text-slate-300"}`}>
                  {label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
              </div>
              <div
                className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected ? "border-blue-500 bg-blue-500" : "border-slate-600"
                }`}
              >
                {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColdThresholdStep({ value, onChange }) {
  return (
    <div>
      <div className="mb-6 inline-flex rounded-2xl bg-blue-500/20 border border-blue-500/20 p-4 text-blue-400">
        <Thermometer className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">When does it feel cold?</h2>
      <p className="text-sm text-slate-400 mb-8">
        We&rsquo;ll send &ldquo;heavy coat&rdquo; alerts when the temperature drops below this.
      </p>

      {/* Current value display */}
      <div className="mb-6 text-center">
        <span className="text-6xl font-bold text-white">{value}</span>
        <span className="ml-2 text-2xl font-semibold text-slate-400">°F</span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={40}
        max={80}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />

      {/* Tick labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>40°F</span>
        <span>60°F</span>
        <span>80°F</span>
      </div>

      {/* Context hint */}
      <p className="mt-6 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-400">
        {value <= 45
          ? "You're tough. Alerts only for deep cold days."
          : value <= 55
          ? "Only genuinely cold days will trigger alerts."
          : value <= 65
          ? "Good balance — catches most coat-worthy mornings."
          : "You'll get alerts on most cool days."}
      </p>
    </div>
  );
}

function DepartureStep({ value, onChange }) {
  return (
    <div>
      <div className="mb-6 inline-flex rounded-2xl bg-blue-500/20 border border-blue-500/20 p-4 text-blue-400">
        <Clock className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">When do you head out?</h2>
      <p className="text-sm text-slate-400 mb-8">
        We&rsquo;ll check weather conditions around your departure time for leave-by alerts.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {DEPARTURE_OPTIONS.map((h) => {
          const selected = value === h;
          return (
            <button
              key={h}
              type="button"
              onClick={() => onChange(h)}
              className={`rounded-2xl border py-3.5 text-sm font-semibold transition-all ${
                selected
                  ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
              }`}
            >
              {hourLabel(h)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const stepVariants = {
  enter:  { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit:   { opacity: 0, x: -20, transition: { duration: 0.15, ease: "easeIn" } },
};

/**
 * OnboardingModal — 3-step first-time setup overlay.
 *
 * Props:
 *   onComplete(partialProfile) — called with the profile fields to merge
 */
export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(1);

  // Step 1 local state
  const [household, setHousehold] = useState({
    hasKids: false,
    hasDog: false,
    isCommuter: true,
  });
  // Step 2 local state
  const [coldThreshold, setColdThreshold] = useState(60);
  // Step 3 local state
  const [departureHour, setDepartureHour] = useState(8);

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    // Final step — build partial profile and hand off
    onComplete({
      kids:             household.hasKids ? 2 : 0,
      hasDog:           household.hasDog,
      pets:             household.hasDog ? 1 : 0,
      coldThreshold,
      commuteHour:      departureHour,
      // schoolPickupHour defaults stay at their sampleProfile value
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-lg rounded-3xl border border-slate-700/50 bg-slate-900 p-8 shadow-2xl"
      >
        {/* Wordmark */}
        <div className="mb-6 text-xs font-bold uppercase tracking-widest text-blue-400">
          Skydocket Setup
        </div>

        <ProgressBar step={step} />

        {/* Step content with slide animation */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {step === 1 && (
                <HouseholdStep values={household} onChange={setHousehold} />
              )}
              {step === 2 && (
                <ColdThresholdStep value={coldThreshold} onChange={setColdThreshold} />
              )}
              {step === 3 && (
                <DepartureStep value={departureHour} onChange={setDepartureHour} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {/* Back */}
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 disabled:opacity-0 disabled:pointer-events-none transition-colors"
          >
            Back
          </button>

          {/* Next / Finish */}
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
          >
            {step === TOTAL_STEPS ? "Get started" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
