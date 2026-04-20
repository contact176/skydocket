/**
 * authService.js — Supabase auth + profile sync
 *
 * All functions are no-ops when SUPABASE_ENABLED is false.
 * The app never calls these directly — App.jsx calls them and
 * falls back gracefully when they throw or return null.
 */

import { supabase, SUPABASE_ENABLED } from "./supabaseClient";

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Sign up a new user with email + password.
 * Pushes the current local profile to Supabase after account creation.
 */
export async function signUp(email, password, profile) {
  if (!SUPABASE_ENABLED) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  if (data.user) {
    await saveProfileToSupabase(data.user.id, profile);
  }

  return data;
}

/**
 * Sign in an existing user with email + password.
 * Returns { user, session }.
 */
export async function signIn(email, password) {
  if (!SUPABASE_ENABLED) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  return data;
}

/**
 * Sign out the current session.
 */
export async function signOut() {
  if (!SUPABASE_ENABLED) return;
  await supabase.auth.signOut();
}

// ── Profile sync ──────────────────────────────────────────────────────────────

/**
 * Upsert the household profile for a given user ID.
 * Runs in the background — failures are logged but never throw to the UI.
 */
export async function saveProfileToSupabase(userId, profile) {
  if (!SUPABASE_ENABLED || !userId) return;

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    household_data: profile,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("[SKY] Supabase profile save failed:", error.message);
  }
}

/**
 * Load the household profile and premium status from Supabase.
 * Returns { household_data, is_premium } or null on failure.
 */
export async function loadProfileFromSupabase(userId) {
  if (!SUPABASE_ENABLED || !userId) return null;

  // .maybeSingle() returns null (not an error) when no profile row exists yet.
  // .single() throws a 406 for zero rows, which is the bug we're fixing.
  const { data, error } = await supabase
    .from("profiles")
    .select("household_data, is_premium")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[SKY] Supabase profile load failed:", error.message);
    return null;
  }

  return data; // null when no profile exists — callers handle this gracefully
}
