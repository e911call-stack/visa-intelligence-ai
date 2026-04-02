// lib/openai.js
// OpenAI client with retry logic and structured JSON enforcement — server-side only.
// Uses lazy initialisation so the module is safe to import at build time.

import OpenAI from 'openai';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let _client = null;

function getClient() {
  if (_client) return _client;
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
  return _client;
}

const getModel = () => process.env.OPENAI_MODEL || 'gpt-4o';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Core chat completion with retry and JSON enforcement.
 */
export async function callAI({ systemPrompt, userPrompt, context = 'ai-call', maxTokens = 1000 }) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await getClient().chat.completions.create({
        model: getModel(),
        max_tokens: maxTokens,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\n\nCRITICAL: You MUST respond with ONLY valid JSON. No prose, no markdown, no explanation. Your entire response must be parseable by JSON.parse().`,
          },
          { role: 'user', content: userPrompt },
        ],
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(raw);
      return parsed;

    } catch (err) {
      lastError = err;

      if (err instanceof SyntaxError) {
        throw new AIError(`Invalid JSON from AI module: ${context}`, 'INVALID_JSON', err);
      }
      if (err?.status === 401 || err?.status === 402 || err?.status === 403) {
        throw new AIError('OpenAI auth/billing error', 'AUTH_ERROR', err);
      }
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new AIError(
    `AI call failed after ${MAX_RETRIES} attempts: ${context}`,
    'MAX_RETRIES',
    lastError
  );
}

export class AIError extends Error {
  constructor(message, code, cause) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.cause = cause;
  }
}
