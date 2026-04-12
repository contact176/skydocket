/**
 * supabaseClient.js — Supabase singleton
 *
 * Only initializes if both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * are present in the environment. When either is missing the client is null
 * and SUPABASE_ENABLED is false — the app falls back entirely to localStorage.
 *
 * Required Supabase table (run in your project's SQL editor):
 *
 *   create table profiles (
 *     id uuid references auth.users primary key,
 *     household_data jsonb not null default '{}',
 *     is_premium boolean not null default false,
 *     created_at timestamptz default now(),
 *     updated_at timestamptz default now()
 *   );
 *
 *   alter table profiles enable row level security;
 *
 *   create policy "Users manage own profile"
 *     on profiles for all
 *     using (auth.uid() = id);
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_ENABLED = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = SUPABASE_ENABLED
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
