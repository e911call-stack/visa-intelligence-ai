// lib/supabase-server.js
// Supabase service-role client — server-side only, never sent to browser.
// Uses lazy initialisation so the module is safe to import at build time
// (env vars are only required when a request actually arrives at runtime).

import { createClient } from '@supabase/supabase-js';

let _client = null;

/**
 * Returns a singleton Supabase service-role client.
 * Throws at runtime if the required env vars are missing, not at build time.
 */
function getSupabaseServer() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing required environment variables: ' +
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
    );
  }

  _client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
  });

  return _client;
}

// Export as a Proxy so callers can use it like a normal object
// (e.g. `supabase.from(...)`) without needing to call getSupabaseServer() themselves.
const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSupabaseServer()[prop];
    },
  }
);

export default supabase;
