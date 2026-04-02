// lib/ai/pipeline.js
// Orchestrates the full visa evaluation pipeline

import { analyzeSocialMedia } from './socialMediaAnalyzer.js';
import { checkProfileConsistency } from './profileConsistencyChecker.js';
import { detectImmigrationIntent } from './intentDetector.js';
import { evaluateFinancialStrength } from './financialEvaluator.js';
import { aggregateScores } from './aggregator.js';
import { generateReport } from './reportGenerator.js';
import logger from '../logger.js';

/**
 * Runs the complete visa evaluation pipeline.
 * Phase 1 (steps 1–4) runs in parallel for performance.
 * Phase 2 aggregates, Phase 3 generates the report.
 */
export async function runPipeline(input) {
  const pipelineStart = Date.now();
  logger.info('Pipeline started', {
    nationality: input.nationality,
    destination: input.destination_country,
  });

  // Phase 1: all independent AI modules in parallel
  const [socialResult, consistencyResult, intentResult, financialResult] =
    await Promise.all([
      runWithFallback(() => analyzeSocialMedia(input),          'social-media',  defaultSocialScore()),
      runWithFallback(() => checkProfileConsistency(input),     'consistency',   defaultConsistencyScore()),
      runWithFallback(() => detectImmigrationIntent(input),     'intent',        defaultIntentScore()),
      runWithFallback(() => evaluateFinancialStrength(input),   'financial',     defaultFinancialScore()),
    ]);

  const phase1Duration = Date.now() - pipelineStart;
  logger.info('Phase 1 complete (all modules)', {
    duration_ms: phase1Duration,
    social: socialResult.social_score,
    consistency: consistencyResult.consistency_score,
    intent: intentResult.intent_score,
    financial: financialResult.financial_score,
  });

  // Phase 2: aggregate
  const scoringResult = aggregateScores({
    social: socialResult,
    consistency: consistencyResult,
    intent: intentResult,
    financial: financialResult,
  });

  // Phase 3: generate report
  const reportResult = await runWithFallback(
    () => generateReport(input, scoringResult),
    'report-generator',
    defaultReport(scoringResult)
  );

  const totalDuration = Date.now() - pipelineStart;
  logger.info('Pipeline complete', {
    total_duration_ms: totalDuration,
    overall_score: scoringResult.overall_score,
    risk_level: scoringResult.risk_level,
    approval_probability: scoringResult.approval_probability,
  });

  return {
    scoring: scoringResult,
    report: reportResult,
    pipeline_meta: {
      phase1_duration_ms: phase1Duration,
      total_duration_ms: totalDuration,
      modules_run: ['social', 'consistency', 'intent', 'financial', 'aggregator', 'report'],
    },
  };
}

async function runWithFallback(fn, label, fallbackValue) {
  try {
    return await fn();
  } catch (err) {
    logger.error(`Module [${label}] failed, using fallback`, {
      error: err.message,
      code: err.code,
    });
    return { ...fallbackValue, _fallback: true, _fallback_reason: err.message };
  }
}

// ---------------------------------------------------------------------------
// Fallback defaults — neutral scores when a module fails
// ---------------------------------------------------------------------------

function defaultSocialScore() {
  return {
    social_score: 50, confidence: 0,
    flags: ['Module failed — social score defaulted to neutral'],
    positive_signals: [], data_availability: 'none',
    reasoning: 'Analysis module failed. Neutral score applied.',
  };
}

function defaultConsistencyScore() {
  return {
    consistency_score: 50, confidence: 0,
    inconsistencies: ['Module failed — consistency check could not be completed'],
    consistent_elements: [], deception_indicators: [],
    reasoning: 'Analysis module failed. Neutral score applied.',
  };
}

function defaultIntentScore() {
  return {
    intent_score: 50, confidence: 0,
    return_intent_signals: [],
    immigration_risk_signals: ['Module failed — intent check could not be completed'],
    push_factors: [], pull_factors: [],
    recommended_visa_duration: 'short',
    reasoning: 'Analysis module failed. Neutral score applied.',
  };
}

function defaultFinancialScore() {
  return {
    financial_score: 50, confidence: 0,
    estimated_daily_budget_usd: 0, financial_strength: 'borderline',
    funding_concerns: ['Module failed — financial evaluation could not be completed'],
    financial_positives: [],
    recommended_proof_of_funds: ['Bank statements (3 months)', 'Employment letter', 'Tax returns'],
    reasoning: 'Analysis module failed. Neutral score applied.',
  };
}

function defaultReport(scoringResult) {
  return {
    executive_summary: `Your visa application has been assessed with an overall score of ${scoringResult.overall_score}/100, indicating a ${scoringResult.risk_level} risk profile. The estimated approval probability is ${scoringResult.approval_probability}%. Please review the recommendations below to strengthen your application.`,
    strength_summary: 'Full report generation was unavailable. Please refer to the scoring breakdown for details.',
    key_risks: [],
    recommendations: scoringResult.recommendations.map((r) => ({
      priority: 'important',
      action: r,
      reason: 'Based on your scoring profile',
    })),
    next_steps: [
      'Review the scoring breakdown for specific areas of concern',
      'Gather supporting documentation',
      'Consult with an immigration attorney',
    ],
    disclaimer:
      'This assessment is AI-generated and for informational purposes only. Consult a licensed immigration attorney for legal advice.',
  };
}
