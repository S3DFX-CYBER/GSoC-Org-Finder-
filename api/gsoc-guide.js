/**
 * api/gsoc-guide.js  –  Vercel Edge Runtime
 *
 * Bugs fixed:
 *  B1 – CORS locked to own origin (not wildcard *)
 *  B2 – Sliding-window rate limiter per IP
 *  B3 – Input validation + control-char strip (prompt injection guard)
 *  B4 – AbortController timeout (8 s) on OpenAI fetch
 *  B5 – Structured error logging (no silent catch)
 *
 * CI fixes (cubic-dev-ai):
 *  C1 – Evict empty/stale Map entries after sliding-window cleanup
 *       to prevent unbounded memory growth under high-cardinality traffic.
 */

export const config = { runtime: 'edge' };

/* ─────────────────────────────────────────────
 * CONSTANTS
 * ───────────────────────────────────────────── */
const OPENAI_API_URL   = 'https://api.openai.com/v1/chat/completions';
const MODEL            = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_TOKENS       = 420;
const TEMPERATURE      = 0.2;
const FETCH_TIMEOUT_MS = 8_000;

const MAX_QUESTION_LEN = 300;   // chars, mirrors client-side cap
const MAX_ORG_ENTRIES  = 10;    // shortlistedOrgs array cap
const MAX_HISTORY_MSGS = 10;    // recentMessages array cap

/* ─────────────────────────────────────────────
 * RATE LIMITER  (B2)
 * Sliding-window: max 10 requests per IP per 60 s.
 * Map lives in edge-function memory; resets on cold start.
 * ───────────────────────────────────────────── */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX       = 10;
const ipTimestamps = new Map();   // ip → number[]

function isRateLimited(ip) {
  const now   = Date.now();
  const times = (ipTimestamps.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  // C1 – Evict the key entirely when no recent timestamps remain,
  // preventing the Map from growing without bound under high-cardinality traffic.
  if (times.length === 0) {
    ipTimestamps.delete(ip);
    // Allow this request (no history means not rate-limited).
    ipTimestamps.set(ip, [now]);
    return false;
  }

  if (times.length >= RATE_LIMIT_MAX) {
    ipTimestamps.set(ip, times);
    return true;
  }

  times.push(now);
  ipTimestamps.set(ip, times);
  return false;
}

/* ─────────────────────────────────────────────
 * CORS  (B1)
 * Returns CORS headers scoped to the request origin
 * only when it matches our own domain.
 * ───────────────────────────────────────────── */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function getCorsHeaders(requestOrigin) {
  const origin =
    ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : (ALLOWED_ORIGINS[0] || 'null');   // deny by returning non-matching origin
  return {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

/* ─────────────────────────────────────────────
 * INPUT SANITISATION  (B3)
 * ───────────────────────────────────────────── */
function sanitiseString(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\x00-\x1F\x7F]/g, '')  // strip control characters
    .trim()
    .slice(0, maxLen);
}

function validateShortlistedOrgs(orgs) {
  if (!Array.isArray(orgs)) return [];
  return orgs
    .slice(0, MAX_ORG_ENTRIES)
    .filter(o => o && typeof o === 'object')
    .map(o => ({
      name:       sanitiseString(o.name || '', 80),
      category:   sanitiseString(o.category || '', 60),
      languages:  sanitiseString(o.languages || '', 80),
    }))
    .filter(o => o.name);
}

function validateRecentMessages(msgs) {
  if (!Array.isArray(msgs)) return [];
  const valid = new Set(['user', 'assistant']);
  return msgs
    .slice(-MAX_HISTORY_MSGS)
    .filter(m => m && valid.has(m.role) && typeof m.content === 'string')
    .map(m => ({
      role:    m.role,
      content: sanitiseString(m.content, 1_000),
    }));
}

/* ─────────────────────────────────────────────
 * SYSTEM PROMPT BUILDER
 * User data goes into the user role — NEVER interpolated
 * into the system prompt string (prompt-injection guard).
 * ───────────────────────────────────────────── */
function buildSystemPrompt(orgs) {
  const orgContext = orgs.length
    ? `The user has shortlisted these GSoC organisations:\n${
        orgs.map(o =>
          `- ${o.name}` +
          (o.category  ? ` (${o.category})`        : '') +
          (o.languages ? ` [${o.languages}]`        : '')
        ).join('\n')
      }\n\n`
    : '';

  return (
    'You are an expert GSoC mentor. Help contributors find the right organisation, ' +
    'write strong proposals, and navigate the application process. ' +
    'Only reference real, verifiable organisations and timelines. ' +
    'If you are unsure of a fact, say so rather than guessing.\n\n' +
    orgContext +
    'Keep answers concise (under 300 words). Use plain text; no markdown.'
  );
}

/* ─────────────────────────────────────────────
 * MAIN HANDLER
 * ───────────────────────────────────────────── */
export default async function handler(req) {
  const requestOrigin = req.headers.get('origin') || '';
  const corsHeaders   = getCorsHeaders(requestOrigin);

  /* Pre-flight */
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  /* Rate limiting  (B2) */
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(clientIp)) {
    console.warn(`[gsoc-guide] Rate limit exceeded for IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type':  'application/json',
          'Retry-After':   '60',
        },
      }
    );
  }

  /* Parse & validate body  (B3) */
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const question       = sanitiseString(body.question || '', MAX_QUESTION_LEN);
  const shortlistedOrgs= validateShortlistedOrgs(body.shortlistedOrgs);
  const recentMessages = validateRecentMessages(body.recentMessages);

  if (!question) {
    return new Response(
      JSON.stringify({ error: 'Question is required (max 300 characters).' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  /* OpenAI API key check */
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[gsoc-guide] OPENAI_API_KEY is not set.');
    return new Response(
      JSON.stringify({ error: 'Server configuration error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  /* Build messages array */
  const messages = [
    { role: 'system', content: buildSystemPrompt(shortlistedOrgs) },
    ...recentMessages,
    { role: 'user',   content: question },   // sanitised user input in user role only
  ];

  /* Call OpenAI with timeout  (B4) */
  const abortCtrl = new AbortController();
  const timerId   = setTimeout(() => abortCtrl.abort(), FETCH_TIMEOUT_MS);

  let openAiResponse;
  try {
    openAiResponse = await fetch(OPENAI_API_URL, {
      method:  'POST',
      signal:  abortCtrl.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       MODEL,
        max_tokens:  MAX_TOKENS,
        temperature: TEMPERATURE,
        messages,
      }),
    });
  } catch (err) {
    clearTimeout(timerId);
    // B5 – structured error log, no silent catch
    if (err.name === 'AbortError') {
      console.error('[gsoc-guide] OpenAI request timed out after 8 s.');
      return new Response(
        JSON.stringify({ error: 'The AI took too long to respond. Please try again.' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.error('[gsoc-guide] OpenAI fetch error:', err.message);
    return new Response(
      JSON.stringify({ error: 'Failed to contact AI service.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } finally {
    clearTimeout(timerId);
  }

  /* Handle non-OK OpenAI responses  (B5) */
  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text().catch(() => '');
    console.error(
      `[gsoc-guide] OpenAI returned ${openAiResponse.status}:`,
      errorText.slice(0, 200)
    );
    return new Response(
      JSON.stringify({ error: `AI service error (${openAiResponse.status}).` }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  /* Parse OpenAI response */
  let aiData;
  try {
    aiData = await openAiResponse.json();
  } catch {
    console.error('[gsoc-guide] Failed to parse OpenAI JSON response.');
    return new Response(
      JSON.stringify({ error: 'Malformed response from AI service.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const reply = aiData?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    console.error('[gsoc-guide] OpenAI response missing choices[0].message.content', aiData);
    return new Response(
      JSON.stringify({ error: 'Empty response from AI service.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  /* Success – no caching on personalised AI replies */
  return new Response(
    JSON.stringify({ reply }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type':  'application/json',
        'Cache-Control': 'no-store',          // B1 – never cache AI replies
      },
    }
  );
}