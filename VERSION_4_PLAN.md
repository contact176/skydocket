# Skydocket — Version 4 Plan
> Full codebase audit completed 2026-04-12. This document maps the current system before any new work begins.

---

## 1. Every Existing API Integration

**There are none.**

The app makes zero external API calls. All weather data is hardcoded static JavaScript. There are no `fetch()` calls, no `axios` calls, no `.env` files, no API keys, and no third-party data service dependencies anywhere in the source.

The only network permission configured is `Bash(curl:*)` in `.claude/settings.local.json` — that is a Claude Code dev tool permission, not an application integration.

### What exists instead of a real API

| File | Role | Status |
|------|------|--------|
| `src/data/fakeWeather.js` | Single hardcoded weather snapshot for Toronto, ON on "Friday" | Active — used by entire app |
| `src/data/fakeweather.js.txt` | Preserved original v1 data file (backup copy, identical content) | Orphaned — not imported anywhere |

The fake weather object shape is:

```js
{
  location: "Toronto, ON",
  dateLabel: "Friday",
  currentTemp: 58,          // °F, current conditions
  currentCondition: string, // human-readable summary
  pollenLevel: "high",      // daily overall level
  hourly: [                 // 16 slots: hours 6–21
    { hour, temp, rainChance, wind, pollen }
  ]
}
```

**Gap this creates for V4+:** Every user sees the same Toronto Friday forecast forever. To become a real product, this object must be replaced by a live weather API response (e.g., Open-Meteo, Tomorrow.io, WeatherAPI).

---

## 2. Current State Management Flow

### Overview

All application state lives in a single component (`App.jsx`). No global state library (Redux, Zustand, Jotai, etc.) is used. React's built-in `useState` and `useEffect` are the only state tools.

### State inventory

| State | Owner | Type | Persisted | Description |
|-------|-------|------|-----------|-------------|
| `profile` | `App.jsx` | object | localStorage | Household settings. Initialized from localStorage on mount; written back on every change via `useEffect`. |
| `activeTab` | `App.jsx` | string | No | Which of the 4 tabs is visible. Resets to `"dashboard"` on every page load. |
| `billing` | `PremiumScreen.jsx` | string | No | Monthly vs. annual toggle on the Premium page. Local to that screen, resets on navigation. |

### Profile object shape

```js
{
  adults: 2,
  kids: 2,
  pets: 1,
  schoolPickupHour: 16,   // 4:00 PM
  commuteHour: 17,         // 5:00 PM
  coldThreshold: 60,       // °F — below this = "dress in layers"
  allergySensitive: true,
  hasDog: true
}
```

### State flow diagram

```
localStorage
    │
    ▼ (on mount, via loadProfile())
App.jsx
  ├── profile (useState)  ────────────────────────────��─────────┐
  │     │                                                        │
  │     ├── passed as prop to ProfileScreen → ProfileForm        │
  │     │     └── any field change calls onChange(prev => {...}) │
  │     │                                                        │
  │     ▼                                                        │
  │   buildDailyDecisionPack(fakeWeather, profile)               │
  │     └── returns decisionPack (computed every render)         │
  │           │                                                  │
  │           ├── DashboardScreen (fakeWeather + decisionPack)   │
  │           ├── AlertsScreen (fakeWeather + decisionPack + profile)
  │           └── PremiumScreen (no props)                       │
  │                                                              │
  └── useEffect([profile]) ───────────────────────────���─────────┘
        └── localStorage.setItem("skydocket_profile", JSON.stringify(profile))
```

### Key behaviour notes

- `decisionPack` is **not stored in state**. It is recomputed synchronously on every render from `fakeWeather` (constant) and `profile` (state). This means any profile change immediately produces new advice — no stale data possible.
- The `loadProfile()` function merges stored data over `sampleProfile` defaults using `{ ...sampleProfile, ...JSON.parse(stored) }`. This means adding new profile fields in the future will always have a safe default even for users with old localStorage data.
- `fakeWeather` is a module-level constant — it never changes at runtime. All hourly computations in the decision engine and alerts screen read from this same frozen object.

---

## 3. All Supported Documents Identified in the Folder

### Active source files (used by the running app)

| File | Purpose |
|------|---------|
| `index.html` | Vite entry point. Mounts `<div id="root">`, loads `/src/main.jsx`. |
| `src/main.jsx` | React root. Calls `ReactDOM.createRoot().render(<App />)`. |
| `src/App.jsx` | Root component. Owns all state, renders header + TabNav + active screen. |
| `src/index.css` | Global styles. Sets Tailwind v4 via `@import "tailwindcss"`, body font, scroll-behavior. |
| `src/data/fakeWeather.js` | Exports `fakeWeather` (static 16-hour forecast) and `sampleProfile` (default household). |
| `src/lib/decisionEngine.js` | Exports `buildDailyDecisionPack()` and `formatHour()`. Pure functions, no side effects. |
| `src/components/TabNav.jsx` | 4-tab navigation bar (Dashboard / Profile / Alerts / Premium). |
| `src/components/ProfileForm.jsx` | Editable household profile form with toggles, selects, number inputs, and Reset button. |
| `src/components/HourlyTimeline.jsx` | Scrollable 16-slot hourly strip showing temp dots, rain bars, pollen indicators. |
| `src/screens/DashboardScreen.jsx` | Hero + live weather card + HourlyTimeline + 6 decision cards. |
| `src/screens/ProfileScreen.jsx` | Header + ProfileForm. Profile state passes through from App. |
| `src/screens/AlertsScreen.jsx` | Active alerts + upcoming timeline. Computes alert objects from fakeWeather + decisionPack + profile. |
| `src/screens/PremiumScreen.jsx` | Pricing page. Monthly/annual toggle, Free vs. Peace of Mind cards, feature grid. |
| `public/favicon.svg` | Custom Skydocket lightning-bolt icon (purple gradient, display-p3 colour). Used by index.html. |
| `vite.config.js` | Vite config. Plugins: `@vitejs/plugin-react` (JSX) + `@tailwindcss/vite` (Tailwind v4). |
| `package.json` | Dependencies: React 19, lucide-react, Tailwind v4, Vite 8. |
| `eslint.config.js` | ESLint with react-hooks and react-refresh plugins. Ignores uppercase-named variables for unused-vars rule. |

### Orphaned / legacy files (present but not used by the app)

| File | Origin | Notes |
|------|--------|-------|
| `src/data/fakeweather.js.txt` | Version 1 backup | Identical to v1 of `fakeWeather.js`. Not imported. Safe to delete. |
| `src/lib/decisionEngine.js.txt` | Version 1 backup | Original engine without `hasKids`/`pets` parameters. Not imported. Safe to delete. |
| `src/App.css` | Vite scaffold | Counter, hero, and layout styles for the default Vite starter page. Not imported by current `App.jsx`. |
| `src/assets/hero.png` | Project asset | Exists but not imported or referenced anywhere in current code. |
| `src/assets/react.svg` | Vite scaffold | Default React logo. Not used. |
| `src/assets/vite.svg` | Vite scaffold | Default Vite logo. Not used. |
| `public/icons.svg` | Vite scaffold | SVG sprite with Bluesky, Discord, GitHub, X icons from the default Vite welcome page. Not referenced anywhere in the app. |
| `README.md` | Vite scaffold | Default "React + Vite" setup instructions. Does not describe Skydocket. |
| `.claude/settings.local.json` | Claude Code | Grants `Bash(curl:*)` permission to Claude. Dev tooling only — not part of the application. |

---

## 4. How the Current Code Solves the Weather-Planning Problem

### The problem

Families with kids, pets, commutes, and health sensitivities spend mental energy every morning translating raw weather data into decisions: *Do the kids need jackets? Will it rain at pickup? Is it safe to walk the dog? Should I leave early?* Weather apps answer "what is the weather" but not "what should I do."

### The solution architecture

Skydocket solves this with a **rule-based translation layer** that sits between weather data and human language:

```
Weather data (hourly: temp, rain, wind, pollen)
          +
Household profile (kids, pets, times, thresholds)
          │
          ▼
    decisionEngine.js
    ─────────────────
    6 pure rule functions, each answering one question:
    1. getClothingAdvice()      → What should we wear?
    2. findBestOutdoorWindow()  → When can kids play outside?
    3. getLeaveEarlyAdvice()    → Should I leave early for my commute?
    4. getPickupAdvice()        → What's pickup like this afternoon?
    5. getPetAdvice()           → When should I walk the dog?
    6. getPollenAdvice()        → Is pollen a problem today?
          │
          ▼
    decisionPack object
    ───────────────────
    { summary, clothing, outdoorWindow, leaveAdvice,
      pickupAdvice, petAdvice, pollenAdvice, recommendations[] }
          │
          ▼
    4 screens present the same data in different contexts:
    • Dashboard  — full daily overview
    • Alerts     — urgency-sorted timeline
    • Profile    — edit inputs, see instant output changes
    • Premium    — monetisation
```

### Rule function mechanics

| Function | Algorithm | Profile fields used |
|----------|-----------|---------------------|
| `getClothingAdvice` | Threshold comparison: temp vs. coldThreshold ± 5°F. Three tiers. Language adjusts when kids > 0. | coldThreshold, kids |
| `findBestOutdoorWindow` | Scans hourly array for slots where rainChance < 30%, wind ≤ 14 mph, temp 60–78°F. Finds longest consecutive block. | — |
| `getLeaveEarlyAdvice` | Point lookup at commuteHour. If rainChance ≥ 50% or wind ≥ 15 mph, triggers "leave early" message. | commuteHour |
| `getPickupAdvice` | Returns null if kids = 0. Point lookup at schoolPickupHour. Checks rain then wind thresholds. | schoolPickupHour, kids |
| `getPetAdvice` | Returns null if no dog and no pets. Finds first hourly slot after REF_HOUR with rainChance < 30%, temp 55–75°F. Label is "dog walk" or "pet walk". | hasDog, pets |
| `getPollenAdvice` | Returns null if not allergySensitive. Checks if any hourly slot after 5 PM has pollen = "high". | allergySensitive |

### What the current fake data exercises

The Toronto Friday dataset is designed to stress-test all rule branches:
- Morning is cool (58°F, near coldThreshold of 60) → clothing advice triggers
- Hours 9–15 are ideal outdoor conditions → long outdoor window fires
- Hours 16–18 have 55–75% rain → pickup AND commute warnings trigger
- Hours 16–21 have high pollen → pollen alert fires for sensitive users
- Hours 7–15 have good pet-walk conditions → pet walk window populates

---

## 5. Version 4 Priorities (next build session)

Based on the audit above, the highest-value next steps in order of impact:

1. **Replace fake weather with a real API call** — Open-Meteo is free, CORS-friendly, and returns hourly temp/precipitation/wind. This is the single biggest leap from prototype to product. The `fakeWeather` shape maps almost 1:1 to Open-Meteo's JSON.

2. **Add geolocation or location search** — Without it, a real weather API is still hardcoded to one city. A simple browser `navigator.geolocation` call + reverse geocode gives every user their actual local weather.

3. **Persist active tab in URL hash** — Currently refreshing always returns to Dashboard. `window.location.hash = tab` + reading it on mount is a one-line fix that makes deep links and browser back/forward work.

4. **Clean up orphaned scaffold files** — `App.css`, `README.md`, `icons.svg`, `react.svg`, `vite.svg`, `hero.png`, and the two `.txt` backups serve no purpose. Removing them reduces confusion and file clutter.

5. **Replace `key={item}` in recommendation list** — `DashboardScreen.jsx` uses the recommendation text string as a React key. This is fragile if two rules ever produce identical text. A stable key (index or derived ID) is safer.
