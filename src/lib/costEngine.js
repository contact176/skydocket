/**
 * costEngine.js — Weather-based cost intelligence
 *
 * Produces actionable money-saving recommendations derived entirely from
 * weather data. No external pricing API required.
 *
 * Logic is grounded in real utility economics:
 *   • US residential TOU (time-of-use) peak windows: 2 PM – 8 PM on high-demand days
 *   • Heating and cooling are the largest household electricity costs
 *   • Pre-conditioning a home before peak hours reduces total energy spend
 *   • Draft infiltration and solar gain are weather-dependent cost drivers
 *
 * Returns:
 *   {
 *     severity:         "none" | "low" | "medium" | "high",
 *     peakWindow:       string | null,   // e.g. "2:00 PM – 8:00 PM"
 *     beforePeakItems:  string[],        // actions to do before peak
 *     mainTip:          string,          // one-line headline tip
 *     detail:           string | null,   // supporting explanation
 *   }
 */

export function buildCostIntelligence(weather) {
  const temp   = weather?.currentTemp ?? 65;
  const hourly = weather?.hourly     ?? [];

  const isVeryHot  = temp > 90;
  const isHot      = temp > 80;
  const isVeryCold = temp < 25;
  const isCold     = temp < 38;

  // Natural ventilation opportunity: mild, breezy, low humidity proxy (low rain)
  const ventHours = hourly.filter(
    (h) => h.rainChance < 20 && h.temp >= 60 && h.temp <= 76 && h.wind >= 3 && h.wind <= 12
  );
  const goodVentilation = ventHours.length >= 3;

  // ── Very hot day ────────────────────────────────────────────────────────────
  if (isVeryHot) {
    return {
      severity:        "high",
      peakWindow:      "2:00 PM – 8:00 PM",
      beforePeakItems: [
        "Run dishwasher and laundry before 2:00 PM",
        "Pre-cool your home now — close blinds on south and west windows",
        "Charge devices and EVs before 2:00 PM",
      ],
      mainTip: `${temp}°F means peak AC demand. Run everything high-power before 2 PM.`,
      detail:  "Electricity rates are highest during 2–8 PM on hot days in most utility districts. Pre-cooling is significantly cheaper than cooling during peak.",
    };
  }

  // ── Hot day ─────────────────────────────────────────────────────────────────
  if (isHot) {
    return {
      severity:        "medium",
      peakWindow:      "2:00 PM – 8:00 PM",
      beforePeakItems: [
        "Run dishwasher before 2:00 PM",
        "Pre-cool rooms before noon — close blinds after",
      ],
      mainTip: "Warm day with elevated cooling demand. Shift high-energy tasks before 2 PM.",
      detail:  "Off-peak hours before 2 PM are meaningfully cheaper for running high-energy appliances on a day like this.",
    };
  }

  // ── Very cold day ───────────────────────────────────────────────────────────
  if (isVeryCold) {
    return {
      severity:        "high",
      peakWindow:      null,
      beforePeakItems: [
        `Lower thermostat 2°F when not home — saves ~5% on heating bills`,
        "Check exterior door and window seals before the coldest hours",
        "Run laundry and dishwasher in off-peak evening hours (after 8 PM)",
      ],
      mainTip: `${temp}°F drives high heating demand. Every small efficiency saves real money today.`,
      detail:  "Cold snaps spike natural gas and electric heating costs. Thermostat setbacks when away and draft elimination are the highest-ROI actions.",
    };
  }

  // ── Cold day ────────────────────────────────────────────────────────────────
  if (isCold) {
    return {
      severity:        "medium",
      peakWindow:      null,
      beforePeakItems: [
        "Lower thermostat when away from home today",
        "Check for window drafts — they cost extra on cold days",
      ],
      mainTip: "Cold enough to spike heating costs. Small adjustments matter more today.",
      detail:  null,
    };
  }

  // ── Mild day with good natural ventilation ──────────────────────────────────
  if (goodVentilation) {
    return {
      severity:        "low",
      peakWindow:      null,
      beforePeakItems: [
        "Open windows — free air conditioning today",
        "Skip powered HVAC and let the outside air work",
      ],
      mainTip: "Natural ventilation day. Open windows and skip the AC — it's free.",
      detail:  `Good ventilation conditions through ${ventHours.length} hours today. This is one of the cheapest days to run your home.`,
    };
  }

  // ── Mild day, no special action needed ─────────────────────────────────────
  return {
    severity:        "none",
    peakWindow:      null,
    beforePeakItems: [],
    mainTip:         "Comfortable day. No significant energy cost pressure.",
    detail:          null,
  };
}
