// lib/ai/reportGenerator.js
import { callAI } from '../openai.js';
import logger from '../logger.js';

const SYSTEM_PROMPT = `You are a professional immigration consultant writing a visa assessment report.
Your report should be clear, professional, and actionable — suitable for the applicant to read and act upon.

Write a structured assessment that:
1. Summarizes the overall visa prospects honestly
2. Highlights the 3 most important risk factors
3. Lists specific, actionable recommendations
4. Uses professional but accessible language
5. Does NOT use jargon or overly technical terms

TONE: Professional, empathetic, factual. Not alarmist, not falsely optimistic.

OUTPUT: Return exactly this JSON structure:
{
  "executive_summary": <string, 150-250 words, overview of visa prospects>,
  "strength_summary": <string, 50-100 words, what works in applicant's favor>,
  "key_risks": [
    {
      "risk": <string, risk title>,
      "description": <string, 50-100 word explanation>,
      "severity": "low" | "medium" | "high" | "critical",
      "mitigation": <string, specific action to address this risk>
    }
  ],
  "recommendations": [
    {
      "priority": "urgent" | "important" | "optional",
      "action": <string, specific action item>,
      "reason": <string, why this matters>
    }
  ],
  "next_steps": [<string array, 3-5 immediate next steps in order>],
  "disclaimer": "This assessment is AI-generated and for informational purposes only. Consult a licensed immigration attorney for legal advice."
}`;

export async function generateReport(input, scoringResult) {
  const { nationality, destination_country, purpose_of_travel } = input;
  const { overall_score, risk_level, approval_probability, breakdown, flags } = scoringResult;

  logger.debug('Generating report', { overall_score, risk_level });

  const userPrompt = `
Write a visa assessment report for:
- Nationality: ${nationality}
- Destination: ${destination_country}
- Purpose: ${purpose_of_travel}

SCORING RESULTS:
- Overall Score: ${overall_score}/100
- Risk Level: ${risk_level.toUpperCase()}
- Estimated Approval Probability: ${approval_probability}%

MODULE BREAKDOWN:
- Social Media Score: ${breakdown.social.score}/100 (data: ${breakdown.social.data_availability})
- Financial Score: ${breakdown.financial.score}/100 (strength: ${breakdown.financial.strength})
- Intent Score: ${breakdown.intent.score}/100 (recommended visa: ${breakdown.intent.recommended_visa_duration})
- Consistency Score: ${breakdown.consistency.score}/100 (${breakdown.consistency.inconsistencies_count} inconsistencies found)

KEY FLAGS IDENTIFIED:
${flags.slice(0, 8).map((f) => `- [${f.module.toUpperCase()}] ${f.flag}`).join('\n') || '- No major flags'}

KEY RETURN INTENT SIGNALS:
${breakdown.intent.key_return_signals.map((s) => `- ${s}`).join('\n') || '- None identified'}

Write a professional assessment report with specific, actionable advice.
`;

  const result = await callAI({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    context: 'report-generator',
    maxTokens: 1200,
  });

  const validated = {
    executive_summary: String(result.executive_summary || '').slice(0, 1000),
    strength_summary: String(result.strength_summary || '').slice(0, 500),
    key_risks: Array.isArray(result.key_risks)
      ? result.key_risks.slice(0, 5).map((r) => ({
          risk: String(r.risk || ''),
          description: String(r.description || '').slice(0, 300),
          severity: ['low', 'medium', 'high', 'critical'].includes(r.severity)
            ? r.severity : 'medium',
          mitigation: String(r.mitigation || '').slice(0, 300),
        }))
      : [],
    recommendations: Array.isArray(result.recommendations)
      ? result.recommendations.slice(0, 8).map((r) => ({
          priority: ['urgent', 'important', 'optional'].includes(r.priority)
            ? r.priority : 'important',
          action: String(r.action || '').slice(0, 200),
          reason: String(r.reason || '').slice(0, 300),
        }))
      : [],
    next_steps: Array.isArray(result.next_steps)
      ? result.next_steps.slice(0, 5).map((s) => String(s).slice(0, 200))
      : [],
    disclaimer:
      result.disclaimer ||
      'This assessment is AI-generated and for informational purposes only. Consult a licensed immigration attorney for legal advice.',
  };

  logger.info('Report generated', {
    risks: validated.key_risks.length,
    recommendations: validated.recommendations.length,
  });

  return validated;
}
