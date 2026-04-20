/**
 * costEngine.test.js
 *
 * Tests for the pure weather-to-cost-intelligence functions in
 * src/lib/costEngine.js. No network calls, no Stripe, no Supabase.
 */

import { describe, it, expect } from "vitest";
import { buildCostIntelligence } from "../lib/costEngine.js";

// ── Shared hourly fixture builder ──────────────────────────────────────────────

/** Build a simple flat hourly array at a given temp, with optional overrides. */
function flatHourly(temp, overrides = {}) {
  return Array.from({ length: 12 }, (_, i) => ({
    hour:       i + 8,
    temp,
    rainChance: overrides.rainChance ?? 5,
    wind:       overrides.wind       ?? 7,
    pollen:     "low",
    ...overrides,
  }));
}

/** Ventilation-friendly hourly: mild, breezy, low rain. */
const ventHourly = Array.from({ length: 12 }, (_, i) => ({
  hour:       i + 8,
  temp:       68,
  rainChance: 10,
  wind:       6,
  pollen:     "low",
}));

// ── Very hot day (temp > 90) ───────────────────────────────────────────────────

describe("buildCostIntelligence — very hot day", () => {
  const weather = { currentTemp: 95, hourly: flatHourly(95) };

  it("returns severity 'high'", () => {
    expect(buildCostIntelligence(weather).severity).toBe("high");
  });

  it("sets peakWindow to 2:00 PM – 8:00 PM", () => {
    expect(buildCostIntelligence(weather).peakWindow).toBe("2:00 PM – 8:00 PM");
  });

  it("mainTip references the temperature and 2 PM", () => {
    const { mainTip } = buildCostIntelligence(weather);
    expect(mainTip).toContain("95°F");
    expect(mainTip).toMatch(/2 PM|2:00 PM/i);
  });

  it("beforePeakItems has at least 3 actionable items", () => {
    expect(buildCostIntelligence(weather).beforePeakItems.length).toBeGreaterThanOrEqual(3);
  });

  it("detail mentions pre-cooling and peak hours", () => {
    const { detail } = buildCostIntelligence(weather);
    expect(detail).toMatch(/pre-cool|peak/i);
  });
});

// ── Hot day (80 < temp ≤ 90) ──────────────────────────────────────────────────

describe("buildCostIntelligence — hot day", () => {
  const weather = { currentTemp: 84, hourly: flatHourly(84) };

  it("returns severity 'medium'", () => {
    expect(buildCostIntelligence(weather).severity).toBe("medium");
  });

  it("sets peakWindow", () => {
    expect(buildCostIntelligence(weather).peakWindow).toBeTruthy();
  });

  it("beforePeakItems is non-empty", () => {
    expect(buildCostIntelligence(weather).beforePeakItems.length).toBeGreaterThan(0);
  });

  it("mainTip mentions high-energy tasks before 2 PM", () => {
    expect(buildCostIntelligence(weather).mainTip).toMatch(/2 PM/i);
  });
});

// ── Very cold day (temp < 25) ─────────────────────────────────────────────────

describe("buildCostIntelligence — very cold day", () => {
  const weather = { currentTemp: 18, hourly: flatHourly(18) };

  it("returns severity 'high'", () => {
    expect(buildCostIntelligence(weather).severity).toBe("high");
  });

  it("peakWindow is null (heating, not cooling)", () => {
    expect(buildCostIntelligence(weather).peakWindow).toBeNull();
  });

  it("mainTip references heating demand", () => {
    expect(buildCostIntelligence(weather).mainTip).toMatch(/heating demand|18°F/i);
  });

  it("beforePeakItems includes thermostat setback advice", () => {
    const { beforePeakItems } = buildCostIntelligence(weather);
    const hasThermostat = beforePeakItems.some((item) => /thermostat/i.test(item));
    expect(hasThermostat).toBe(true);
  });

  it("detail mentions heating costs and thermostat", () => {
    const { detail } = buildCostIntelligence(weather);
    expect(detail).toMatch(/heat|thermostat/i);
  });
});

// ── Cold day (25 ≤ temp < 38) ─────────────────────────────────────────────────

describe("buildCostIntelligence — cold day", () => {
  const weather = { currentTemp: 32, hourly: flatHourly(32) };

  it("returns severity 'medium'", () => {
    expect(buildCostIntelligence(weather).severity).toBe("medium");
  });

  it("peakWindow is null", () => {
    expect(buildCostIntelligence(weather).peakWindow).toBeNull();
  });

  it("mainTip mentions heating costs", () => {
    expect(buildCostIntelligence(weather).mainTip).toMatch(/heat/i);
  });

  it("detail is null (no additional explanation for moderately cold days)", () => {
    expect(buildCostIntelligence(weather).detail).toBeNull();
  });
});

// ── Mild day with good ventilation ────────────────────────────────────────────

describe("buildCostIntelligence — mild day with ventilation", () => {
  const weather = { currentTemp: 68, hourly: ventHourly };

  it("returns severity 'low'", () => {
    expect(buildCostIntelligence(weather).severity).toBe("low");
  });

  it("peakWindow is null", () => {
    expect(buildCostIntelligence(weather).peakWindow).toBeNull();
  });

  it("mainTip promotes opening windows", () => {
    expect(buildCostIntelligence(weather).mainTip).toMatch(/window|ventilation/i);
  });

  it("detail mentions qualifying ventilation hours", () => {
    const { detail } = buildCostIntelligence(weather);
    expect(detail).toMatch(/hours/i);
  });

  it("beforePeakItems suggests skipping powered HVAC", () => {
    const { beforePeakItems } = buildCostIntelligence(weather);
    const hasHVAC = beforePeakItems.some((item) => /HVAC|AC|air/i.test(item));
    expect(hasHVAC).toBe(true);
  });
});

// ── Mild day, no good ventilation ─────────────────────────────────────────────

describe("buildCostIntelligence — mild day, no ventilation", () => {
  // Winds too low (< 3) — ventilation threshold not met
  const weather = {
    currentTemp: 68,
    hourly: flatHourly(68, { wind: 1, rainChance: 5 }),
  };

  it("returns severity 'none'", () => {
    expect(buildCostIntelligence(weather).severity).toBe("none");
  });

  it("peakWindow is null", () => {
    expect(buildCostIntelligence(weather).peakWindow).toBeNull();
  });

  it("beforePeakItems is empty", () => {
    expect(buildCostIntelligence(weather).beforePeakItems).toHaveLength(0);
  });

  it("mainTip indicates a comfortable day with no pressure", () => {
    expect(buildCostIntelligence(weather).mainTip).toMatch(/comfortable|no significant/i);
  });

  it("detail is null", () => {
    expect(buildCostIntelligence(weather).detail).toBeNull();
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("buildCostIntelligence — edge cases", () => {
  it("handles missing weather gracefully (defaults to 65°F mild)", () => {
    const result = buildCostIntelligence(undefined);
    expect(result).toHaveProperty("severity");
    expect(result).toHaveProperty("mainTip");
  });

  it("handles empty hourly array without throwing", () => {
    const result = buildCostIntelligence({ currentTemp: 70, hourly: [] });
    expect(result).toHaveProperty("severity");
  });

  it("boundary: 90°F is hot but not very hot (severity medium)", () => {
    const weather = { currentTemp: 90, hourly: flatHourly(90) };
    // 90 > 80 = hot branch; 90 > 90 is false = not very hot
    expect(buildCostIntelligence(weather).severity).toBe("medium");
  });

  it("boundary: 38°F is not cold (below cold threshold = temp < 38)", () => {
    const weather = { currentTemp: 38, hourly: flatHourly(38) };
    // 38 < 38 is false, so falls through to ventilation or none
    const result = buildCostIntelligence(weather);
    expect(["low", "none"]).toContain(result.severity);
  });

  it("returns an object with all five expected keys", () => {
    const result = buildCostIntelligence({ currentTemp: 70, hourly: [] });
    expect(result).toHaveProperty("severity");
    expect(result).toHaveProperty("peakWindow");
    expect(result).toHaveProperty("beforePeakItems");
    expect(result).toHaveProperty("mainTip");
    expect(result).toHaveProperty("detail");
  });
});
