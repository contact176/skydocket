import React from "react";
import { motion } from "framer-motion";
import { formatHour } from "../lib/decisionEngine";

const POLLEN_COLOR = {
  low:    "bg-emerald-400",
  medium: "bg-amber-400",
  high:   "bg-red-400",
};

const POLLEN_LABEL = {
  low:    "text-emerald-400",
  medium: "text-amber-400",
  high:   "text-red-400",
};

function RainBar({ pct }) {
  const color =
    pct >= 60 ? "bg-blue-400" :
    pct >= 30 ? "bg-blue-500/70" :
    "bg-blue-600/30";
  return (
    <div className="flex h-10 w-full items-end">
      <motion.div
        className={`w-full rounded-t-sm ${color}`}
        initial={{ height: 4 }}
        animate={{ height: `${Math.max(4, pct)}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        title={`${pct}% rain`}
      />
    </div>
  );
}

const colVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
};

export default function HourlyTimeline({ hourly }) {
  const temps = hourly.map((h) => h.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range  = maxTemp - minTemp || 1;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900 p-5 shadow-xl overflow-hidden">
      <h2 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Hourly forecast</h2>

      {/* Scrollable row */}
      <div className="overflow-x-auto pb-1">
        <motion.div
          className="flex gap-0 min-w-max"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {hourly.map((h) => {
            const pct = 20 + ((h.temp - minTemp) / range) * 60;

            return (
              <motion.div
                key={h.hour}
                variants={colVariants}
                className="flex w-14 shrink-0 flex-col items-center gap-1"
              >
                {/* Hour label */}
                <span className="text-[10px] font-medium text-slate-500">
                  {formatHour(h.hour).replace(":00", "").replace(" ", "")}
                </span>

                {/* Temp */}
                <span className="text-xs font-bold text-white">{h.temp}°</span>

                {/* Temp dot track */}
                <div className="relative flex h-8 w-full items-end justify-center">
                  <div
                    className="h-2 w-2 rounded-full bg-blue-400 shadow shadow-blue-400/60"
                    style={{ marginBottom: `${pct * 0.22}rem` }}
                    title={`${h.temp}°F`}
                  />
                </div>

                {/* Rain bar */}
                <RainBar pct={h.rainChance} />

                {/* Rain % label */}
                <span
                  className={`text-[10px] font-semibold ${
                    h.rainChance >= 50 ? "text-blue-300" : "text-slate-500"
                  }`}
                >
                  {h.rainChance}%
                </span>

                {/* Pollen dot */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className={`h-2 w-2 rounded-full ${POLLEN_COLOR[h.pollen]}`} />
                  <span className={`text-[9px] font-bold uppercase ${POLLEN_LABEL[h.pollen]}`}>
                    {h.pollen[0]}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-700/50 pt-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-400">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> Rain %
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Low pollen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" /> High
        </span>
      </div>
    </div>
  );
}
