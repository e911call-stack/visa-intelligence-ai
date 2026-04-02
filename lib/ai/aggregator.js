// lib/ai/aggregator.js
import logger from '../logger.js';

// Scoring weights — must sum to 1.0
export const WEIGHTS = {
  intent: 0.30,      // 30% — Most important: will they leave?
  social: 0.25,      // 25% — Risk signals from online presence
  financial: 0.25,   // 25% — Can they fund the trip?
  consistency: 0.20, // 20% — Is the application truthful?
};

export function aggregateScores(scores) {
  const { social, consistency, intent, financial } = scores;

  const overall_score = Math.round(
    social.social_score * WEIGHTS.social +
    consistency.consistency_score * WEIGHTS.consistency +
    intent.intent_score * WEIGHTS.intent +
    financial.financial_score * WEIGHTS.financial
  );

  const risk_level = getRiskLevel(overall_score);
  const approval_probability = calculateApprovalProbability(overall_score, scores);
  const flags = collectFlags(scores);
  const recommendations = generateRecommendations(scores, overall_score);

  const avg_confidence = Math.round(
    (social.confidence + consistency.confidence + intent.confidence + financial.confidence) / 4
  );

  const result = {
    overall_score,
    risk_level,
    approval_probability,
    confidence: avg_confidence,
    breakdown: {
      social: {
        score: social.social_score,
        weight: WEIGHTS.social,
        weighted: Math.round(social.social_score * WEIGHTS.social),
        data_availability: social.data_availability,
        key_flags: social.flags.slice(0, 3),
      },
      financial: {
        score: financial.financial_score,
        weight: WEIGHTS.financial,
        weighted: Math.round(financial.financial_score * WEIGHTS.financial),
        strength: financial.financial_strength,
        daily_budget_usd: financial.estimated_daily_budget_usd,
      },
      intent: {
        score: intent.intent_score,
        weight: WEIGHTS.intent,
        weighted: Math.round(intent.intent_score * WEIGHTS.intent),
        recommended_visa_duration: intent.recommended_visa_duration,
        key_return_signals: intent.return_intent_signals.slice(0, 3),
      },
      consistency: {
        score: consistency.consistency_score,
        weight: WEIGHTS.consistency,
        weighted: Math.round(consistency.consistency_score * WEIGHTS.consistency),
        inconsistencies_count: consistency.inconsistencies.length,
        deception_indicators: consistency.deception_indicators,
      },
    },
    flags,
    recommendations,
    scoring_metadata: {
      weights: WEIGHTS,
      model_version: '1.0.0',
      scored_at: new Date().toISOString(),
    },
  };

  logger.info('Score aggregation complete', {
    overall_score,
    risk_level,
    approval_probability,
    flags_count: flags.length,
  });

  return result;
}

function getRiskLevel(score) {
  if (score >= 70) return 'low';
  if (score >= 40) return 'medium';
  return 'high';
}

function calculateApprovalProbability(overall_score, scores) {
  let probability = overall_score;
  const { intent, financial, consistency } = scores;

  if (intent.recommended_visa_duration === 'deny') {
    probability = Math.min(probability, 15);
  }
  if (consistency.deception_indicators && consistency.deception_indicators.length >= 3) {
    probability *= 0.5;
  }
  if (financial.financial_strength === 'insufficient') {
    probability = Math.min(probability, 30);
  }
  if (intent.intent_score >= 85 && intent.return_intent_signals.length >= 4) {
    probability = Math.min(100, probability + 8);
  }

  return Math.round(Math.min(100, Math.max(0, probability)));
}

function collectFlags(scores) {
  const flags = [];
  scores.social.flags.forEach((f) => flags.push({ module: 'social', flag: f }));
  scores.consistency.inconsistencies.forEach((i) =>
    flags.push({ module: 'consistency', flag: i })
  );
  scores.consistency.deception_indicators.forEach((d) =>
    flags.push({ module: 'consistency', flag: `⚠️ Deception indicator: ${d}` })
  );
  scores.intent.immigration_risk_signals.forEach((s) =>
    flags.push({ module: 'intent', flag: s })
  );
  scores.financial.funding_concerns.forEach((c) =>
    flags.push({ module: 'financial', flag: c })
  );
  return flags.slice(0, 20);
}

function generateRecommendations(scores, overall_score) {
  const recs = [];

  if (scores.financial.financial_score < 60) {
    recs.push(...scores.financial.recommended_proof_of_funds);
  }
  if (scores.financial.financial_score < 40) {
    recs.push('Provide 3-6 months of bank statements showing consistent income');
    recs.push('Consider applying for a shorter duration to reduce financial requirements');
  }
  if (scores.intent.intent_score < 60) {
    recs.push('Provide documentation of strong home country ties (employment letter, property deeds)');
    recs.push('Include return flight booking confirmation in application');
  }
  if (scores.intent.immigration_risk_signals.length > 3) {
    recs.push('Consider having a local sponsor or host in destination country provide an invitation letter');
  }
  if (scores.consistency.consistency_score < 60) {
    recs.push('Review your application for inconsistencies before submission');
    recs.push('Provide supporting documents to explain any apparent discrepancies');
  }
  if (scores.social.social_score < 50 && scores.social.data_availability !== 'none') {
    recs.push('Review and clean up public social media profiles before applying');
    recs.push('Ensure social media presence reflects the stated purpose of travel');
  }
  if (overall_score < 40) {
    recs.push('Consider consulting with an immigration attorney before applying');
    recs.push('Strengthening your profile significantly before application is strongly recommended');
  }

  return [...new Set(recs)].slice(0, 10);
}
