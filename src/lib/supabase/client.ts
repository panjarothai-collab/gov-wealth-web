import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    // When environment variables are not yet provided, return a mock/dummy client or null
    // so the app can still run gracefully in local storage / demo mode!
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
