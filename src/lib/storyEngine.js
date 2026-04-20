/**
 * storyEngine.js — Contextual Story Card logic
 *
 * Generates one primary "today strategy" for the household based on:
 *   • live weather data (current + hourly forecast)
 *   • household profile (kids, pets, commute, pickup, thresholds)
 *   • current real clock hour
 *
 * Priority system — highest risk wins:
 *   P1   Commute departure ≤1h away with rain/wind           → act-now
 *   P2   School pickup ≤1h away with rain/wind (kids)        → act-now
 *   P3   School pickup ≤4h away with rain/wind (kids)        → heads-up
 *   P3.5 Both pickup AND commute at risk, morning (kids)     → heads-up
 *   P4   Cold morning (before 11am, temp ≤ threshold)        → heads-up / act-now
 *   P5   Currently raining this hour (after morning)         → heads-up
 *   P6   Rain arriving within 3h                             → heads-up
 *   P7   Commute ≤4h away with rain/wind                     → heads-up
 *   P8   Pet walk window closing (≤2h of good time left)     → act-now
 *   P9   Good outdoor window available now                   → calm
 *   P10  Evening pollen alert (allergySensitive)             → heads-up
 *   P11  School pickup risk (any time, kids)                 → heads-up
 *   P12  Commute risk (any time)                             → heads-up
 *   P13  Fallback: smooth day                                → calm
 *
 * All functions are pure. No side effects.
 *
 * Returns:
 *   {
 *     headline: string,        // primary decisive sentence
 *     support:  string|null,   // secondary context line (optional)
 *     urgency:  "calm" | "heads-up" | "act-now",
 *     action:   string,        // the one next step
 *     category: string,        // icon key: pickup|commute|pet|cold|rain|outdoor|allergy|clear
 *   }
 */

import { formatHour } from "./decisionEngine.js";

// ── Utilities ─────────────────────────────────────────────────────────────────

function getBlock(hourly, hour) {
  return hourly.find((h) => h.hour === hour) ?? null;
}

// Hours from now until target. Returns null if target has already passed.
function hoursUntil(now, target) {
  return target > now ? target - now : null;
}

function make(headline, support, urgency, action, category) {
  return { headline, support, urgency, action, category };
}

// ── Story factories ───────────────────────────────────────────────────────────

function storyCommuteUrgent(commuteHour, block) {
  const hasRain = block.rainChance >= 50;
  return make(
    hasRain
      ? `${block.rainChance}% rain at your ${formatHour(commuteHour)} departure.`
      : `${block.wind} mph winds at your ${formatHour(commuteHour)} departure.`,
    hasRain
      ? `It'll be raining when you leave. Go now and you beat the worst of it.`
      : `Gusts pick up right as you leave. Allow extra time.`,
    "act-now",
    "Leave in the next 10 minutes",
    "commute"
  );
}

function storyCommuteAhead(commuteHour, block) {
  const hasRain = block.rainChance >= 50;
  return make(
    hasRain
      ? `Rain expected at your ${formatHour(commuteHour)} commute.`
      : `Wind picks up around your ${formatHour(commuteHour)} commute.`,
    hasRain
      ? `${block.rainChance}% chance — leave a few minutes early to avoid the worst of it.`
      : `${block.wind} mph expected — allow a little extra time.`,
    "heads-up",
    "Plan to leave a few minutes early",
    "commute"
  );
}

function storyPickupUrgent(pickupHour, block) {
  return make(
    `Pickup is in an hour and it's going to rain.`,
    `${block.rainChance}% at ${formatHour(pickupHour)}. Leave without umbrellas and someone gets soaked.`,
    "act-now",
    "Grab umbrellas and leave a few minutes early",
    "pickup"
  );
}

function storyPickupAhead(pickupHour, block) {
  if (block.rainChance >= 50) {
    return make(
      `Rain at ${formatHour(pickupHour)} pickup. Umbrellas need to be packed before the kids leave.`,
      `${block.rainChance}% chance. If they're not in the bag now, they won't be there.`,
      "heads-up",
      "Put umbrellas in backpacks now",
      "pickup"
    );
  }
  // Wind-only: action scales with severity
  const windAction = block.wind >= 20
    ? "Bring a jacket — wind will make it feel colder than it is"
    : "Allow a few extra minutes — wind slows pickup down";
  return make(
    `Windy pickup at ${formatHour(pickupHour)}.`,
    `${block.wind} mph expected at school pickup.`,
    "heads-up",
    windAction,
    "pickup"
  );
}

function storyPlanBAfternoon(pickupHour, pickupBlock, commuteHour, commuteBlock) {
  return make(
    `Rain hits both pickup and your commute this afternoon.`,
    `${pickupBlock.rainChance}% at ${formatHour(pickupHour)} pickup, ${commuteBlock.rainChance}% at ${formatHour(commuteHour)} departure. Pack for both now.`,
    "heads-up",
    "Umbrellas out — for the kids and for you",
    "pickup"
  );
}

function storyColdMorning(temp, threshold, hasKids) {
  const delta = threshold - temp;
  if (delta >= 10) {
    return make(
      hasKids
        ? `${temp}°F out. The kids need full layers, not just a jacket.`
        : `${temp}°F and it won't warm up for hours. Dress for it.`,
      hasKids
        ? `${delta}° below your threshold. Stays cold until this afternoon.`
        : `${delta}° below your threshold.`,
      "act-now",
      hasKids
        ? "Coat, hat, gloves — before anyone leaves"
        : "Full layers before you leave",
      "cold"
    );
  }
  return make(
    hasKids
      ? `It's ${temp}°F. The kids need a jacket today.`
      : `It's ${temp}°F. Worth grabbing a layer.`,
    hasKids
      ? `${delta}° below your threshold — easy to forget in the morning rush.`
      : `${delta}° below your threshold — you'll notice it on the walk.`,
    "heads-up",
    hasKids
      ? "Add a jacket to every bag"
      : "Grab a layer before you leave",
    "cold"
  );
}

function storyRainingNow(block, clearHour) {
  const clearNote = clearHour
    ? `Eases after ${formatHour(clearHour)}.`
    : `Holds through the evening.`;
  return make(
    `It's raining right now and it holds for a while.`,
    `${block.rainChance}% this hour. ${clearNote}`,
    "heads-up",
    "Keep plans inside for now",
    "rain"
  );
}

function storyRainArriving(rainHour, hoursAway) {
  if (hoursAway <= 1) {
    return make(
      `Rain arrives within the hour.`,
      `Conditions turn around ${formatHour(rainHour)}. Wrap up any outdoor plans now.`,
      "act-now",
      "Get outdoor tasks done now",
      "rain"
    );
  }
  const label = hoursAway === 2 ? "Two hours" : `${hoursAway} hours`;
  return make(
    `${label} of dry left before rain moves in.`,
    `Rain picks up at ${formatHour(rainHour)} and holds through the evening.`,
    "heads-up",
    `Wrap up outdoor tasks before ${formatHour(rainHour)}`,
    "rain"
  );
}

function storyPetClosing(windowEnd, hoursLeft) {
  const timeLabel = hoursLeft === 1 ? "1 hour" : `${hoursLeft} hours`;
  return make(
    `Good dog walk conditions end at ${formatHour(windowEnd)}.`,
    `Rain and wind move in after that. About ${timeLabel} left in the window.`,
    "act-now",
    "Head out now",
    "pet"
  );
}

function storyOutdoor(windowStart, windowEnd, hasKids, hasPet) {
  const who = hasKids ? "the kids" : hasPet ? "the dog" : null;
  return make(
    `Good outdoor window open until ${formatHour(windowEnd)}.`,
    who
      ? `Comfortable temp, light wind, no rain. Good conditions for ${who} right now.`
      : `Best outdoor conditions of the day. Nothing to work around until ${formatHour(windowEnd)}.`,
    "calm",
    who
      ? `Get ${who} outside before ${formatHour(windowEnd)}`
      : `Good time for a walk, errands, or yard work`,
    "outdoor"
  );
}

function storyPollen(nowHour) {
  const isAfternoon = nowHour >= 12;
  return make(
    `High pollen builds this evening.`,
    `Pollen peaks after 5:00 PM — ${isAfternoon ? "limit outdoor time for the rest of today" : "plan outdoor activities for this morning"}.`,
    "heads-up",
    isAfternoon ? "Wrap up outdoor time before 5:00 PM" : "Schedule outdoor activities this morning",
    "allergy"
  );
}

function storyClear(weather) {
  return make(
    `Clean day. No weather prep needed.`,
    `${weather?.currentTemp ?? "--"}°F, no rain, light wind all day.`,
    "calm",
    "No action needed",
    "clear"
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * buildContextualStory(weather, profile, nowHour?)
 *
 * nowHour defaults to the real clock hour. Can be overridden for testing.
 * Degrades gracefully when weather or profile is null/incomplete.
 */
export function buildContextualStory(weather, profile, nowHour = new Date().getHours()) {
  // Guard: degrade gracefully if data is not yet available
  if (!weather || !profile) {
    return make(
      "Fetching your household strategy…",
      "Live weather loading — this will update in a moment.",
      "calm",
      "Stand by",
      "clear"
    );
  }

  const hourly      = weather.hourly ?? [];
  const hasKids     = (profile.kids ?? 0) > 0;
  const hasPet      = profile.hasDog || (profile.pets ?? 0) > 0;
  const commuteHour = profile.commuteHour ?? 17;
  const pickupHour  = profile.schoolPickupHour ?? 16;
  const coldThresh  = profile.coldThreshold ?? 60;

  // Pre-compute shared lookups
  const commuteBlock   = getBlock(hourly, commuteHour);
  const pickupBlock    = getBlock(hourly, pickupHour);
  const currentBlock   = getBlock(hourly, nowHour);
  const hoursToCommute = hoursUntil(nowHour, commuteHour);
  const hoursToPickup  = hoursUntil(nowHour, pickupHour);
  const commuteAtRisk  = commuteBlock && (commuteBlock.rainChance >= 50 || commuteBlock.wind >= 15);
  const pickupAtRisk   = pickupBlock  && (pickupBlock.rainChance  >= 50 || pickupBlock.wind  >= 15);

  // ── P1: Commute ≤1h away, dangerous ─────────────────────────────────────────
  if (commuteAtRisk && hoursToCommute !== null && hoursToCommute <= 1) {
    return storyCommuteUrgent(commuteHour, commuteBlock);
  }

  // ── P2: Pickup ≤1h away, dangerous (kids only) ──────────────────────────────
  if (hasKids && pickupAtRisk && hoursToPickup !== null && hoursToPickup <= 1) {
    return storyPickupUrgent(pickupHour, pickupBlock);
  }

  // ── P3: Pickup ≤4h away, dangerous (kids only) ──────────────────────────────
  if (hasKids && pickupAtRisk && hoursToPickup !== null && hoursToPickup <= 4) {
    return storyPickupAhead(pickupHour, pickupBlock);
  }

  // ── P3.5: Both pickup AND commute risky, still morning (kids) ───────────────
  // Surfaces the full-afternoon risk when neither event is close enough to trigger P1-P3.
  if (
    hasKids &&
    pickupAtRisk && pickupBlock.rainChance >= 50 &&
    commuteAtRisk && commuteBlock.rainChance >= 50 &&
    hoursToPickup !== null && hoursToCommute !== null &&
    nowHour <= 11
  ) {
    return storyPlanBAfternoon(pickupHour, pickupBlock, commuteHour, commuteBlock);
  }

  // ── P4: Cold morning (before 11am, temp at or below threshold) ──────────────
  if (weather.currentTemp <= coldThresh && nowHour <= 10) {
    return storyColdMorning(weather.currentTemp, coldThresh, hasKids);
  }

  // ── P5: Currently raining this hour (after morning) ─────────────────────────
  if (currentBlock?.rainChance >= 50 && nowHour > 10) {
    // Find when it clears (first future hour with rain < 30%)
    const clearBlock = hourly.find((h) => h.hour > nowHour && h.rainChance < 30);
    return storyRainingNow(currentBlock, clearBlock?.hour ?? null);
  }

  // ── P6: Rain arriving within 3h ─────────────────────────────────────────────
  const upcomingHours = hourly.filter((h) => h.hour > nowHour);
  const firstRainHour = upcomingHours.find((h) => h.rainChance >= 50);
  const hoursToRain   = firstRainHour ? hoursUntil(nowHour, firstRainHour.hour) : null;

  if (firstRainHour && hoursToRain !== null && hoursToRain <= 3) {
    return storyRainArriving(firstRainHour.hour, hoursToRain);
  }

  // ── P7: Commute ≤4h away, dangerous ─────────────────────────────────────────
  if (commuteAtRisk && hoursToCommute !== null && hoursToCommute <= 4) {
    return storyCommuteAhead(commuteHour, commuteBlock);
  }

  // ── P8: Pet walk window closing (≤2h of good conditions left) ───────────────
  if (hasPet) {
    const goodPetHours = hourly.filter(
      (h) => h.hour >= nowHour && h.rainChance < 30 && h.temp >= 55 && h.temp <= 75
    );
    if (goodPetHours.length > 0) {
      const windowEnd  = goodPetHours[goodPetHours.length - 1].hour;
      const hoursLeft  = windowEnd - nowHour;
      if (hoursLeft <= 2) {
        return storyPetClosing(windowEnd, hoursLeft);
      }
    }
  }

  // ── P9: Good outdoor window available ───────────────────────────────────────
  const outdoorHours = hourly.filter(
    (h) => h.hour >= nowHour && h.rainChance < 30 && h.wind <= 14 && h.temp >= 60 && h.temp <= 78
  );
  if (outdoorHours.length >= 2) {
    return storyOutdoor(
      outdoorHours[0].hour,
      outdoorHours[outdoorHours.length - 1].hour,
      hasKids,
      hasPet
    );
  }

  // ── P10: Evening pollen alert ────────────────────────────────────────────────
  const highPollenEvening = hourly.some((h) => h.hour >= 17 && h.pollen === "high");
  if (profile.allergySensitive && highPollenEvening) {
    return storyPollen(nowHour);
  }

  // ── P11: Pickup risk, within 6h (kids) ───────────────────────────────────────
  if (hasKids && pickupAtRisk && hoursToPickup !== null && hoursToPickup <= 6) {
    return storyPickupAhead(pickupHour, pickupBlock);
  }

  // ── P12: Commute risk, within 6h ─────────────────────────────────────────────
  if (commuteAtRisk && hoursToCommute !== null && hoursToCommute <= 6) {
    return storyCommuteAhead(commuteHour, commuteBlock);
  }

  // ── P13: Fallback — smooth day ───────────────────────────────────────────────
  return storyClear(weather);
}
