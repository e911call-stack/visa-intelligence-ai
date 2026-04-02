// lib/validators.js
// Zod-based input validation and sanitization — server-side only

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const TravelHistoryEntrySchema = z.object({
  country: z.string().min(2).max(100),
  year: z.number().int().min(1970).max(new Date().getFullYear()),
  duration_days: z.number().int().min(1).max(365).optional(),
  visa_type: z.string().max(50).optional(),
  refused: z.boolean().optional().default(false),
});

const SocialMediaDataSchema = z.object({
  platforms: z.array(z.string().max(50)).max(10).optional().default([]),
  posts_per_week: z.number().min(0).max(1000).optional(),
  topics: z.array(z.string().max(100)).max(50).optional().default([]),
  public_profile: z.boolean().optional(),
  flags: z.array(z.string().max(200)).max(20).optional().default([]),
  bio_snippet: z.string().max(500).optional().default(''),
}).optional();

// ---------------------------------------------------------------------------
// Main Input Schema
// ---------------------------------------------------------------------------

const AnalysisInputSchema = z.object({
  nationality: z
    .string()
    .min(2, 'Nationality must be at least 2 characters')
    .max(100, 'Nationality must be under 100 characters')
    .trim(),

  destination_country: z
    .string()
    .min(2, 'Destination country required')
    .max(100)
    .trim(),

  employment_status: z.enum(
    ['employed', 'self_employed', 'unemployed', 'student', 'retired', 'other'],
    { errorMap: () => ({ message: 'Invalid employment status' }) }
  ),

  income: z.object({
    amount: z.number().min(0).max(100_000_000),
    currency: z.string().length(3, 'Currency must be 3-letter ISO code').toUpperCase(),
    frequency: z.enum(['monthly', 'annual']).default('annual'),
  }),

  travel_history: z
    .array(TravelHistoryEntrySchema)
    .max(50, 'Travel history limited to 50 entries')
    .default([]),

  social_media_data: SocialMediaDataSchema,

  profile_text: z
    .string()
    .min(10, 'Profile text must be at least 10 characters')
    .max(3000, 'Profile text must be under 3000 characters')
    .trim(),

  purpose_of_travel: z
    .enum(['tourism', 'business', 'study', 'work', 'medical', 'transit', 'family', 'other'])
    .default('tourism'),

  assets: z
    .object({
      property: z.boolean().optional().default(false),
      savings_usd: z.number().min(0).optional().default(0),
      business_ownership: z.boolean().optional().default(false),
    })
    .optional()
    .default({}),
});

// ---------------------------------------------------------------------------
// Sanitizer — strips potentially dangerous strings, keeps valid data
// ---------------------------------------------------------------------------

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s.,!?@#$%^&*()\-+=:;'"\/\\[\]{}|`~\u00C0-\u024F]/g, '')
    .trim()
    .slice(0, 5000);
}

function sanitizeInput(obj) {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeInput);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeInput(v)])
    );
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Validate + sanitize
// ---------------------------------------------------------------------------

export function validateAnalysisInput(raw) {
  const sanitized = sanitizeInput(raw);
  const result = AnalysisInputSchema.safeParse(sanitized);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return { valid: false, errors, data: null };
  }

  return { valid: true, errors: [], data: result.data };
}

export { AnalysisInputSchema };
