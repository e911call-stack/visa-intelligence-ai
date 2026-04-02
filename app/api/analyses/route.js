// app/api/analyses/route.js
// GET /api/analyses — List user's analysis history with pagination

import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase-server.js';
import logger from '../../../lib/logger.js';
import { requireAuth } from '../../../lib/middleware/auth.js';
import { applyRateLimit } from '../../../lib/middleware/rateLimit.js';

export async function GET(request) {
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  const rateLimitError = applyRateLimit(request, user.id, 'general');
  if (rateLimitError) return rateLimitError;

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const offset = (page - 1) * limit;

  try {
    const { data, error, count } = await supabase
      .from('analyses')
      .select(
        'id, status, created_at, completed_at, result->>overall_score, result->>risk_level, result->>approval_probability, input_data->>nationality, input_data->>destination_country',
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data.map((a) => ({
        id: a.id,
        status: a.status,
        nationality: a['input_data->>nationality'],
        destination_country: a['input_data->>destination_country'],
        overall_score: a['result->>overall_score'] ? parseInt(a['result->>overall_score']) : null,
        risk_level: a['result->>risk_level'],
        approval_probability: a['result->>approval_probability']
          ? parseInt(a['result->>approval_probability']) : null,
        created_at: a.created_at,
        completed_at: a.completed_at,
      })),
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    logger.error('Failed to list analyses', { userId: user.id, error: err.message });
    return NextResponse.json({ error: 'Failed to retrieve analyses' }, { status: 500 });
  }
}
