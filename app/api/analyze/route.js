// app/api/analyze/route.js
// POST /api/analyze — Runs the full visa evaluation pipeline

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import supabase from '../../../lib/supabase-server.js';
import logger from '../../../lib/logger.js';
import { validateAnalysisInput } from '../../../lib/validators.js';
import { runPipeline } from '../../../lib/ai/pipeline.js';
import { requireAuth } from '../../../lib/middleware/auth.js';
import { applyRateLimit } from '../../../lib/middleware/rateLimit.js';

export async function POST(request) {
  const requestId = uuidv4();
  const startTime = Date.now();

  // ── Auth ──────────────────────────────────────────────────
  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  // ── Rate limit ────────────────────────────────────────────
  const rateLimitError = applyRateLimit(request, user.id, 'analyze');
  if (rateLimitError) return rateLimitError;

  logger.info('Analysis request received', { requestId, userId: user.id });

  // ── Step 1: Parse + validate body ─────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { valid, errors, data: validatedInput } = validateAnalysisInput(body);
  if (!valid) {
    logger.warn('Validation failed', { requestId, errors });
    return NextResponse.json(
      { error: 'Validation Error', message: 'Input data is invalid', details: errors },
      { status: 400 }
    );
  }

  // ── Step 2: Create analysis record (pending) ──────────────
  let analysisId;
  try {
    const { data: analysis, error } = await supabase
      .from('analyses')
      .insert({ user_id: user.id, input_data: validatedInput, status: 'processing' })
      .select('id')
      .single();

    if (error) throw error;
    analysisId = analysis.id;
    logger.info('Analysis record created', { requestId, analysisId });
  } catch (dbErr) {
    logger.error('Failed to create analysis record', { requestId, error: dbErr.message });
    return NextResponse.json(
      { error: 'Database Error', message: 'Failed to initialize analysis' },
      { status: 500 }
    );
  }

  // ── Step 3: Run AI pipeline ───────────────────────────────
  let pipelineResult;
  try {
    pipelineResult = await runPipeline(validatedInput);
  } catch (pipelineErr) {
    logger.error('Pipeline failed', { requestId, analysisId, error: pipelineErr.message });
    await supabase
      .from('analyses')
      .update({ status: 'failed', error: pipelineErr.message })
      .eq('id', analysisId);

    return NextResponse.json(
      {
        error: 'Analysis Failed',
        message: 'The AI analysis pipeline encountered an error',
        analysis_id: analysisId,
      },
      { status: 500 }
    );
  }

  const { scoring, report, pipeline_meta } = pipelineResult;

  // ── Step 4: Persist results ───────────────────────────────
  try {
    await supabase
      .from('analyses')
      .update({ result: scoring, status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', analysisId);

    await supabase.from('reports').insert({
      analysis_id: analysisId,
      summary: report.executive_summary,
      key_risks: report.key_risks,
      recommendations: report.recommendations,
      flags: scoring.flags,
    });

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      analysis_id: analysisId,
      action: 'analysis_completed',
      ip_address: ip,
      user_agent: request.headers.get('user-agent'),
      metadata: {
        overall_score: scoring.overall_score,
        risk_level: scoring.risk_level,
        duration_ms: Date.now() - startTime,
      },
    });

    logger.info('Results stored', { requestId, analysisId });
  } catch (storeErr) {
    // Log but don't fail — client still gets their results
    logger.error('Failed to store results', { requestId, analysisId, error: storeErr.message });
  }

  // ── Step 5: Return response ───────────────────────────────
  const duration = Date.now() - startTime;
  logger.info('Analysis complete', {
    requestId, analysisId,
    overall_score: scoring.overall_score,
    risk_level: scoring.risk_level,
    duration_ms: duration,
  });

  return NextResponse.json({
    success: true,
    analysis_id: analysisId,
    result: {
      overall_score: scoring.overall_score,
      risk_level: scoring.risk_level,
      approval_probability: scoring.approval_probability,
      confidence: scoring.confidence,
      breakdown: scoring.breakdown,
      flags: scoring.flags,
      recommendations: scoring.recommendations,
      scoring_metadata: scoring.scoring_metadata,
    },
    report: {
      executive_summary: report.executive_summary,
      strength_summary: report.strength_summary,
      key_risks: report.key_risks,
      recommendations: report.recommendations,
      next_steps: report.next_steps,
      disclaimer: report.disclaimer,
    },
    meta: {
      request_id: requestId,
      duration_ms: duration,
      pipeline_duration_ms: pipeline_meta.total_duration_ms,
    },
  });
}
