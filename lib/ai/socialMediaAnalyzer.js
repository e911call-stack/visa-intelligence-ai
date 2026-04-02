// lib/ai/socialMediaAnalyzer.js
import { callAI } from '../openai.js';
import logger from '../logger.js';

const SYSTEM_PROMPT = `You are an expert immigration risk analyst specializing in social media assessment for visa applications.
Analyze the provided social media data and applicant profile for risk signals relevant to visa approvals.

SCORING CRITERIA (score 0-100, where 100 = lowest risk / most favorable):
- Stability indicators: consistent posting history, professional content, no red flags
- Content risk: extremist content, criminal affiliations, anti-government statements = high risk
- Travel intent signals: posts suggesting intent to overstay, illegal work, or immigration fraud
- Professional presence: LinkedIn, professional networking = positive
- Missing social media: treat as neutral (score 50), not suspicious
- Lifestyle consistency: does stated lifestyle match apparent online behavior?

RISK FLAGS to check for:
- Statements about wanting to "never come back" or "stay forever"
- Connections to human trafficking networks
- Extremist or terrorist-related content
- Criminal history references
- Anti-destination-country sentiment
- Inconsistency between stated purpose and social content

OUTPUT: Return exactly this JSON structure:
{
  "social_score": <number 0-100>,
  "confidence": <number 0-100>,
  "flags": [<array of specific risk flag strings, max 10>],
  "positive_signals": [<array of positive indicator strings, max 10>],
  "data_availability": "full" | "partial" | "none",
  "reasoning": <string max 300 chars>
}`;

export async function analyzeSocialMedia(input) {
  const { social_media_data, nationality, destination_country, profile_text } = input;

  const hasSocialData =
    social_media_data &&
    (social_media_data.platforms?.length > 0 || social_media_data.bio_snippet);

  if (!hasSocialData) {
    return {
      social_score: 50,
      confidence: 30,
      flags: [],
      positive_signals: ['No social media data provided — neutral assessment applied'],
      data_availability: 'none',
      reasoning: 'No social media data was provided. Neutral score applied per standard protocol.',
    };
  }

  const userPrompt = `
Applicant Nationality: ${nationality}
Destination Country: ${destination_country}

Social Media Data:
- Platforms active on: ${social_media_data.platforms?.join(', ') || 'Not specified'}
- Posts per week: ${social_media_data.posts_per_week ?? 'Unknown'}
- Content topics: ${social_media_data.topics?.join(', ') || 'Not specified'}
- Public profile: ${social_media_data.public_profile ?? 'Unknown'}
- Bio/Recent content snippet: "${social_media_data.bio_snippet || 'Not provided'}"
- Pre-identified flags: ${social_media_data.flags?.join(', ') || 'None'}

Applicant Profile Text: "${profile_text.slice(0, 500)}"

Assess visa risk from this social media data.
`;

  const result = await callAI({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    context: 'social-media-analyzer',
    maxTokens: 600,
  });

  const validated = {
    social_score: clamp(Number(result.social_score), 0, 100),
    confidence: clamp(Number(result.confidence), 0, 100),
    flags: Array.isArray(result.flags) ? result.flags.slice(0, 10) : [],
    positive_signals: Array.isArray(result.positive_signals) ? result.positive_signals.slice(0, 10) : [],
    data_availability: ['full', 'partial', 'none'].includes(result.data_availability)
      ? result.data_availability
      : 'partial',
    reasoning: String(result.reasoning || '').slice(0, 300),
  };

  logger.info('Social media analysis complete', { social_score: validated.social_score });
  return validated;
}

function clamp(val, min, max) {
  if (isNaN(val)) return 50;
  return Math.min(max, Math.max(min, val));
}
