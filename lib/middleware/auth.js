// lib/middleware/auth.js
// Validates Supabase JWT tokens — called directly inside API route handlers.
// Uses lazy initialisation so imports are safe at build time.

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

let _authClient = null;

function getAuthClient() {
  if (_authClient) return _authClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing required environment variables: ' +
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
    );
  }

  _authClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _authClient;
}

/**
 * Validates a Supabase Bearer token from the request.
 *
 * Usage in a route handler:
 *   const { user, errorResponse } = await requireAuth(request);
 *   if (errorResponse) return errorResponse;
 *
 * @param {Request} request - Next.js incoming Request
 * @returns {{ user: { id, email } | null, errorResponse: NextResponse | null }}
 */
export async function requireAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header. Use: Bearer <token>',
          },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await getAuthClient().auth.getUser(token);

    if (error || !user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or expired token' },
          { status: 401 }
        ),
      };
    }

    return { user: { id: user.id, email: user.email }, errorResponse: null };

  } catch (err) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication check failed' },
        { status: 500 }
      ),
    };
  }
}
