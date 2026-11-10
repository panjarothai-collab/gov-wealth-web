import { createBrowserClient } from '@supabase/ssr';

export const SUPABASE_DEFAULT_URL = 'https://nhowqalyrbhntcmmhztk.supabase.co';
export const SUPABASE_DEFAULT_KEY = 'sb_publishable_doGxgLQ973SHtzEqXaTYAA_jJIc69Sm';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_DEFAULT_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
