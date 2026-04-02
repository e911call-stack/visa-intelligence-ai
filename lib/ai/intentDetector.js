// lib/ai/intentDetector.js
import { callAI } from '../openai.js';
import logger from '../logger.js';

const SYSTEM_PROMPT = `You are a specialist immigration analyst focused on detecting true immigration intent.
Your primary task: determine the probability that this applicant intends to return home vs. overstay/immigrate illegally.

INTENT ANALYSIS DIMENSIONS:
1. HOME COUNTRY TIES (strongest predictor):
   - Employment/business at home
   - Property ownership at home
   - Family ties (spouse, children, aging parents)
   - Long-term employment contracts
   
2. STATED PURPOSE CREDIBILITY:
   - Is the travel purpose specific and verifiable?
   - Does it match duration of stay?
   - Are there bookings, invitations, or institutional ties?
   
3. PUSH vs PULL FACTORS:
   - Economic push: Very low income, high unemployment rate in home country
   - Political push: Conflict zones, persecution risk
   - Economic pull: Destination has major wage differential
   - These create overstay incentive

4. BEHAVIORAL SIGNALS:
   - Vague profile narrative
   - Single with no dependents = weaker ties
   - Unemployed with high-income destination = concern
   - History of refusals = higher scrutiny

5. NATIONALITY RISK FACTORS:
   - Historical overstay rates for this nationality
   - Visa waiver status
   - Diplomatic relations

SCORING (0-100, where 100 = clearly temporary visit, strong return intent):
- 85-100: Extremely strong return intent, low overstay risk
- 65-84: Good return intent signals, minor concerns
- 40-64: Mixed signals, moderate overstay risk
- 20-39: Weak return intent, significant overstay concern
- 0-19: Very high immigration intent, likely would overstay

OUTPUT: Return exactly this JSON structure:
{
  "intent_score": <number 0-100>,
  "confidence": <number 0-100>,
  "return_intent_signals": [<array of strings supporting return intent, max 8>],
  "immigration_risk_signals": [<array of strings suggesting overstay risk, max 8>],
  "push_factors": [<economic/political push factors, max 5>],
  "pull_factors": [<destination pull factors, max 5>],
  "recommended_visa_duration": "short" | "medium" | "long" | "deny",
  "reasoning": <string max 400 chars>
}`;

export async function detectImmigrationIntent(input) {
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

  const hasReturnTrips = travel_history.some((t) => t.country !== destination_country);
  const visaRefusals = travel_history.filter((t) => t.refused).length;
  const countriesVisited = [...new Set(travel_history.map((t) => t.country))].length;

  logger.debug('Intent detection', {
    employment_status,
    purpose: purpose_of_travel,
    hasAssets: Boolean(assets?.property || assets?.business_ownership),
    visaRefusals,
  });

  const userPrompt = `
Assess immigration intent for this visa applicant:

APPLICANT PROFILE:
- Nationality: ${nationality}
- Destination Country: ${destination_country}
- Purpose of Travel: ${purpose_of_travel}
- Employment Status: ${employment_status}
- Income: ${income.amount} ${income.currency} (${income.frequency})

HOME COUNTRY TIES:
- Property owner in home country: ${assets?.property || false}
- Business owner: ${assets?.business_ownership || false}
- Savings (USD equivalent): ${assets?.savings_usd || 0}

TRAVEL HISTORY SUMMARY:
- Total unique countries visited: ${countriesVisited}
- Previous visa refusals: ${visaRefusals}
- Pattern of returning from trips: ${hasReturnTrips ? 'Yes' : 'No prior travel'}
- Recent travel (full list): ${
    travel_history.length > 0
      ? travel_history.map((t) => `${t.country} ${t.year}${t.refused ? ' [REFUSED]' : ''}`).join('; ')
      : 'None'
  }

APPLICANT'S OWN STATEMENT:
"${profile_text}"

Evaluate the probability this applicant will comply with visa terms and return home.
`;

  const result = await callAI({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    context: 'intent-detector',
    maxTokens: 700,
  });

  const validDurations = ['short', 'medium', 'long', 'deny'];

  const validated = {
    intent_score: clamp(Number(result.intent_score), 0, 100),
    confidence: clamp(Number(result.confidence), 0, 100),
    return_intent_signals: Array.isArray(result.return_intent_signals)
      ? result.return_intent_signals.slice(0, 8) : [],
    immigration_risk_signals: Array.isArray(result.immigration_risk_signals)
      ? result.immigration_risk_signals.slice(0, 8) : [],
    push_factors: Array.isArray(result.push_factors) ? result.push_factors.slice(0, 5) : [],
    pull_factors: Array.isArray(result.pull_factors) ? result.pull_factors.slice(0, 5) : [],
    recommended_visa_duration: validDurations.includes(result.recommended_visa_duration)
      ? result.recommended_visa_duration : 'short',
    reasoning: String(result.reasoning || '').slice(0, 400),
  };

  logger.info('Intent detection complete', {
    intent_score: validated.intent_score,
    recommended: validated.recommended_visa_duration,
  });

  return validated;
}

function clamp(val, min, max) {
  if (isNaN(val)) return 50;
  return Math.min(max, Math.max(min, val));
}
