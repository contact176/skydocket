import React, { useState, useEffect } from "react";
import { CloudSun, UserCircle2, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { fakeWeather, sampleProfile } from "./data/fakeWeather";
import { buildDailyDecisionPack } from "./lib/decisionEngine";
import { fetchWeatherForCoords, resolveCoords, DEFAULTS } from "./lib/weatherService";
import { supabase, SUPABASE_ENABLED } from "./lib/supabaseClient";
import { signOut, loadProfileFromSupabase, saveProfileToSupabase } from "./lib/authService";
import { PremiumProvider } from "./context/PremiumContext";
import TabNav from "./components/TabNav";
import OnboardingModal from "./components/OnboardingModal";
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AlertsScreen from "./screens/AlertsScreen";
import PremiumScreen from "./screens/PremiumScreen";

const STORAGE_KEY    = "skydocket_profile";
const ONBOARDED_KEY  = "skydocket_onboarded";

function loadProfile() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...sampleProfile, ...JSON.parse(stored) };
  } catch {
    // ignore parse errors
  }
  return sampleProfile;
}

function loadOnboardingDone() {
  return localStorage.getItem(ONBOARDED_KEY) === "true";
}

const screenVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.14, ease: "easeIn" } },
};

export default function App() {
  const [profile, setProfileState] = useState(loadProfile);
  const [activeTab, setActiveTab]  = useState("dashboard");

  // Onboarding — show once on first launch
  const [onboardingDone, setOnboardingDone] = useState(loadOnboardingDone);

  // Supabase auth
  const [user, setUser] = useState(null);

  // Live weather state
  const [weather, setWeather]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [locationStatus, setLocationStatus] = useState("pending");

  // ── Profile helpers ────────────────────────────────────────────────────────
  // Wraps setProfile so every change also syncs to Supabase in the background.
  function setProfile(updater) {
    setProfileState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Background Supabase sync — never blocks the UI
      if (user) saveProfileToSupabase(user.id, next).catch(() => {});
      return next;
    });
  }

  // ── Supabase auth listener ────────────────────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_ENABLED) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          const remote = await loadProfileFromSupabase(currentUser.id);
          if (remote?.household_data) {
            // Remote profile wins on sign-in — merge over sampleProfile defaults
            setProfileState({ ...sampleProfile, ...remote.household_data });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Persist profile to localStorage ────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // ── Two-phase weather fetch ────────────────────────────────────────────────
  useEffect(() => {
    // Phase 1: immediate fetch with default coordinates (never blocks the UI)
    fetchWeatherForCoords(DEFAULTS.lat, DEFAULTS.lon, DEFAULTS.location)
      .then((data) => { setWeather(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });

    // Phase 2: upgrade to real location once geolocation resolves
    resolveCoords()
      .then(({ lat, lon, location }) => fetchWeatherForCoords(lat, lon, location))
      .then((data) => { setWeather(data); setLocationStatus("resolved"); })
      .catch((err) => {
        const code = err?.code; // 1=PERMISSION_DENIED 2=UNAVAILABLE 3=TIMEOUT
        console.error("[SKY] Geolocation failed — code:", code, err?.message ?? err);
        setLocationStatus("failed");
      });
  }, []);

  // ── Onboarding complete handler ────────────────────────────────────────────
  function handleOnboardingComplete(partialProfile) {
    setProfile((prev) => ({ ...prev, ...partialProfile }));
    localStorage.setItem(ONBOARDED_KEY, "true");
    setOnboardingDone(true);
  }

  // ── Onboarding reset (called from ProfileScreen) ───────────────────────────
  function resetOnboarding() {
    localStorage.removeItem(ONBOARDED_KEY);
    setOnboardingDone(false);
  }

  // ── Auth handlers ─────────────────────────────────────────────────────────
  async function handleSignOut() {
    await signOut();
    setUser(null);
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const activeWeather = weather ?? fakeWeather;
  const usingFallback = weather === null;
  const decisionPack  = buildDailyDecisionPack(activeWeather, profile);

  function renderScreen() {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardScreen
            fakeWeather={activeWeather}
            decisionPack={decisionPack}
            loading={loading}
            error={error}
            usingFallback={usingFallback}
            locationStatus={locationStatus}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            profile={profile}
            onChange={setProfile}
            onResetOnboarding={resetOnboarding}
            user={user}
            onSignOut={handleSignOut}
          />
        );
      case "alerts":
        return (
          <AlertsScreen
            fakeWeather={activeWeather}
            decisionPack={decisionPack}
            profile={profile}
          />
        );
      case "premium":
        return <PremiumScreen />;
      default:
        return null;
    }
  }

  return (
    <PremiumProvider onUpgrade={() => setActiveTab("premium")}>
      <div className="min-h-screen bg-[#070d1b] text-slate-100">

        {/* ── Onboarding modal (shown once on first launch) ───────────────── */}
        <AnimatePresence>
          {!onboardingDone && (
            <OnboardingModal onComplete={handleOnboardingComplete} />
          )}
        </AnimatePresence>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <CloudSun className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-white">Skydocket</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300 border border-blue-500/30">
                  v6.0
                </span>
              </div>
              <div className="text-xs text-slate-400">Weather, translated into action.</div>
            </div>

            {/* Auth status indicator (only visible when Supabase is configured) */}
            {SUPABASE_ENABLED && user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-1.5">
                  <UserCircle2 className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-300 max-w-[120px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="rounded-xl p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Tab navigation ──────────────────────────────────────────────── */}
        <TabNav active={activeTab} onChange={setActiveTab} />

        {/* ── Screen content ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
          >
            {renderScreen()}
          </motion.main>
        </AnimatePresence>
      </div>
    </PremiumProvider>
  );
}
