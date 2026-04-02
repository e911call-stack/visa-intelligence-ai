// app/api/report/[id]/download/route.js
// GET /api/report/:id/download — Returns a simplified, printable version

import { NextResponse } from 'next/server';
import supabase from '../../../../../lib/supabase-server.js';
import logger from '../../../../../lib/logger.js';
import { requireAuth } from '../../../../../lib/middleware/auth.js';
import { applyRateLimit } from '../../../../../lib/middleware/rateLimit.js';

export async function GET(request, { params }) {
  const { id } = params;

  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  const rateLimitError = applyRateLimit(request, user.id, 'general');
  if (rateLimitError) return rateLimitError;

  try {
    const { data, error } = await supabase
      .from('full_reports') // Uses the DB view
      .select('*')
      .eq('analysis_id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      title: 'Visa Intelligence AI — Assessment Report',
      generated_at: new Date().toISOString(),
      applicant: {
        nationality: data.input_data?.nationality,
        destination: data.input_data?.destination_country,
        purpose: data.input_data?.purpose_of_travel,
      },
      verdict: {
        overall_score: data.result?.overall_score,
        risk_level: data.result?.risk_level,
        approval_probability: `${data.result?.approval_probability}%`,
      },
      summary: data.summary,
      key_risks: data.key_risks,
      recommendations: data.recommendations,
      flags: data.flags,
      breakdown: data.result?.breakdown,
      disclaimer:
        'This assessment is AI-generated and for informational purposes only. Consult a licensed immigration attorney for legal advice.',
    });

  } catch (err) {
    logger.error('Download error', { analysisId: id, error: err.message });
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
