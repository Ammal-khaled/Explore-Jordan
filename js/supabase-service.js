// Future Supabase data service for Explore Jordan.
//
// This file is intentionally not imported by the current frontend yet.
// The website still loads JSON from the data/ folder by default.
//
// To use this later:
// 1. Copy js/supabase-config.example.js to js/supabase-config.js.
// 2. Add your real Supabase URL and anon key in js/supabase-config.js.
// 3. Load the Supabase browser client before this module or install/import it
//    through a future build setup.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

function getSupabaseClient() {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase client is not loaded. Add the Supabase browser client before using supabase-service.js.');
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function fetchTable(tableName) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchDestinationsFromSupabase() {
  return fetchTable('destinations');
}

export async function fetchActivitiesFromSupabase() {
  return fetchTable('activities');
}

export async function fetchAccommodationsFromSupabase() {
  return fetchTable('accommodations');
}
