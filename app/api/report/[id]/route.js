// app/api/report/[id]/route.js
// GET /api/report/:id — Retrieves a full analysis report by ID

import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabase-server.js';
import logger from '../../../../lib/logger.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';
import { applyRateLimit } from '../../../../lib/middleware/rateLimit.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request, { params }) {
  const { id } = params;

  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  const rateLimitError = applyRateLimit(request, user.id, 'general');
  if (rateLimitError) return rateLimitError;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: 'Invalid ID', message: 'The provided ID is not a valid UUID' },
      { status: 400 }
    );
  }

  try {
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (analysisError || !analysis) {
      logger.warn('Report not found or access denied', { analysisId: id, userId: user.id });
      return NextResponse.json(
        { error: 'Not Found', message: 'Analysis report not found or you do not have access to it' },
        { status: 404 }
      );
    }

    if (analysis.status === 'pending' || analysis.status === 'processing') {
      return NextResponse.json(
        { success: false, analysis_id: id, status: analysis.status,
          message: 'Analysis is still in progress. Please try again shortly.' },
        { status: 202 }
      );
    }

    if (analysis.status === 'failed') {
      return NextResponse.json(
        { success: false, analysis_id: id, status: 'failed',
          message: 'This analysis failed to complete', error: analysis.error },
        { status: 422 }
      );
    }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('analysis_id', id)
      .single();

    if (reportError) {
      logger.error('Failed to fetch report', { analysisId: id, error: reportError.message });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      analysis_id: id,
      action: 'report_accessed',
      ip_address: ip,
      user_agent: request.headers.get('user-agent'),
    });

    logger.info('Report retrieved', { analysisId: id, userId: user.id });

    const sanitizedInput = sanitizeInputForResponse(analysis.input_data);

    return NextResponse.json({
      success: true,
      analysis_id: id,
      status: analysis.status,
      created_at: analysis.created_at,
      completed_at: analysis.completed_at,
      applicant_summary: sanitizedInput,
      result: analysis.result,
      report: report
        ? {
            summary: report.summary,
            key_risks: report.key_risks,
            recommendations: report.recommendations,
            flags: report.flags,
            generated_at: report.created_at,
          }
        : null,
    });

  } catch (err) {
    logger.error('Report retrieval error', { analysisId: id, error: err.message });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}

function sanitizeInputForResponse(inputData) {
  if (!inputData) return {};
  const { profile_text, social_media_data, ...safe } = inputData;
  return {
    ...safe,
    profile_text_length: profile_text?.length || 0,
    has_social_data: Boolean(social_media_data),
  };
}
