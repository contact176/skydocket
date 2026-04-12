/**
 * weatherService.js — V5 live weather layer
 *
 * Provider:  Open-Meteo (https://open-meteo.com)
 *   • Free, no API key, CORS-safe from the browser
 *   • Returns hourly temp (°F), precipitation probability (%),
 *     wind speed (mph), and WMO weather code
 *   • Does NOT provide pollen data on the free tier — see POLLEN note below
 *
 * Location strategy (two-phase, see App.jsx):
 *   Phase 1 — fetchWeatherForCoords(DEFAULTS) fires immediately, no geolocation wait
 *   Phase 2 — resolveCoords() runs in background with no artificial timeout;
 *              if it resolves, App re-fetches with real coordinates
 */

export const DEFAULTS = {
  lat:      43.7001,
  lon:     -79.4163,
  location: "Toronto, ON",
};

// ── Geolocation ───────────────────────────────────────────────────────────────
// No timeout set — let the browser (and OS Location Service) take as long as
// needed. The two-phase pattern in App.jsx means users are never blocked waiting
// for this; it upgrades the weather silently when coords arrive.

async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const city = data.city || data.locality || "";
    const subdivision = data.principalSubdivisionCode || "";
    // principalSubdivisionCode is "US-IN", "CA-ON", etc. — extract the part after the dash
    const stateCode = subdivision.includes("-") ? subdivision.split("-")[1] : subdivision;
    if (city && stateCode) return `${city}, ${stateCode}`;
    if (city && data.countryCode) return `${city}, ${data.countryCode}`;
    return "Your location";
  } catch (err) {
    console.warn("[SKY] reverseGeocode failed:", err.message);
    return "Your location";
  }
}

export function resolveCoords() {
  return new Promise((resolve, reject) => {
    console.log("[SKY] resolveCoords: navigator.geolocation =", !!navigator.geolocation);
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        console.log("[SKY] resolveCoords: SUCCESS lat=", lat, "lon=", lon, "accuracy=", accuracy, "m");
        const location = await reverseGeocode(lat, lon);
        console.log("[SKY] resolveCoords: location label =", location);
        resolve({ lat, lon, location });
      },
      (err) => {
        console.error("[SKY] resolveCoords: FAILED code=", err.code, "message=", err.message);
        // code 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        reject(err);
      },
      { maximumAge: 0 },
    );
  });
}

// ── WMO weather code → human string ──────────────────────────────────────────

function wmoCondition(code, temp) {
  if (code === 0)  return "Clear skies today";
  if (code <= 3)   return "Partly cloudy";
  if (code <= 48)  return "Foggy conditions";
  if (code <= 55)  return "Light drizzle";
  if (code <= 65)  return temp < 50 ? "Cold with rain" : "Rainy conditions";
  if (code <= 77)  return "Snow expected";
  if (code <= 82)  return temp < 45 ? "Cold with rain showers" : "Rain showers likely";
  if (code <= 86)  return "Snow showers";
  if (code >= 95)  return "Thunderstorms possible";
  return "Variable conditions";
}

function buildConditionString(times, codes, currentCode, currentTemp) {
  const idx = times.findIndex(t => parseHour(t) === 15);
  if (idx < 0) return wmoCondition(currentCode, currentTemp);
  const morning   = wmoCondition(currentCode, currentTemp);
  const afternoon = wmoCondition(codes[idx], currentTemp);
  return morning === afternoon
    ? morning
    : `${morning}, ${afternoon.toLowerCase()} later`;
}

// ── String helpers ────────────────────────────────────────────────────────────

function parseHour(timeStr) {
  return parseInt(timeStr.split("T")[1].split(":")[0], 10);
}

function parseDateLabel(timeStr) {
  return new Date(timeStr).toLocaleDateString("en-US", { weekday: "long" });
}

// ── Normaliser ────────────────────────────────────────────────────────────────

function normalizeOpenMeteo(data, location) {
  const { hourly } = data;
  const { time, temperature_2m, precipitation_probability, windspeed_10m, weathercode } = hourly;

  const currentHour = new Date().getHours();
  let currentIdx = time.findIndex(t => parseHour(t) === currentHour);
  if (currentIdx < 0) currentIdx = Math.min(12, time.length - 1);

  const currentTemp = Math.round(temperature_2m[currentIdx]);
  const currentCode = weathercode[currentIdx];

  const hourlySlots = [];
  for (let i = 0; i < time.length; i++) {
    const h = parseHour(time[i]);
    if (h < 6 || h > 21) continue;
    hourlySlots.push({
      hour:       h,
      temp:       Math.round(temperature_2m[i]),
      rainChance: precipitation_probability[i] ?? 0,
      wind:       Math.round(windspeed_10m[i]),
      // POLLEN NOTE: Open-Meteo free tier has no pollen data.
      // Fixed "medium" fallback for all hours. The allergy alert will not
      // escalate to "high pollen" for live data — known V5 limitation.
      pollen: "medium",
    });
  }

  return {
    location,
    dateLabel:        parseDateLabel(time[0]),
    currentTemp,
    currentCondition: buildConditionString(time, weathercode, currentCode, currentTemp),
    pollenLevel:      "medium", // same limitation as above
    hourly:           hourlySlots,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchWeatherForCoords(lat, lon, location) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",         lat.toFixed(4));
  url.searchParams.set("longitude",        lon.toFixed(4));
  url.searchParams.set("hourly",           "temperature_2m,precipitation_probability,windspeed_10m,weathercode");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit",  "mph");
  url.searchParams.set("timezone",         "auto");
  url.searchParams.set("forecast_days",    "1");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo returned HTTP ${res.status}`);

  return normalizeOpenMeteo(await res.json(), location);
}
