import React from "react";
import { Clock3, Shirt, Trees, Flower2, Dog, Bell, CalendarDays, Users, ShoppingCart, Zap } from "lucide-react";
import { motion } from "framer-motion";
import HourlyTimeline from "../components/HourlyTimeline";
import PremiumGate from "../components/PremiumGate";
import StoryCard from "../components/StoryCard";
import { assessSchedule } from "../lib/scheduleEngine";
import { formatHour } from "../lib/decisionEngine";

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

// ── CommandHeader ─────────────────────────────────────────────────────────────
// Personalized daily briefing — replaces static marketing hero.

const PRIORITY_NOTES = {
  time:       "Saving you time today.",
  money:      "Looking for cost savings today.",
  stress:     "Keeping things low-friction today.",
  organized:  "Keeping you on track today.",
};

function CommandHeader({ profile, weather, loading, error, usingFallback, locationStatus }) {
  const hour     = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
                "Good evening";

  const priorityNote = profile?.priorityFocus
    ? PRIORITY_NOTES[profile.priorityFocus]
    : null;

  return (
    <motion.section
      className="mb-8 flex flex-wrap items-start justify-between gap-6"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Left: greeting + context */}
      <div>
        <div className="flex flex-wrap items-baseline gap-3 mb-1">
          <h1 className="text-3xl font-bold text-white">{greeting}</h1>
          {priorityNote && (
            <span className="text-sm font-medium text-blue-400">{priorityNote}</span>
          )}
        </div>
        <p className="text-sm text-slate-400">
          {weather.location} &middot; {weather.dateLabel}
        </p>
      </div>

      {/* Right: temp + condition + status badge */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight text-white">
            {weather.currentTemp}°
          </span>
        </div>
        <p className="text-sm text-slate-400 text-right max-w-[220px] leading-snug">
          {weather.currentCondition}
        </p>
        <WeatherSourceBadge
          loading={loading}
          error={error}
          usingFallback={usingFallback}
          locationStatus={locationStatus}
        />
      </div>
    </motion.section>
  );
}

// ── Animation variants ────────────────────────────────────────────────────────

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

function AdvancedPlanning({ weekForecast }) {
  // Loading skeleton
  if (!weekForecast) {
    return (
      <div className="rounded-3xl border border-slate-700/50 bg-slate-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-blue-500/20 border border-blue-500/20 p-3 text-blue-400">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold text-white">7-Day Planning</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-800" />
            ))}
          </div>
          <div className="h-12 rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  // Best day = highest score from tomorrow onward (skip today)
  const upcoming = weekForecast.slice(1);
  const bestDay  = upcoming.length > 0
    ? upcoming.reduce((best, day) => {
        const score     = (100 - day.rainChance) + (day.high >= 60 && day.high <= 82 ? 25 : 0);
        const bestScore = (100 - best.rainChance) + (best.high >= 60 && best.high <= 82 ? 25 : 0);
        return score > bestScore ? day : best;
      }, upcoming[0])
    : null;

  // Notable days with a tip (rain ≥ 40% or extreme temp)
  const notableDays = weekForecast.filter((d) => d.tip && (d.rainChance >= 40 || d.high >= 88 || d.high <= 40));

  return (
    <div className="rounded-3xl border border-slate-700/50 bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="inline-flex rounded-xl bg-blue-500/20 border border-blue-500/20 p-3 text-blue-400">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">7-Day Planning</h3>
          <p className="text-xs text-slate-500 mt-0.5">Live household forecast</p>
        </div>
      </div>

      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {weekForecast.map((day) => (
          <div
            key={day.date}
            className={`flex flex-col items-center gap-1 rounded-xl py-3 px-1 ${
              day.isToday
                ? "bg-blue-500/20 border border-blue-500/30"
                : "bg-slate-800"
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">
              {day.isToday ? "Today" : day.dayLabel}
            </span>
            <span className="text-base leading-none mt-1">{day.emoji}</span>
            <span className="text-sm font-bold text-white">{day.high}°</span>
            <span className="text-[10px] text-slate-500">{day.low}°</span>
            {day.rainChance >= 25 && (
              <span className="text-[9px] font-semibold text-blue-400 leading-none">
                {day.rainChance}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Best day callout */}
      {bestDay && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <span className="text-xl leading-none">{bestDay.emoji}</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Best day this week
            </span>
            <p className="text-sm font-semibold text-white mt-0.5">
              {bestDay.dayLabel} · {bestDay.high}°F · {bestDay.rainChance}% rain
            </p>
          </div>
        </div>
      )}

      {/* Notable day tips */}
      {notableDays.length > 0 && (
        <div className="space-y-2">
          {notableDays.map((day) => (
            <div
              key={day.date}
              className="flex items-start gap-3 rounded-xl bg-slate-800/60 border border-slate-700/40 px-4 py-2.5"
            >
              <span className="text-base leading-none shrink-0 mt-0.5">{day.emoji}</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {day.isToday ? "Today" : day.dayLabel} · {day.high}°F
                </span>
                <p className="text-xs text-slate-300 mt-0.5">{day.tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}
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

// ── ScheduleImpact ────────────────────────────────────────────────────────────
// Shows each user schedule item with its weather impact assessment.

const STATUS_STYLE = {
  "clear":    { dot: "bg-emerald-400", label: "Clear",         labelColor: "text-emerald-400" },
  "friction": { dot: "bg-amber-400",   label: "Light concern", labelColor: "text-amber-400"   },
  "at-risk":  { dot: "bg-rose-400",    label: "At risk",       labelColor: "text-rose-400"    },
};

function ScheduleImpact({ hourly, schedule }) {
  const assessments = assessSchedule(hourly, schedule);
  if (assessments.length === 0) return null;

  function hourLabel(h) {
    if (h === 12) return "12:00 PM";
    if (h > 12)  return `${h - 12}:00 PM`;
    return `${h}:00 AM`;
  }

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Schedule Impact
        </h2>
        <span className="text-xs text-slate-600">{assessments.length} events</span>
      </div>

      <div className="rounded-[24px] border border-slate-700/50 bg-slate-900 divide-y divide-slate-700/50 overflow-hidden">
        {assessments.map(({ item, status, reason, suggestion }) => {
          const s = STATUS_STYLE[status] ?? STATUS_STYLE["clear"];
          return (
            <div key={item.id} className="px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="shrink-0 w-16 text-xs font-semibold text-slate-500">
                  {hourLabel(item.hour)}
                </span>
                <span className="flex-1 text-sm font-semibold text-slate-200">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  <span className={`text-xs font-semibold ${s.labelColor}`}>{s.label}</span>
                </div>
              </div>
              {reason && (
                <div className="mt-1.5 ml-19 pl-16">
                  <p className="text-xs text-slate-500">{reason}</p>
                  {suggestion && (
                    <p className={`mt-0.5 text-xs font-medium ${s.labelColor}`}>→ {suggestion}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

// ── Category dot colors for action plan items ─────────────────────────────────

const CATEGORY_DOT = {
  pickup:  "bg-blue-400",
  commute: "bg-amber-400",
  cold:    "bg-slate-400",
  pet:     "bg-emerald-400",
  errand:  "bg-indigo-400",
  energy:  "bg-yellow-400",
};

// ── ActionPlan ────────────────────────────────────────────────────────────────
// Ranked list of the household's top actions for today.

function ActionPlan({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Today&rsquo;s Action Plan
        </h2>
        <span className="text-xs text-slate-600">{items.length} items</span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-slate-700/50 bg-slate-900 px-4 py-3"
          >
            <span className="shrink-0 w-5 text-center text-xs font-bold text-slate-600">
              {i + 1}
            </span>
            <span
              className={`shrink-0 h-2 w-2 rounded-full ${CATEGORY_DOT[item.category] ?? "bg-slate-500"}`}
            />
            <span className="flex-1 text-sm font-medium text-slate-200">{item.action}</span>
            <span className="shrink-0 text-xs text-slate-500 text-right">{item.timing}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ── Cost intelligence severity → visual style ─────────────────────────────────

const COST_STYLE = {
  high:   { border: "border-rose-500/30",   icon: "bg-rose-500/20 border-rose-500/20 text-rose-400",   badge: "bg-rose-500/15 border-rose-500/25 text-rose-300",   label: "High impact"   },
  medium: { border: "border-amber-500/30",  icon: "bg-amber-500/20 border-amber-500/20 text-amber-400", badge: "bg-amber-500/15 border-amber-500/25 text-amber-300", label: "Moderate"      },
  low:    { border: "border-emerald-500/30",icon: "bg-emerald-500/20 border-emerald-500/20 text-emerald-400", badge: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300", label: "Savings opportunity" },
  none:   { border: "border-slate-700/50",  icon: "bg-yellow-500/20 border-yellow-500/20 text-yellow-400",   badge: null, label: null },
};

// ── TimeMoneySavings ──────────────────────────────────────────────────────────
// Errand window + cost intelligence cards. Only renders when data exists.

function TimeMoneySavings({ errandWindow, costIntelligence }) {
  const hasCost = costIntelligence && costIntelligence.severity !== "none";
  if (!errandWindow && !hasCost) return null;

  const cs = hasCost ? (COST_STYLE[costIntelligence.severity] ?? COST_STYLE.none) : null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
        Save Time &amp; Money
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {errandWindow && (
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 inline-flex rounded-xl bg-indigo-500/20 border border-indigo-500/20 p-3 text-indigo-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">Best errand window</h3>
            <p className="mt-1 text-2xl font-bold text-indigo-300">{errandWindow}</p>
            <p className="mt-2 text-sm text-slate-400">
              Low rain chance, outside rush hours. Fewest delays, least friction.
            </p>
          </div>
        )}

        {hasCost && (
          <div className={`rounded-3xl border ${cs.border} bg-slate-900 p-6 shadow-xl`}>
            {/* Header row */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className={`inline-flex rounded-xl border ${cs.icon} p-3`}>
                <Zap className="h-5 w-5" />
              </div>
              {cs.badge && (
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${cs.badge}`}>
                  {cs.label}
                </span>
              )}
            </div>

            <h3 className="text-xl font-semibold text-white">Energy cost alert</h3>
            <p className="mt-2 text-sm font-medium text-slate-200 leading-6">{costIntelligence.mainTip}</p>

            {/* Peak window badge */}
            {costIntelligence.peakWindow && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2">
                <Clock3 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-300">Peak window: {costIntelligence.peakWindow}</span>
              </div>
            )}

            {/* Before-peak checklist */}
            {costIntelligence.beforePeakItems?.length > 0 && (
              <ul className="mt-4 space-y-2">
                {costIntelligence.beforePeakItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {/* Supporting detail */}
            {costIntelligence.detail && (
              <p className="mt-4 text-xs text-slate-500 leading-5 border-t border-slate-800 pt-3">
                {costIntelligence.detail}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ── DashboardScreen ───────────────────────────────────────────────────────────

export default function DashboardScreen({ fakeWeather, decisionPack, storyCard, actionPlan, costIntelligence, weekForecast, profile, loading, error, usingFallback, locationStatus }) {
  console.log("[SKY] DashboardScreen render — location:", fakeWeather.location, "| locationStatus:", locationStatus, "| usingFallback:", usingFallback);

  // ── Per-card "why" rationale derived from live weather + profile ────────────
  const commuteBlock = fakeWeather.hourly?.find((h) => h.hour === (profile?.commuteHour ?? 17));
  const pickupBlock  = fakeWeather.hourly?.find((h) => h.hour === (profile?.schoolPickupHour ?? 16));
  const coldThresh   = profile?.coldThreshold ?? 60;

  const cards = [
    {
      icon:  Shirt,
      title: "What to wear",
      text:  decisionPack.clothing,
      why:   `${fakeWeather.currentTemp}°F today · your threshold is ${coldThresh}°F`,
    },
    {
      icon:  Clock3,
      title: "Leave-by alert",
      text:  decisionPack.leaveAdvice,
      why:   commuteBlock
        ? commuteBlock.rainChance >= 50
          ? `${commuteBlock.rainChance}% rain at your ${formatHour(profile?.commuteHour ?? 17)} departure`
          : commuteBlock.wind >= 15
          ? `${commuteBlock.wind} mph wind at your departure`
          : `Clear at ${formatHour(profile?.commuteHour ?? 17)}`
        : `Checked against your departure time`,
    },
    {
      icon:  Trees,
      title: "Outdoor window",
      text:  `Best outdoor play window: ${decisionPack.outdoorWindow}.`,
      why:   `Rain < 30%, comfortable temp, wind ≤ 14 mph`,
    },
    {
      icon:  Flower2,
      title: "Allergy mode",
      text:  decisionPack.pollenAdvice || "No allergy alert today.",
      why:   profile?.allergySensitive
        ? `Pollen sensitivity is on in your profile`
        : `Enable allergy sensitivity in your profile`,
    },
    {
      icon:  Dog,
      title: "Pet routine support",
      text:  decisionPack.petAdvice || "No pet profile active.",
      why:   (profile?.hasDog || (profile?.pets ?? 0) > 0)
        ? `Temp 55–75°F window with rain < 30%`
        : `Add a dog to your profile to activate`,
    },
    {
      icon:  Bell,
      title: "Pickup guidance",
      text:  decisionPack.pickupAdvice || "No school pickup in your profile.",
      why:   (profile?.kids ?? 0) > 0 && pickupBlock
        ? pickupBlock.rainChance >= 50
          ? `${pickupBlock.rainChance}% rain at ${formatHour(profile?.schoolPickupHour ?? 16)} pickup`
          : `Clear at ${formatHour(profile?.schoolPickupHour ?? 16)} pickup`
        : `Add kids to your profile to activate`,
    },
  ];

  return (
    <>
      {/* ── Personalized command header ────────────────────────────────────── */}
      <CommandHeader
        profile={profile}
        weather={fakeWeather}
        loading={loading}
        error={error}
        usingFallback={usingFallback}
        locationStatus={locationStatus}
      />

      {/* ── Contextual Story Card ──────────────────────────────────────────── */}
      <StoryCard story={storyCard} />

      {/* ── Schedule Impact ────────────────────────────────────────────────── */}
      <ScheduleImpact hourly={fakeWeather.hourly} schedule={profile?.schedule ?? []} />

      {/* ── Today's Action Plan ────────────────────────────────────────────── */}
      <ActionPlan items={actionPlan} />

      {/* ── Hourly timeline ────────────────────────────────────────────────── */}
      <section className="mt-8">
        <HourlyTimeline hourly={fakeWeather.hourly} />
      </section>

      {/* ── Time & Money savings ───────────────────────────────────────────── */}
      <TimeMoneySavings
        errandWindow={decisionPack.errandWindow}
        costIntelligence={costIntelligence}
      />

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
              className="rounded-3xl border border-slate-700/50 bg-slate-900 p-6 shadow-xl hover:border-slate-600/70 transition-colors flex flex-col"
            >
              <div className="mb-4 inline-flex rounded-xl bg-blue-500/20 border border-blue-500/20 p-3 text-blue-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300 flex-1">{card.text}</p>
              {card.why && (
                <div className="mt-4 border-t border-slate-700/50 pt-3">
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-400">Why: </span>
                    {card.why}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.section>

      {/* ── Premium-gated sections ─────────────────────────────────────────── */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <PremiumGate feature="7-Day Planning">
          <AdvancedPlanning weekForecast={weekForecast} />
        </PremiumGate>

        <PremiumGate feature="Household Sync">
          <HouseholdSyncPreview />
        </PremiumGate>
      </section>
    </>
  );
}
