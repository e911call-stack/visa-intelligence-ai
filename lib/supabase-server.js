// lib/supabase-server.js
// Supabase service-role client — server-side only, never sent to browser
// Uses the SERVICE_ROLE key which bypasses Row Level Security

import { createClient } from '@supabase/supabase-js';
import logger from './logger.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Missing Supabase server environment variables', {
    hasUrl: Boolean(SUPABASE_URL),
    hasServiceKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
  });
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
  );
}

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

export default supabaseServer;
