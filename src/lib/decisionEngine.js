/**
 * decisionEngine.js — rule-based weather-to-action translator
 *
 * All functions are pure (no side effects, no imports).
 * Input:  normalized weather object + household profile
 * Output: plain-English action strings
 *
 * Weather shape expected:
 *   { currentTemp, currentCondition, pollenLevel,
 *     hourly: [{ hour, temp, rainChance, wind, pollen }] }
 *
 * Profile shape expected:
 *   { kids, hasDog, pets, coldThreshold, commuteHour,
 *     schoolPickupHour, allergySensitive }
 */

// ── Utility ───────────────────────────────────────────────────────────────────

export function formatHour(hour) {
  if (hour === 12) return "12:00 PM";
  if (hour > 12) return `${hour - 12}:00 PM`;
  return `${hour}:00 AM`;
}

// ── Rule 1: Outdoor Window ────────────────────────────────────────────────────
// Find the longest consecutive block of hours where:
//   • rainChance < 30%
//   • wind ≤ 14 mph
//   • temp 60–78°F (comfortable for kids and adults)
// Returns a "HH:MM AM – HH:MM PM" range string.

function findBestOutdoorWindow(hourly) {
  const candidates = hourly.filter(
    (h) => h.rainChance < 30 && h.wind <= 14 && h.temp >= 60 && h.temp <= 78
  );

  if (candidates.length === 0) return "No good outdoor window today";

  let bestStart = candidates[0].hour;
  let bestEnd   = candidates[0].hour;
  let curStart  = candidates[0].hour;
  let curEnd    = candidates[0].hour;

  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].hour === curEnd + 1) {
      curEnd = candidates[i].hour;
    } else {
      if (curEnd - curStart > bestEnd - bestStart) {
        bestStart = curStart;
        bestEnd   = curEnd;
      }
      curStart = candidates[i].hour;
      curEnd   = candidates[i].hour;
    }
  }

  // Check the final run
  if (curEnd - curStart > bestEnd - bestStart) {
    bestStart = curStart;
    bestEnd   = curEnd;
  }

  return `${formatHour(bestStart)}–${formatHour(bestEnd)}`;
}

// ── Rule 2: Clothing ──────────────────────────────────────────────────────────
// CLOTHING RULE:
//   • temp ≤ coldThreshold − 5  → "heavy coat" language
//   • temp ≤ coldThreshold       → "layers" language
//   • temp ≤ 72°F                → light top
//   • otherwise                  → no jacket needed
// Language adjusts when kids are present.

function getClothingAdvice(currentTemp, coldThreshold, hasKids) {
  if (currentTemp <= coldThreshold - 5)
    return hasKids
      ? "Bundle the kids up — pack jackets and warm layers today."
      : "It's cold out. Dress in proper layers today.";

  if (currentTemp <= coldThreshold)
    return hasKids
      ? "Layers are a good call for the kids this morning."
      : "Layers are a good call this morning.";

  if (currentTemp <= 72) return "A light top should be fine for most of the day.";

  return "Keep it light today. No jacket needed.";
}

// ── Rule 3: Commute / Leave-by ────────────────────────────────────────────────
// PRECIPITATION RULE (departure):
//   If rainChance ≥ 50% OR wind ≥ 15 mph at commuteHour → leave 10 min early.
// This also covers the "bring umbrellas" signal for commuters.

function getLeaveEarlyAdvice(hourly, commuteHour) {
  const commuteBlock = hourly.find((h) => h.hour === commuteHour);
  if (!commuteBlock) return "Commute looks normal today.";

  if (commuteBlock.rainChance >= 50 || commuteBlock.wind >= 15) {
    return `Leave 10 minutes early — rain or wind expected around ${formatHour(commuteHour)}.`;
  }

  return "No need to leave early today.";
}

// ── Rule 4: School Pickup ─────────────────────────────────────────────────────
// PRECIPITATION RULE (pickup):
//   If rainChance ≥ 50% at schoolPickupHour → "Bring umbrellas for drop-off."
//   If wind ≥ 15 mph → warn about wind.
// Skipped entirely when profile has no kids.

function getPickupAdvice(hourly, pickupHour, hasKids) {
  if (!hasKids) return null;

  const block = hourly.find((h) => h.hour === pickupHour);
  if (!block) return "Pickup looks clear.";

  if (block.rainChance >= 50) return "Bring umbrellas for school pickup.";
  if (block.wind >= 15) return "Expect a windy pickup — secure any loose items.";
  return "Pickup weather looks manageable.";
}

// ── Rule 5: Pet Walk ──────────────────────────────────────────────────────────
// PET RULE:
//   Requires hasDog = true OR pets > 0.
//   Finds the first hour with rainChance < 30% and temp 55–75°F.
//   → "Great time for a walk" language.
// Returns null if no pet is in the profile.

function getPetAdvice(hourly, hasDog, pets) {
  const hasPet = hasDog || pets > 0;
  if (!hasPet) return null;

  const goodHours = hourly.filter(
    (h) => h.rainChance < 30 && h.temp >= 55 && h.temp <= 75
  );

  if (goodHours.length === 0)
    return "Pet walk timing looks rough today — keep it short.";

  const label = hasDog ? "dog walk" : "pet walk";
  // Surface the best window — first qualifying hour
  return `Best ${label} window starts around ${formatHour(goodHours[0].hour)}.`;
}

// ── Rule 6: Pollen / Allergy ──────────────────────────────────────────────────
// Skipped when allergySensitive = false.
// Checks hourly pollen data after 5 PM for a "high" value.
// NOTE: Live Open-Meteo data uses a fixed "medium" pollen fallback
// (free tier has no pollen endpoint). High pollen fires only with fakeWeather.

function getPollenAdvice(hourly, allergySensitive) {
  if (!allergySensitive) return null;

  const highPollenLater = hourly.some((h) => h.hour >= 17 && h.pollen === "high");
  if (highPollenLater)
    return "High pollen tonight. Limit outdoor time after 5 PM if possible.";

  return "Pollen looks manageable today.";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * buildDailyDecisionPack(weather, profile)
 *
 * Runs all 6 rules and returns a decision pack consumed by the UI.
 * This function is deterministic — same inputs always produce the same output.
 */
export function buildDailyDecisionPack(weather, profile) {
  const hasKids = profile.kids > 0;

  const summary       = `${weather.currentCondition}, ${weather.pollenLevel} pollen by evening.`;
  const clothing      = getClothingAdvice(weather.currentTemp, profile.coldThreshold, hasKids);
  const outdoorWindow = findBestOutdoorWindow(weather.hourly);
  const leaveAdvice   = getLeaveEarlyAdvice(weather.hourly, profile.commuteHour);
  const pickupAdvice  = getPickupAdvice(weather.hourly, profile.schoolPickupHour, hasKids);
  const petAdvice     = getPetAdvice(weather.hourly, profile.hasDog, profile.pets);
  const pollenAdvice  = getPollenAdvice(weather.hourly, profile.allergySensitive);

  return {
    summary,
    clothing,
    outdoorWindow,
    leaveAdvice,
    pickupAdvice,
    petAdvice,
    pollenAdvice,
    recommendations: [
      clothing,
      `Best outdoor play window: ${outdoorWindow}.`,
      ...(pickupAdvice ? [pickupAdvice] : []),
      leaveAdvice,
      ...(petAdvice ? [petAdvice] : []),
      ...(pollenAdvice ? [pollenAdvice] : []),
    ],
  };
}
