/**
 * decisionEngine.test.js
 *
 * Tests for the pure rule-based functions in src/lib/decisionEngine.js.
 * No network calls, no Stripe, no Supabase — entirely deterministic.
 */

import { describe, it, expect } from "vitest";
import {
  formatHour,
  getErrandWindow,
  buildDailyDecisionPack,
  buildActionPlan,
} from "../lib/decisionEngine.js";

// ── Shared fixtures ────────────────────────────────────────────────────────────

/** A typical mild day: comfortable temps, low rain, manageable pollen. */
const mildHourly = [
  { hour: 6,  temp: 64, rainChance: 5,  wind: 6,  pollen: "low"    },
  { hour: 7,  temp: 66, rainChance: 10, wind: 8,  pollen: "low"    },
  { hour: 8,  temp: 68, rainChance: 15, wind: 9,  pollen: "low"    },
  { hour: 9,  temp: 70, rainChance: 10, wind: 7,  pollen: "medium" },
  { hour: 10, temp: 72, rainChance: 5,  wind: 5,  pollen: "medium" },
  { hour: 11, temp: 73, rainChance: 5,  wind: 5,  pollen: "medium" },
  { hour: 12, temp: 74, rainChance: 10, wind: 4,  pollen: "medium" },
  { hour: 13, temp: 74, rainChance: 15, wind: 5,  pollen: "medium" },
  { hour: 14, temp: 73, rainChance: 20, wind: 6,  pollen: "high"   },
  { hour: 15, temp: 70, rainChance: 25, wind: 8,  pollen: "high"   },
  { hour: 16, temp: 68, rainChance: 30, wind: 9,  pollen: "high"   },
  { hour: 17, temp: 65, rainChance: 60, wind: 12, pollen: "high"   },
  { hour: 18, temp: 63, rainChance: 70, wind: 14, pollen: "high"   },
];

const mildWeather = {
  currentTemp:      70,
  currentCondition: "Partly cloudy",
  pollenLevel:      "medium",
  hourly:           mildHourly,
};

/** A rainy commute-hour day */
const rainyHourly = mildHourly.map((h) =>
  h.hour === 8 ? { ...h, rainChance: 80, wind: 20 } : h
);

const rainyWeather = { ...mildWeather, hourly: rainyHourly };

/** Allergy-triggering evening pollen */
const highPollenHourly = mildHourly.map((h) =>
  h.hour >= 17 ? { ...h, pollen: "high" } : h
);

/** A family profile */
const familyProfile = {
  kids:              2,
  hasDog:            true,
  pets:              1,
  coldThreshold:     60,
  commuteHour:       8,
  schoolPickupHour:  15,
  allergySensitive:  true,
  morningPerson:     true,
  transportMode:     "car",
};

/** A solo commuter — no kids, no pets */
const soloProfile = {
  kids:              0,
  hasDog:            false,
  pets:              0,
  coldThreshold:     55,
  commuteHour:       8,
  schoolPickupHour:  15,
  allergySensitive:  false,
  morningPerson:     true,
  transportMode:     "transit",
};

// ── formatHour ─────────────────────────────────────────────────────────────────

describe("formatHour", () => {
  it("formats midnight-adjacent morning hours", () => {
    expect(formatHour(6)).toBe("6:00 AM");
    expect(formatHour(9)).toBe("9:00 AM");
    expect(formatHour(11)).toBe("11:00 AM");
  });

  it("formats noon as 12:00 PM", () => {
    expect(formatHour(12)).toBe("12:00 PM");
  });

  it("converts afternoon hours to 12-hour PM format", () => {
    expect(formatHour(13)).toBe("1:00 PM");
    expect(formatHour(15)).toBe("3:00 PM");
    expect(formatHour(18)).toBe("6:00 PM");
    expect(formatHour(21)).toBe("9:00 PM");
  });
});

// ── getErrandWindow ────────────────────────────────────────────────────────────

describe("getErrandWindow", () => {
  it("returns a window string for a morning person on a mild day", () => {
    const result = getErrandWindow(mildHourly, true, 0);
    expect(result).toBeTruthy();
    expect(result).toMatch(/AM|PM/);
  });

  it("returns a window string for an evening person on a mild day", () => {
    const result = getErrandWindow(mildHourly, false, 0);
    expect(result).toBeTruthy();
    expect(result).toMatch(/PM/);
  });

  it("skips rush-hour slots (7, 8, 16, 17, 18)", () => {
    // Force all good hours to be in rush time — no valid window
    const rushOnlyHourly = [
      { hour: 7,  temp: 70, rainChance: 5,  wind: 5 },
      { hour: 8,  temp: 70, rainChance: 5,  wind: 5 },
      { hour: 16, temp: 70, rainChance: 5,  wind: 5 },
      { hour: 17, temp: 70, rainChance: 5,  wind: 5 },
      { hour: 18, temp: 70, rainChance: 5,  wind: 5 },
    ];
    const result = getErrandWindow(rushOnlyHourly, true, 0);
    expect(result).toBeNull();
  });

  it("returns null when all hours have high rain or cold temps", () => {
    const badHourly = mildHourly.map((h) => ({ ...h, rainChance: 90 }));
    expect(getErrandWindow(badHourly, true, 0)).toBeNull();
  });

  it("respects nowHour — does not surface past hours", () => {
    // nowHour = 14 means 6–13 are already past
    const result = getErrandWindow(mildHourly, true, 14);
    // morning preference window (9–13) is fully in the past, falls back to general pool
    expect(result).toBeTruthy();
  });
});

// ── buildDailyDecisionPack ─────────────────────────────────────────────────────

describe("buildDailyDecisionPack", () => {
  it("returns all expected keys", () => {
    const pack = buildDailyDecisionPack(mildWeather, familyProfile);
    expect(pack).toHaveProperty("summary");
    expect(pack).toHaveProperty("clothing");
    expect(pack).toHaveProperty("outdoorWindow");
    expect(pack).toHaveProperty("leaveAdvice");
    expect(pack).toHaveProperty("pickupAdvice");
    expect(pack).toHaveProperty("petAdvice");
    expect(pack).toHaveProperty("pollenAdvice");
    expect(pack).toHaveProperty("energyTip");
    expect(pack).toHaveProperty("errandWindow");
    expect(pack).toHaveProperty("recommendations");
  });

  it("includes weather condition and pollen in the summary", () => {
    const { summary } = buildDailyDecisionPack(mildWeather, familyProfile);
    expect(summary).toContain("Partly cloudy");
    expect(summary).toContain("medium pollen");
  });

  it("gives clothing advice based on temp vs coldThreshold", () => {
    // 70°F, coldThreshold = 60 → temp > threshold, but temp ≤ 72 → light top
    const { clothing } = buildDailyDecisionPack(mildWeather, familyProfile);
    expect(clothing).toMatch(/light top/i);
  });

  it("gives heavy coat advice when temp is far below coldThreshold", () => {
    const coldWeather = { ...mildWeather, currentTemp: 45 };
    const { clothing } = buildDailyDecisionPack(coldWeather, familyProfile);
    // 45°F ≤ 60 - 5 = 55 → heavy coat
    expect(clothing).toMatch(/jacket|layers|bundle/i);
  });

  it("layers advice when temp is just at or below coldThreshold", () => {
    const coolWeather = { ...mildWeather, currentTemp: 58 };
    const { clothing } = buildDailyDecisionPack(coolWeather, familyProfile);
    // 58 ≤ 60 but > 55 → layers
    expect(clothing).toMatch(/layers/i);
  });

  it("returns null pickupAdvice when profile has no kids", () => {
    const { pickupAdvice } = buildDailyDecisionPack(mildWeather, soloProfile);
    expect(pickupAdvice).toBeNull();
  });

  it("returns pickup advice when profile has kids", () => {
    const { pickupAdvice } = buildDailyDecisionPack(mildWeather, familyProfile);
    expect(pickupAdvice).toBeTruthy();
  });

  it("returns pet advice when profile has a dog", () => {
    const { petAdvice } = buildDailyDecisionPack(mildWeather, familyProfile);
    expect(petAdvice).toBeTruthy();
    expect(petAdvice).toMatch(/dog walk|pet walk/i);
  });

  it("returns null petAdvice when profile has no pets", () => {
    const { petAdvice } = buildDailyDecisionPack(mildWeather, soloProfile);
    expect(petAdvice).toBeNull();
  });

  it("returns null pollenAdvice when allergySensitive is false", () => {
    const { pollenAdvice } = buildDailyDecisionPack(mildWeather, soloProfile);
    expect(pollenAdvice).toBeNull();
  });

  it("fires pollen alert when evening has high pollen and user is sensitive", () => {
    const highPollenWeather = { ...mildWeather, hourly: highPollenHourly };
    const { pollenAdvice } = buildDailyDecisionPack(highPollenWeather, familyProfile);
    expect(pollenAdvice).toMatch(/high pollen/i);
  });

  it("returns no-need-to-leave-early on a clear commute", () => {
    const { leaveAdvice } = buildDailyDecisionPack(mildWeather, familyProfile);
    expect(leaveAdvice).toMatch(/no need/i);
  });

  it("flags early departure when commute hour has rain ≥ 50%", () => {
    const { leaveAdvice } = buildDailyDecisionPack(rainyWeather, familyProfile);
    expect(leaveAdvice).toMatch(/leave 10 minutes early/i);
  });

  it("recommendations array contains at least clothing and outdoor window", () => {
    const { recommendations } = buildDailyDecisionPack(mildWeather, familyProfile);
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThanOrEqual(2);
  });
});

// ── buildActionPlan ────────────────────────────────────────────────────────────

describe("buildActionPlan", () => {
  it("returns an empty array when weather or profile is falsy", () => {
    expect(buildActionPlan(null, familyProfile)).toEqual([]);
    expect(buildActionPlan(mildWeather, null)).toEqual([]);
  });

  it("returns at most 5 items", () => {
    const items = buildActionPlan(mildWeather, familyProfile, 0);
    expect(items.length).toBeLessThanOrEqual(5);
  });

  it("every item has action, timing, and category fields", () => {
    const items = buildActionPlan(mildWeather, familyProfile, 0);
    items.forEach((item) => {
      expect(item).toHaveProperty("action");
      expect(item).toHaveProperty("timing");
      expect(item).toHaveProperty("category");
    });
  });

  it("includes a pet walk item when profile has a dog", () => {
    const items = buildActionPlan(mildWeather, familyProfile, 0);
    const petItem = items.find((i) => i.category === "pet");
    expect(petItem).toBeTruthy();
  });

  it("does not include a pet walk item when profile has no pets", () => {
    const items = buildActionPlan(mildWeather, soloProfile, 0);
    const petItem = items.find((i) => i.category === "pet");
    expect(petItem).toBeUndefined();
  });

  it("includes commute item when commute hour has bad weather", () => {
    const items = buildActionPlan(rainyWeather, familyProfile, 0);
    const commuteItem = items.find((i) => i.category === "commute");
    expect(commuteItem).toBeTruthy();
    expect(commuteItem.action).toMatch(/leave/i);
  });

  it("uses 15-minute lead for transit commuters", () => {
    const transitProfile = { ...familyProfile, transportMode: "transit" };
    const items = buildActionPlan(rainyWeather, transitProfile, 0);
    const commuteItem = items.find((i) => i.category === "commute");
    expect(commuteItem?.action).toMatch(/15 minutes/i);
  });

  it("uses 10-minute lead for car commuters", () => {
    const items = buildActionPlan(rainyWeather, familyProfile, 0);
    const commuteItem = items.find((i) => i.category === "commute");
    expect(commuteItem?.action).toMatch(/10 minutes/i);
  });

  it("does not surface past commute hour when nowHour is past it", () => {
    // commuteHour = 8; nowHour = 10 means it's already past
    const items = buildActionPlan(rainyWeather, familyProfile, 10);
    const commuteItem = items.find((i) => i.category === "commute");
    expect(commuteItem).toBeUndefined();
  });

  it("includes energy tip for a very hot day", () => {
    const hotWeather = { ...mildWeather, currentTemp: 95 };
    const items = buildActionPlan(hotWeather, soloProfile, 0);
    const energyItem = items.find((i) => i.category === "energy");
    expect(energyItem).toBeTruthy();
    expect(energyItem.action).toMatch(/AC|fans|2 PM/i);
  });

  it("includes cold clothing item in the morning when temp is far below threshold", () => {
    const coldWeather = { ...mildWeather, currentTemp: 30 };
    const items = buildActionPlan(coldWeather, familyProfile, 6);
    const coldItem = items.find((i) => i.category === "cold");
    expect(coldItem).toBeTruthy();
  });

  it("skips cold clothing item if nowHour is past 10 AM", () => {
    const coldWeather = { ...mildWeather, currentTemp: 30 };
    const items = buildActionPlan(coldWeather, familyProfile, 11);
    const coldItem = items.find((i) => i.category === "cold");
    expect(coldItem).toBeUndefined();
  });
});
