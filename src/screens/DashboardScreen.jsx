import React from "react";
import { Clock3, Shirt, Trees, Flower2, Dog, Bell, CalendarDays, Users } from "lucide-react";
import { motion } from "framer-motion";
import HourlyTimeline from "../components/HourlyTimeline";
import PremiumGate from "../components/PremiumGate";

// ── WeatherSourceBadge ─────────────────────────────────────────────────────────
// Shows live data status above the weather card. Five distinct states.

function WeatherSourceBadge({ loading, error, usingFallback, locationStatus }) {
  if (loading) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-300">
        <span className="h-3 w-3 animate-spin rounded-full border border-blue-400 border-t-transparent shrink-0" />
        Fetching live weather&hellip;
      </div>
    );
  }
  if (usingFallback) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
        <span className="shrink-0">⚠</span>
        <span>Demo data only — {error ? `API error: ${error}` : "live weather unavailable"}</span>
      </div>
    );
  }
  if (locationStatus === "pending") {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-300">
        <span className="h-3 w-3 animate-spin rounded-full border border-blue-400 border-t-transparent shrink-0" />
        Live weather · detecting your location&hellip;
      </div>
    );
  }
  if (locationStatus === "failed") {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
        <span className="shrink-0">⚠</span>
        Live weather · location unavailable — showing Toronto, ON defaults
      </div>
    );
  }
  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400">
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow shadow-emerald-400/60" />
      Live weather · Open-Meteo
    </div>
  );
}

// ── Animation variants ────────────────────────────────────────────────────────

const heroVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

const cardList = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

// ── Placeholder content for gated sections ────────────────────────────────────
// These are shown blurred behind the PremiumGate lock overlay.

function AdvancedPlanningPreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const temps = [62, 58, 71, 75, 68, 55, 60];
  return (
    <div className="rounded-3xl border border-slate-700/50 bg-slate-900 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex rounded-xl bg-blue-500/20 border border-blue-500/20 p-3 text-blue-400">
          <CalendarDays className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-semibold text-white">Advanced Planning</h3>
      </div>
      <p className="mb-4 text-sm text-slate-400">7-day household forecast with action recommendations.</p>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => (
          <div key={d} className="flex flex-col items-center gap-1 rounded-xl bg-slate-800 py-3">
            <span className="text-[10px] font-semibold text-slate-500">{d}</span>
            <span className="text-sm font-bold text-white">{temps[i]}°</span>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HouseholdSyncPreview() {
  const members = ["You", "Partner", "School"];
  return (
    <div className="rounded-3xl border border-slate-700/50 bg-slate-900 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex rounded-xl bg-blue-500/20 border border-blue-500/20 p-3 text-blue-400">
          <Users className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-semibold text-white">Household Sync</h3>
      </div>
      <p className="mb-4 text-sm text-slate-400">Share your household profile across devices and family members.</p>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m} className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3">
            <span className="text-sm font-medium text-slate-200">{m}</span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              Synced
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DashboardScreen ───────────────────────────────────────────────────────────

export default function DashboardScreen({ fakeWeather, decisionPack, loading, error, usingFallback, locationStatus }) {
  console.log("[SKY] DashboardScreen render — location:", fakeWeather.location, "| locationStatus:", locationStatus, "| usingFallback:", usingFallback);

  const cards = [
    { icon: Shirt,   title: "What to wear",        text: decisionPack.clothing },
    { icon: Clock3,  title: "Leave-by alert",       text: decisionPack.leaveAdvice },
    { icon: Trees,   title: "Outdoor window",       text: `Best outdoor play window: ${decisionPack.outdoorWindow}.` },
    { icon: Flower2, title: "Allergy mode",         text: decisionPack.pollenAdvice  || "No allergy alert today." },
    { icon: Dog,     title: "Pet routine support",  text: decisionPack.petAdvice     || "No pet profile active." },
    { icon: Bell,    title: "Pickup guidance",      text: decisionPack.pickupAdvice  || "No school pickup in your profile." },
  ];

  return (
    <>
      {/* ── Hero + live weather card ───────────────────────────────────────── */}
      <motion.section
        className="grid gap-8 lg:grid-cols-2"
        variants={heroVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={heroItem}>
          <span className="inline-flex rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-sm font-medium text-blue-300">
            AI weather app for busy households
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Stop checking the weather. Start knowing what to do.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Skydocket turns weather forecasts into simple, personalized daily decisions
            for your family, commute, pets, and home.
          </p>
        </motion.div>

        <motion.div
          variants={heroItem}
          className="rounded-[28px] border border-slate-700/50 bg-slate-900 p-5 shadow-xl"
        >
          <WeatherSourceBadge
            loading={loading}
            error={error}
            usingFallback={usingFallback}
            locationStatus={locationStatus}
          />

          <div className="flex items-center justify-between pb-4">
            <div>
              <div className="text-sm font-semibold text-slate-100">{fakeWeather.location}</div>
              <div className="text-xs text-slate-400">{fakeWeather.dateLabel}</div>
            </div>
            <div className="text-2xl font-bold text-white">{fakeWeather.currentTemp}°</div>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-800 p-5">
            <h2 className="text-lg font-semibold text-white">Today for your household</h2>
            <p className="mt-1 text-sm text-slate-300">{decisionPack.summary}</p>

            <ul className="mt-4 space-y-3">
              {decisionPack.recommendations.map((item, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-3 text-sm font-medium text-slate-100"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.section>

      {/* ── Hourly timeline ────────────────────────────────────────────────── */}
      <section className="mt-8">
        <HourlyTimeline hourly={fakeWeather.hourly} />
      </section>

      {/* ── Decision cards (free tier) ─────────────────────────────────────── */}
      <motion.section
        className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        variants={cardList}
        initial="hidden"
        animate="show"
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              variants={cardItem}
              className="rounded-3xl border border-slate-700/50 bg-slate-900 p-6 shadow-xl hover:border-slate-600/70 transition-colors"
            >
              <div className="mb-4 inline-flex rounded-xl bg-blue-500/20 border border-blue-500/20 p-3 text-blue-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{card.text}</p>
            </motion.div>
          );
        })}
      </motion.section>

      {/* ── Premium-gated sections ─────────────────────────────────────────── */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <PremiumGate feature="Advanced Planning">
          <AdvancedPlanningPreview />
        </PremiumGate>

        <PremiumGate feature="Household Sync">
          <HouseholdSyncPreview />
        </PremiumGate>
      </section>
    </>
  );
}
