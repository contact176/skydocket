import React from "react";
import { LayoutDashboard, Users, Bell, Star } from "lucide-react";
import { motion } from "framer-motion";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile",   label: "Profile",   icon: Users },
  { id: "alerts",    label: "Alerts",    icon: Bell },
  { id: "premium",   label: "Premium",   icon: Star },
];

export default function TabNav({ active, onChange }) {
  return (
    <div className="border-b border-slate-700/60 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                active === id
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {active === id && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
