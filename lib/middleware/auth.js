// lib/middleware/auth.js
// Validates Supabase JWT tokens — called directly inside API route handlers

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import logger from '../logger.js';

// Dedicated client for JWT verification only
const supabaseAuthClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

    const {
      data: { user },
      error,
    } = await supabaseAuthClient.auth.getUser(token);

    if (error || !user) {
      logger.warn('Auth failed', { error: error?.message });
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or expired token' },
          { status: 401 }
        ),
      };
    }

    logger.debug('Auth success', { userId: user.id });
    return { user: { id: user.id, email: user.email }, errorResponse: null };

  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication check failed' },
        { status: 500 }
      ),
    };
  }
}
