// lib/ai/financialEvaluator.js
import { callAI } from '../openai.js';
import logger from '../logger.js';

const SYSTEM_PROMPT = `You are an expert financial analyst for visa applications, specializing in assessing applicants' financial capability.
Your task is to evaluate whether the applicant has sufficient financial means for their stated travel purpose.

FINANCIAL EVALUATION CRITERIA:

1. INCOME ASSESSMENT:
   - Is income sufficient for the destination country costs?
   - Is income stable (employed vs unemployed)?
   - What is the income-to-cost ratio for the trip?
   - Is the income currency strong relative to destination?

2. ASSET EVALUATION:
   - Property ownership shows financial stability
   - Savings level relative to trip duration and costs
   - Business ownership shows economic ties

3. FINANCIAL RISK SIGNALS:
   - Very low income for expensive destination = concern
   - No savings declared = funding source unclear
   - Unemployed with expensive travel plans = suspicious
   - Inconsistency between stated income and assets

4. DESTINATION COST CONTEXT:
   - Expensive destinations (US, UK, Switzerland, etc.) require stronger financials
   - Mid-tier destinations (Eastern Europe, Southeast Asia) require moderate means
   - Budget travel requires proof of minimal funding

5. SCORING RUBRIC (0-100, where 100 = exceptional financial strength):
   - 85-100: Clearly can afford travel, significant financial buffer
   - 65-84: Adequate finances for stated purpose
   - 40-64: Borderline, may need additional financial proof
   - 20-39: Likely insufficient funds for stated travel
   - 0-19: Clear financial inadequacy, high risk of financial hardship abroad

IMPORTANT: Normalize for purchasing power. $20,000/year is excellent income in some countries, poor in others.

OUTPUT: Return exactly this JSON structure:
{
  "financial_score": <number 0-100>,
  "confidence": <number 0-100>,
  "estimated_daily_budget_usd": <number>,
  "financial_strength": "strong" | "adequate" | "borderline" | "insufficient",
  "funding_concerns": [<array of specific financial concerns, max 8>],
  "financial_positives": [<array of positive financial indicators, max 8>],
  "recommended_proof_of_funds": [<array of documents recommended, max 5>],
  "reasoning": <string max 400 chars>
}`;

export async function evaluateFinancialStrength(input) {
  const {
    nationality,
    destination_country,
    employment_status,
    income,
    travel_history,
    purpose_of_travel,
    assets,
  } = input;

  const annualIncome = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
  const countriesVisited = new Set(travel_history.map((t) => t.country)).size;

  logger.debug('Financial evaluation', {
    employment_status,
    annualIncome,
    currency: income.currency,
    savings: assets?.savings_usd,
    property: assets?.property,
  });

  const userPrompt = `
Evaluate the financial strength of this visa applicant:

DESTINATION: ${destination_country} (estimate daily cost context for this country)
NATIONALITY: ${nationality}
PURPOSE: ${purpose_of_travel}
EMPLOYMENT STATUS: ${employment_status}

INCOME:
- Amount: ${income.amount} ${income.currency} per ${income.frequency}
- Annual equivalent: approximately ${annualIncome} ${income.currency}

ASSETS:
- Property ownership: ${assets?.property ? 'Yes' : 'No'}
- Declared savings: ${assets?.savings_usd ? `$${assets.savings_usd} USD` : 'Not declared'}
- Business ownership: ${assets?.business_ownership ? 'Yes' : 'No'}

TRAVEL HISTORY (financial indicator):
- Countries visited previously: ${countriesVisited}
- Recent trips: ${travel_history.slice(-5).map((t) => `${t.country} (${t.year})`).join(', ') || 'None'}

Assess whether this applicant has the financial means to fund their trip to ${destination_country} and support themselves without working illegally.
`;

  const result = await callAI({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    context: 'financial-evaluator',
    maxTokens: 700,
  });

  const validStrengths = ['strong', 'adequate', 'borderline', 'insufficient'];

  const validated = {
    financial_score: clamp(Number(result.financial_score), 0, 100),
    confidence: clamp(Number(result.confidence), 0, 100),
    estimated_daily_budget_usd: Math.max(0, Number(result.estimated_daily_budget_usd) || 0),
    financial_strength: validStrengths.includes(result.financial_strength)
      ? result.financial_strength : 'borderline',
    funding_concerns: Array.isArray(result.funding_concerns) ? result.funding_concerns.slice(0, 8) : [],
    financial_positives: Array.isArray(result.financial_positives) ? result.financial_positives.slice(0, 8) : [],
    recommended_proof_of_funds: Array.isArray(result.recommended_proof_of_funds)
      ? result.recommended_proof_of_funds.slice(0, 5) : [],
    reasoning: String(result.reasoning || '').slice(0, 400),
  };

  logger.info('Financial evaluation complete', {
    financial_score: validated.financial_score,
    strength: validated.financial_strength,
  });

  return validated;
}

function clamp(val, min, max) {
  if (isNaN(val)) return 50;
  return Math.min(max, Math.max(min, val));
}
