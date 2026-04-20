import React, { useState } from "react";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { usePremium } from "../context/PremiumContext";

const FREE_LIMIT = 3;

const EVENT_TYPES = [
  { value: "outdoor", label: "Outdoor activity" },
  { value: "workout", label: "Workout"           },
  { value: "errand",  label: "Errand"            },
  { value: "commute", label: "Commute"           },
  { value: "other",   label: "Other"             },
];

const HOUR_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM – 9 PM

function hourLabel(h) {
  if (h === 12) return "12:00 PM";
  if (h > 12)  return `${h - 12}:00 PM`;
  return `${h}:00 AM`;
}

const inputCls =
  "w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

const BLANK_DRAFT = { label: "", hour: 8, type: "outdoor" };

/**
 * ScheduleManager — lets users add and remove daily schedule events.
 *
 * Props:
 *   schedule  — current array of { id, label, hour, type }
 *   onChange  — (updater) => void  (same pattern as ProfileForm onChange)
 */
export default function ScheduleManager({ schedule = [], onChange }) {
  const { isPremium, onUpgrade } = usePremium();
  const [adding, setAdding]     = useState(false);
  const [draft, setDraft]       = useState(BLANK_DRAFT);

  const atLimit = !isPremium && schedule.length >= FREE_LIMIT;

  function handleAdd() {
    if (!draft.label.trim()) return;
    onChange((prev) => ({
      ...prev,
      schedule: [
        ...(prev.schedule ?? []),
        { ...draft, label: draft.label.trim(), id: Date.now().toString() },
      ],
    }));
    setDraft(BLANK_DRAFT);
    setAdding(false);
  }

  function handleDelete(id) {
    onChange((prev) => ({
      ...prev,
      schedule: (prev.schedule ?? []).filter((s) => s.id !== id),
    }));
  }

  function setDraftField(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="mt-6 rounded-3xl border border-slate-700/50 bg-slate-900 p-6 shadow-xl">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="inline-flex rounded-xl bg-blue-500/20 border border-blue-500/20 p-3 text-blue-400">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Your schedule</h2>
          <p className="text-sm text-slate-400">
            Add recurring events — the app will flag weather disruptions for each one.
          </p>
        </div>
      </div>

      {/* Event list */}
      {schedule.length > 0 && (
        <ul className="mb-4 space-y-2">
          {schedule.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800 px-4 py-3"
            >
              <Clock className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="flex-1 text-sm font-medium text-slate-200">{item.label}</span>
              <span className="shrink-0 text-xs text-slate-500">{hourLabel(item.hour)}</span>
              <span className="shrink-0 rounded-full border border-slate-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {item.type}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="ml-1 shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-rose-400 transition-colors"
                title="Remove event"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {schedule.length === 0 && !adding && (
        <p className="mb-4 text-sm text-slate-500">
          No events yet. Add your regular activities and the app will warn you when weather disrupts them.
        </p>
      )}

      {/* Add form */}
      {adding && (
        <div className="mb-4 rounded-2xl border border-blue-500/30 bg-slate-800 p-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Event name
            </label>
            <input
              type="text"
              placeholder="e.g. Morning run, Grocery trip…"
              value={draft.label}
              onChange={(e) => setDraftField("label", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className={inputCls}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Time
              </label>
              <select
                value={draft.hour}
                onChange={(e) => setDraftField("hour", Number(e.target.value))}
                className={inputCls}
              >
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>{hourLabel(h)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Type
              </label>
              <select
                value={draft.type}
                onChange={(e) => setDraftField("type", e.target.value)}
                className={inputCls}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draft.label.trim()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save event
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setDraft(BLANK_DRAFT); }}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add button / premium gate */}
      {!adding && (
        atLimit ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              Free plan includes {FREE_LIMIT} schedule events.
            </p>
            <button
              type="button"
              onClick={onUpgrade}
              className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Upgrade for unlimited
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-600 px-4 py-3 text-sm font-medium text-slate-400 hover:border-blue-500/50 hover:text-blue-400 transition-colors w-full"
          >
            <Plus className="h-4 w-4" />
            Add event
          </button>
        )
      )}

      {!isPremium && schedule.length > 0 && (
        <p className="mt-3 text-xs text-slate-600">
          {schedule.length} / {FREE_LIMIT} events used on free plan.
        </p>
      )}
    </div>
  );
}
