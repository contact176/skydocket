import React from "react";
import { Users, RotateCcw } from "lucide-react";
import { sampleProfile } from "../data/fakeWeather";

const HOUR_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM – 8 PM

function hourLabel(h) {
  if (h === 12) return "12:00 PM";
  if (h > 12) return `${h - 12}:00 PM`;
  return `${h}:00 AM`;
}

const inputCls =
  "w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder-slate-500";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700/80 hover:border-slate-600 transition-colors"
    >
      {label}
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-blue-500" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

export default function ProfileForm({ profile, onChange }) {
  function set(key, value) {
    onChange((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    onChange(sampleProfile);
  }

  return (
    <div className="rounded-3xl border border-slate-700/50 bg-slate-900 p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-blue-500/20 p-3 text-blue-400 border border-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Your household</h2>
            <p className="text-sm text-slate-400">Recommendations update as you edit</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
          title="Reset to defaults"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Adults">
          <input
            type="number"
            min={1}
            max={12}
            value={profile.adults}
            onChange={(e) => set("adults", Math.max(1, Number(e.target.value)))}
            className={inputCls}
          />
        </Field>

        <Field label="Kids">
          <input
            type="number"
            min={0}
            max={12}
            value={profile.kids}
            onChange={(e) => set("kids", Math.max(0, Number(e.target.value)))}
            className={inputCls}
          />
        </Field>

        <Field label="Pets">
          <input
            type="number"
            min={0}
            max={10}
            value={profile.pets}
            onChange={(e) => set("pets", Math.max(0, Number(e.target.value)))}
            className={inputCls}
          />
        </Field>

        <Field label="Cold threshold (°F)">
          <input
            type="number"
            min={40}
            max={90}
            value={profile.coldThreshold}
            onChange={(e) => set("coldThreshold", Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <Field label="School pickup time">
          <select
            value={profile.schoolPickupHour}
            onChange={(e) => set("schoolPickupHour", Number(e.target.value))}
            className={inputCls}
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Commute time">
          <select
            value={profile.commuteHour}
            onChange={(e) => set("commuteHour", Number(e.target.value))}
            className={inputCls}
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Options
          </span>
          <Toggle
            label="Allergy sensitive"
            checked={profile.allergySensitive}
            onChange={(v) => set("allergySensitive", v)}
          />
          <Toggle
            label="Has a dog"
            checked={profile.hasDog}
            onChange={(v) => set("hasDog", v)}
          />
        </div>
      </div>

      {/* ── Lifestyle section ───────────────────────────────────────────────── */}
      <div className="mt-6 border-t border-slate-700/50 pt-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Lifestyle
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="How you get around">
            <select
              value={profile.transportMode ?? "car"}
              onChange={(e) => set("transportMode", e.target.value)}
              className={inputCls}
            >
              <option value="car">Drive</option>
              <option value="transit">Transit</option>
              <option value="walk">Walk / Bike</option>
            </select>
          </Field>

          <Field label="Where you work">
            <select
              value={profile.workLocation ?? "office"}
              onChange={(e) => set("workLocation", e.target.value)}
              className={inputCls}
            >
              <option value="office">Office</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Preferences
            </span>
            <Toggle
              label="Morning person"
              checked={profile.morningPerson ?? true}
              onChange={(v) => set("morningPerson", v)}
            />
            <Toggle
              label="Budget tips"
              checked={profile.budgetSensitive ?? false}
              onChange={(v) => set("budgetSensitive", v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
