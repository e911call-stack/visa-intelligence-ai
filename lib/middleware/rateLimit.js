// lib/middleware/rateLimit.js
// In-memory rate limiter for Next.js API routes
// Note: resets on cold starts (serverless). Upgrade to Redis for production persistence.

import { NextResponse } from 'next/server';
import logger from '../logger.js';

// Map<key, { count: number, resetAt: number }>
const store = new Map();

/**
 * Periodically prune expired entries to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) store.delete(key);
  }
}, 60_000);

/**
 * Core rate limit check
 *
 * @param {string} key       - Unique identifier (userId or IP)
 * @param {number} windowMs  - Window duration in milliseconds
 * @param {number} max       - Max requests allowed in window
 * @returns {{ limited: boolean, retryAfter: number }}
 */
function checkRateLimit(key, windowMs, max) {
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }

  record.count += 1;

  if (record.count > max) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}

/**
 * Returns a rate-limit error response, or null if the request is allowed.
 *
 * Usage:
 *   const limited = applyRateLimit(request, user?.id, 'analyze');
 *   if (limited) return limited;
 *
 * @param {Request} request
 * @param {string|undefined} userId
 * @param {'analyze'|'general'} tier
 * @returns {NextResponse|null}
 */
export function applyRateLimit(request, userId, tier = 'general') {
  // Skip rate limiting in test environments
  if (process.env.NODE_ENV === 'test') return null;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const key = userId ? `user:${userId}:${tier}` : `ip:${ip}:${tier}`;

  let windowMs, max;

  if (tier === 'analyze') {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
    max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10;
  } else {
    windowMs = 5 * 60 * 1000;
    max = 200;
  }

  const { limited, retryAfter } = checkRateLimit(key, windowMs, max);

  if (limited) {
    logger.warn('Rate limit exceeded', { key, tier });
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 60000)} minutes.`,
        retry_after: retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(max),
        },
      }
    );
  }

  return null;
}
