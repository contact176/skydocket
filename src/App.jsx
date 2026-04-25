import React, { useState, useEffect } from "react";
import { CloudSun, UserCircle2, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { fakeWeather, sampleProfile } from "./data/fakeWeather";
import { buildDailyDecisionPack, buildActionPlan } from "./lib/decisionEngine";
import { buildCostIntelligence } from "./lib/costEngine";
import { buildContextualStory } from "./lib/storyEngine";
import { fetchWeatherForCoords, fetchWeekForecast, resolveCoords, DEFAULTS } from "./lib/weatherService";
import { supabase, SUPABASE_ENABLED } from "./lib/supabaseClient";
import { signOut, loadProfileFromSupabase, saveProfileToSupabase } from "./lib/authService";
import { PremiumProvider, usePremium } from "./context/PremiumContext";
import TabNav from "./components/TabNav";
import OnboardingModal from "./components/OnboardingModal";
import SplashScreen from "./components/SplashScreen";
import AuthGate from "./components/AuthGate";
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AlertsScreen from "./screens/AlertsScreen";
import PremiumScreen from "./screens/PremiumScreen";

const STORAGE_KEY       = "skydocket_profile";
const ONBOARDED_KEY     = "skydocket_onboarded";
const AUTH_DISMISSED_KEY = "skydocket_auth_dismissed";

// PremiumSyncer — lives inside PremiumProvider so it can call usePremium().
// Re-checks Supabase on every sign-in/sign-out as the source of truth.
function PremiumSyncer({ user }) {
  const { setIsPremium } = usePremium();

  useEffect(() => {
    if (!SUPABASE_ENABLED) return;
    if (!user) {
      setIsPremium(false);
      return;
    }
    loadProfileFromSupabase(user.id)
      .then((remote) => { setIsPremium(remote?.is_premium === true); })
      .catch(() => { setIsPremium(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
}

// Safe localStorage helpers
function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { void e; }
}
function lsRemove(key) {
  try { localStorage.removeItem(key); } catch (e) { void e; }
}
function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function loadProfile() {
  try {
    const stored = lsGet(STORAGE_KEY);
    if (stored) return { ...sampleProfile, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return sampleProfile;
}

function loadOnboardingDone() {
  return lsGet(ONBOARDED_KEY) === "true";
}

function loadAuthGateDone() {
  if (!SUPABASE_ENABLED) return true;
  return false;
}

const screenVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.14, ease: "easeIn" } },
};

export default function App() {
  const [profile, setProfileState] = useState(loadProfile);
  const [activeTab, setActiveTab]  = useState("dashboard");
  const [onboardingDone, setOnboardingDone] = useState(loadOnboardingDone);
  const [splashDone,   setSplashDone]   = useState(false);
  const [authGateDone, setAuthGateDone] = useState(loadAuthGateDone);
  const [nowHour, setNowHour] = useState(() => new Date().getHours());
  const [user, setUser] = useState(null);
  const [weather, setWeather]           = useState(null);
  const [weekForecast, setWeekForecast] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [locationStatus, setLocationStatus] = useState("pending");

  // Splash auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2700);
    return () => clearTimeout(t);
  }, []);

  // Profile helpers
  function setProfile(updater) {
    setProfileState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (user) saveProfileToSupabase(user.id, next).catch(() => {});
      return next;
    });
  }

  // Supabase auth listener
  useEffect(() => {
    if (!SUPABASE_ENABLED) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Only unlock the gate for explicit sign-in events.
        // TOKEN_REFRESHED must NOT reopen the gate after a sign-out.
        if (currentUser && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          setAuthGateDone(true);
        } else if (!currentUser) {
          setAuthGateDone(false);
          lsRemove(AUTH_DISMISSED_KEY);
        }

        if (currentUser && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          const remote = await loadProfileFromSupabase(currentUser.id);
          if (remote?.household_data) {
            setProfileState({ ...sampleProfile, ...remote.household_data });
            lsSet(ONBOARDED_KEY, "true");
            setOnboardingDone(true);
          } else {
            lsRemove(ONBOARDED_KEY);
            setOnboardingDone(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Persist profile
  useEffect(() => {
    lsSet(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => { setNowHour(new Date().getHours()); }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Two-phase weather fetch
  useEffect(() => {
    fetchWeatherForCoords(DEFAULTS.lat, DEFAULTS.lon, DEFAULTS.location)
      .then((data) => { setWeather(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });

    fetchWeekForecast(DEFAULTS.lat, DEFAULTS.lon)
      .then(setWeekForecast)
      .catch(() => {});

    resolveCoords()
      .then(({ lat, lon, location }) => {
        fetchWeatherForCoords(lat, lon, location)
          .then((data) => { setWeather(data); setLocationStatus("resolved"); })
          .catch(() => {});
        fetchWeekForecast(lat, lon).then(setWeekForecast).catch(() => {});
      })
      .catch((err) => {
        console.error("[SKY] Geolocation failed:", err?.code, err?.message ?? err);
        setLocationStatus("failed");
      });
  }, []);

  // Onboarding handlers
  function handleOnboardingComplete(partialProfile) {
    setProfile((prev) => ({ ...prev, ...partialProfile }));
    lsSet(ONBOARDED_KEY, "true");
    setOnboardingDone(true);
  }

  function resetOnboarding() {
    lsRemove(ONBOARDED_KEY);
    setOnboardingDone(false);
  }

  // Auth gate handlers
  function handleAuthGateContinue() {
    lsSet(AUTH_DISMISSED_KEY, "true");
    setAuthGateDone(true);
  }

  function handleAuthGateSuccess(signedInUser) {
    if (signedInUser) {
      lsSet(AUTH_DISMISSED_KEY, "true");
      setAuthGateDone(true);
    }
  }

  // Auth sign-out
  // Reset local state FIRST (synchronously) so the UI flips to the login
  // screen immediately, regardless of network speed or Supabase latency.
  // The API call fires in the background to invalidate the server session.
  function handleSignOut() {
    console.log("[SKY] handleSignOut — clearing local state");

    // 1. Synchronous local cleanup
    setUser(null);
    setAuthGateDone(false);
    lsRemove(AUTH_DISMISSED_KEY);
    lsRemove("skydocket_premium");

    // 2. Background Supabase signOut — never await; UI already cleared above
    signOut().catch((err) => {
      console.warn("[SKY] Supabase signOut error:", err);
    });
  }

  // Derived state
  const activeWeather    = weather ?? fakeWeather;
  const usingFallback    = weather === null;
  const decisionPack     = buildDailyDecisionPack(activeWeather, profile);
  const storyCard        = buildContextualStory(activeWeather, profile, nowHour);
  const actionPlan       = buildActionPlan(activeWeather, profile, nowHour);
  const costIntelligence = buildCostIntelligence(activeWeather);

  // Behavioral pattern tracker
  useEffect(() => {
    if (!storyCard?.category) return;
    try {
      const raw      = lsGet("skydocket_patterns");
      const patterns = raw ? JSON.parse(raw) : {};
      patterns[storyCard.category] = (patterns[storyCard.category] ?? 0) + 1;
      lsSet("skydocket_patterns", JSON.stringify(patterns));
    } catch { /* ignore */ }
  }, [storyCard?.category]);

  function renderScreen() {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardScreen
            fakeWeather={activeWeather}
            decisionPack={decisionPack}
            storyCard={storyCard}
            actionPlan={actionPlan}
            costIntelligence={costIntelligence}
            weekForecast={weekForecast}
            profile={profile}
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
        return <PremiumScreen user={user} />;
      default:
        return null;
    }
  }

  return (
    <PremiumProvider onUpgrade={() => setActiveTab("premium")}>
      <PremiumSyncer user={user} />
      <div className="min-h-screen bg-[#070d1b] text-slate-100">

        <AnimatePresence>
          {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        </AnimatePresence>

        <AnimatePresence>
          {splashDone && !authGateDone && (
            <AuthGate
              profile={profile}
              onContinue={handleAuthGateContinue}
              onAuthSuccess={handleAuthGateSuccess}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {splashDone && authGateDone && !onboardingDone && (
            <OnboardingModal onComplete={handleOnboardingComplete} />
          )}
        </AnimatePresence>

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

        <TabNav active={activeTab} onChange={setActiveTab} />

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
