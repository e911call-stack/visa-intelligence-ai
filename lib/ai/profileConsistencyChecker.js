// lib/ai/profileConsistencyChecker.js
import { callAI } from '../openai.js';
import logger from '../logger.js';

const SYSTEM_PROMPT = `You are a senior immigration officer specializing in detecting inconsistencies in visa applications.
Your job is to cross-reference all provided applicant data and identify contradictions, implausibilities, or suspicious patterns.

CONSISTENCY CHECKS:
1. Employment vs Income: Does stated employment status match income level?
2. Income vs Travel History: Does income support the travel history claimed?
3. Profile narrative vs factual data: Does the written profile match the hard data?
4. Purpose of travel vs background: Is the stated purpose credible given their profile?
5. Employment vs Assets: Do assets align with employment history?
6. Nationality + Employment + Income: Is the combination globally plausible?
7. Travel history recency: Do recent travels support the stated lifestyle?

SCORING (0-100, where 100 = perfectly consistent, no red flags):
- 85-100: Highly consistent, all elements align well
- 65-84: Mostly consistent, minor gaps acceptable
- 40-64: Notable inconsistencies requiring explanation
- 20-39: Significant contradictions, likely deception
- 0-19: Severe inconsistencies, application integrity compromised

OUTPUT: Return exactly this JSON structure:
{
  "consistency_score": <number 0-100>,
  "confidence": <number 0-100>,
  "inconsistencies": [<array of specific inconsistency strings, max 10>],
  "consistent_elements": [<array of elements that check out, max 10>],
  "deception_indicators": [<array of potential deception signals, max 5>],
  "reasoning": <string max 400 chars>
}`;

export async function checkProfileConsistency(input) {
  const {
    nationality,
    destination_country,
    employment_status,
    income,
    travel_history,
    profile_text,
    purpose_of_travel,
    assets,
  } = input;

  const annualIncome = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
  const countriesVisited = travel_history.map((t) => t.country);
  const refusedVisas = travel_history.filter((t) => t.refused);
  const recentTravel = travel_history
    .filter((t) => t.year >= new Date().getFullYear() - 3)
    .map((t) => `${t.country} (${t.year})`);

  logger.debug('Profile consistency check', {
    employment_status,
    income: annualIncome,
    travelEntries: travel_history.length,
    refusals: refusedVisas.length,
  });

  const userPrompt = `
Analyze this visa applicant's profile for internal consistency:

BASIC INFORMATION:
- Nationality: ${nationality}
- Destination: ${destination_country}
- Purpose of Travel: ${purpose_of_travel}

EMPLOYMENT & FINANCES:
- Employment Status: ${employment_status}
- Income: ${income.amount} ${income.currency} (${income.frequency})
- Estimated Annual Income (stated currency): ${annualIncome} ${income.currency}
- Property Owner: ${assets?.property || false}
- Estimated Savings: ${assets?.savings_usd || 0} USD
- Business Owner: ${assets?.business_ownership || false}

TRAVEL HISTORY:
- Countries visited: ${countriesVisited.join(', ') || 'None declared'}
- Recent travel (last 3 years): ${recentTravel.join(', ') || 'None'}
- Previous visa refusals: ${refusedVisas.length > 0 ? refusedVisas.map((r) => r.country).join(', ') : 'None'}

PROFILE NARRATIVE:
"${profile_text}"

Identify all inconsistencies, contradictions, or implausibilities.
`;

  const result = await callAI({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    context: 'profile-consistency-checker',
    maxTokens: 700,
  });

  const validated = {
    consistency_score: clamp(Number(result.consistency_score), 0, 100),
    confidence: clamp(Number(result.confidence), 0, 100),
    inconsistencies: Array.isArray(result.inconsistencies) ? result.inconsistencies.slice(0, 10) : [],
    consistent_elements: Array.isArray(result.consistent_elements) ? result.consistent_elements.slice(0, 10) : [],
    deception_indicators: Array.isArray(result.deception_indicators) ? result.deception_indicators.slice(0, 5) : [],
    reasoning: String(result.reasoning || '').slice(0, 400),
  };

  logger.info('Consistency check complete', {
    consistency_score: validated.consistency_score,
    inconsistencies: validated.inconsistencies.length,
  });

  return validated;
}

function clamp(val, min, max) {
  if (isNaN(val)) return 50;
  return Math.min(max, Math.max(min, val));
}
