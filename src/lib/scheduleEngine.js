/**
 * scheduleEngine.js — Cross-references user schedule items with hourly weather.
 *
 * Each scheduled event gets an impact assessment:
 *   clear    — no weather concerns at that hour
 *   friction — minor concern (light rain, slight wind) — worth noting
 *   at-risk  — significant disruption likely — action recommended
 *
 * Returns an array of assessments sorted by hour, one per schedule item.
 * All functions are pure. No side effects.
 */

import { formatHour } from "./decisionEngine.js";

// ── Impact thresholds per event type ──────────────────────────────────────────
// Tuned to real-world disruption levels, not just "any bad weather."

const THRESHOLDS = {
  outdoor:  { rain: 30, wind: 14, coldTemp: 38, hotTemp: 92 },
  workout:  { rain: 25, wind: 18, coldTemp: 32, hotTemp: 85 },
  commute:  { rain: 50, wind: 15, coldTemp: 10, hotTemp: 105 },
  errand:   { rain: 45, wind: 22, coldTemp: 20, hotTemp: 100 },
  other:    { rain: 55, wind: 25, coldTemp: 15, hotTemp: 105 },
};

// ── Find the best alternative window ─────────────────────────────────────────
// Looks for a 2-hour block of good conditions on the same day, outside the
// flagged hour. Prefers hours within ±4h of the original time.

function findAlternativeWindow(hourly, type, blockedHour) {
  const t = THRESHOLDS[type] ?? THRESHOLDS.other;
  const good = hourly.filter(
    (h) =>
      h.hour !== blockedHour &&
      h.rainChance < t.rain &&
      h.wind < t.wind &&
      h.temp > t.coldTemp &&
      h.temp < t.hotTemp
  );
  if (good.length === 0) return null;

  // Prefer close-in hours
  const near = good.filter((h) => Math.abs(h.hour - blockedHour) <= 4);
  const pool = near.length > 0 ? near : good;

  // Find first consecutive 2-hour block
  for (let i = 0; i < pool.length - 1; i++) {
    if (pool[i + 1].hour === pool[i].hour + 1) {
      return `${formatHour(pool[i].hour)}–${formatHour(pool[i].hour + 2)}`;
    }
  }
  return formatHour(pool[0].hour);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * assessSchedule(hourly, scheduleItems)
 *
 * Returns one assessment object per schedule item, sorted by hour.
 * Each assessment:
 *   { item, block, status, reason, suggestion }
 */
export function assessSchedule(hourly, scheduleItems) {
  if (!hourly?.length || !scheduleItems?.length) return [];

  const results = scheduleItems.map((item) => {
    const block = hourly.find((h) => h.hour === item.hour);
    if (!block) {
      return { item, block: null, status: "clear", reason: null, suggestion: null };
    }

    const t = THRESHOLDS[item.type] ?? THRESHOLDS.other;
    const frictionThreshold = t.rain * 0.65; // friction fires at 65% of at-risk level

    const rainAtRisk   = block.rainChance >= t.rain;
    const windAtRisk   = block.wind       >= t.wind;
    const coldAtRisk   = block.temp       <= t.coldTemp;
    const hotAtRisk    = block.temp       >= t.hotTemp;
    const rainFriction = block.rainChance >= frictionThreshold && !rainAtRisk;

    let status     = "clear";
    let reason     = null;
    let suggestion = null;

    if (rainAtRisk || windAtRisk || coldAtRisk || hotAtRisk) {
      status = "at-risk";

      if (rainAtRisk)
        reason = `${block.rainChance}% rain at ${formatHour(item.hour)}.`;
      else if (windAtRisk)
        reason = `${block.wind} mph winds at ${formatHour(item.hour)}.`;
      else if (coldAtRisk)
        reason = `${block.temp}°F — too cold for this at ${formatHour(item.hour)}.`;
      else
        reason = `${block.temp}°F — heat risk at ${formatHour(item.hour)}.`;

      const alt = findAlternativeWindow(hourly, item.type, item.hour);
      suggestion = alt
        ? `Better window: ${alt}`
        : "No ideal alternative window today — plan accordingly.";

    } else if (rainFriction) {
      status     = "friction";
      reason     = `${block.rainChance}% rain — light chance of disruption.`;
      suggestion = "Light jacket or umbrella recommended.";
    }

    return { item, block, status, reason, suggestion };
  });

  return results.sort((a, b) => a.item.hour - b.item.hour);
}
