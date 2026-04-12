import React from "react";
import {
  CloudRain, Wind, Flower2, Dog, Bus, School,
  CheckCircle2, AlertTriangle, Info, ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatHour } from "../lib/decisionEngine";

const REF_HOUR = 9;

const SEVERITY = {
  critical: {
    badge:  "bg-red-500/20 text-red-300 border-red-500/30",
    card:   "border-red-500/30 bg-red-500/10",
    icon:   ShieldAlert,
    dot:    "bg-red-400",
    text:   "text-red-300",
  },
  warning: {
    badge:  "bg-amber-500/20 text-amber-300 border-amber-500/30",
    card:   "border-amber-500/30 bg-amber-500/10",
    icon:   AlertTriangle,
    dot:    "bg-amber-400",
    text:   "text-amber-300",
  },
  info: {
    badge:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
    card:   "border-blue-500/30 bg-blue-500/10",
    icon:   Info,
    dot:    "bg-blue-400",
    text:   "text-blue-300",
  },
  clear: {
    badge:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    card:   "border-emerald-500/30 bg-emerald-500/10",
    icon:   CheckCircle2,
    dot:    "bg-emerald-400",
    text:   "text-emerald-300",
  },
};

function buildAlerts(fakeWeather, decisionPack, profile) {
  const { hourly } = fakeWeather;

  const active = [];

  const imminentRain = hourly.filter(
    (h) => h.hour > REF_HOUR && h.hour <= REF_HOUR + 2 && h.rainChance >= 40
  );
  if (imminentRain.length > 0) {
    active.push({
      severity: "warning",
      typeIcon: CloudRain,
      title: "Rain arriving soon",
      detail: `${imminentRain[0].rainChance}% chance around ${formatHour(imminentRain[0].hour)}. Grab an umbrella before you head out.`,
    });
  }

  const highWind = hourly.find((h) => h.hour === REF_HOUR && h.wind >= 15);
  if (highWind) {
    active.push({
      severity: "warning",
      typeIcon: Wind,
      title: "High winds right now",
      detail: `Winds at ${highWind.wind} mph. Secure loose outdoor items.`,
    });
  }

  if (active.length === 0) {
    active.push({
      severity: "clear",
      typeIcon: CheckCircle2,
      title: "All clear right now",
      detail: "No immediate weather concerns for the next couple of hours. Enjoy your morning.",
    });
  }

  const upcoming = [];

  const rainHours = hourly.filter((h) => h.hour > REF_HOUR + 2 && h.rainChance >= 40);
  if (rainHours.length > 0) {
    const peak = rainHours.reduce((a, b) => (b.rainChance > a.rainChance ? b : a));
    upcoming.push({
      hour: rainHours[0].hour,
      severity: peak.rainChance >= 60 ? "warning" : "info",
      typeIcon: CloudRain,
      title: "Rain incoming",
      time: formatHour(rainHours[0].hour),
      detail: `Starts around ${formatHour(rainHours[0].hour)}, peaking at ${peak.rainChance}% by ${formatHour(peak.hour)}.`,
    });
  }

  if (decisionPack.pickupAdvice) {
    const block = hourly.find((h) => h.hour === profile.schoolPickupHour);
    upcoming.push({
      hour: profile.schoolPickupHour,
      severity: block?.rainChance >= 50 ? "warning" : "info",
      typeIcon: School,
      title: "School pickup",
      time: formatHour(profile.schoolPickupHour),
      detail: decisionPack.pickupAdvice,
    });
  }

  const commuteBlock = hourly.find((h) => h.hour === profile.commuteHour);
  if (commuteBlock) {
    const bad = commuteBlock.rainChance >= 50 || commuteBlock.wind >= 15;
    upcoming.push({
      hour: profile.commuteHour,
      severity: bad ? "warning" : "clear",
      typeIcon: Bus,
      title: "Commute window",
      time: formatHour(profile.commuteHour),
      detail: decisionPack.leaveAdvice,
    });
  }

  if (decisionPack.pollenAdvice) {
    upcoming.push({
      hour: 17,
      severity: "warning",
      typeIcon: Flower2,
      title: "Pollen spike",
      time: "Evening",
      detail: decisionPack.pollenAdvice,
    });
  }

  if (decisionPack.petAdvice) {
    const goodHour = hourly.find(
      (h) => h.hour > REF_HOUR && h.rainChance < 30 && h.temp >= 55 && h.temp <= 75
    );
    if (goodHour) {
      const label = profile.hasDog ? "dog walk" : "pet walk";
      upcoming.push({
        hour: goodHour.hour,
        severity: "info",
        typeIcon: Dog,
        title: "Pet walk window",
        time: formatHour(goodHour.hour),
        detail: `Next ${label} window starts around ${formatHour(goodHour.hour)}.`,
      });
    }
  }

  upcoming.sort((a, b) => a.hour - b.hour);

  return { active, upcoming };
}

const listVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -14 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

function ActiveCard({ alert }) {
  const s = SEVERITY[alert.severity];
  const TypeIcon = alert.typeIcon;
  const SevIcon = s.icon;
  return (
    <motion.div variants={itemVariants} className={`rounded-2xl border p-5 ${s.card}`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-xl border p-2.5 ${s.badge}`}>
          <TypeIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className={`flex items-center gap-2 ${s.text}`}>
            <SevIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">{alert.title}</span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{alert.detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

function UpcomingRow({ alert }) {
  const s = SEVERITY[alert.severity];
  const TypeIcon = alert.typeIcon;
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-start gap-4 rounded-2xl border border-slate-700/50 bg-slate-900 p-4"
    >
      <div className="mt-0.5 flex flex-col items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
      </div>
      <div className={`rounded-xl border p-2 ${s.badge} shrink-0`}>
        <TypeIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white">{alert.title}</span>
          <span className="shrink-0 rounded-full border border-slate-600 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            {alert.time}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">{alert.detail}</p>
      </div>
    </motion.div>
  );
}

export default function AlertsScreen({ fakeWeather, decisionPack, profile }) {
  const { active, upcoming } = buildAlerts(fakeWeather, decisionPack, profile);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Alerts</h1>
        <p className="mt-2 text-slate-400">
          Weather events and household alerts for {fakeWeather.location} · {fakeWeather.dateLabel}
        </p>
      </div>

      {/* Active alerts */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Active now
        </h2>
        <motion.div
          className="space-y-3"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {active.map((a, i) => (
            <ActiveCard key={i} alert={a} />
          ))}
        </motion.div>
      </section>

      {/* Upcoming alerts */}
      {upcoming.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Coming up today
          </h2>
          <motion.div
            className="space-y-3"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {upcoming.map((a, i) => (
              <UpcomingRow key={i} alert={a} />
            ))}
          </motion.div>
        </section>
      )}
    </>
  );
}
