// api/proposal.js — Vercel Edge Function
// Uses Groq API (free tier: ~14,400 req/day) instead of Anthropic
// ENV variable required: GROQ_API_KEY (get yours free at https://console.groq.com)
export const config = { runtime: 'edge' };

const CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 500;

function safeCacheSet(key, value) {
  if (!CACHE.has(key) && CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey);
  }
  CACHE.set(key, value);
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
  }

  const { orgName, description, tags, domain, fit, githubRepo } = body;

  if (!orgName) {
    return new Response(JSON.stringify({ error: 'Missing orgName' }), { status: 400, headers });
  }

  // Check cache first
  const cacheKey = `proposal__${orgName}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(JSON.stringify({ outline: cached.outline, cached: true }), {
      status: 200,
      headers: { ...headers, 'Cache-Control': 's-maxage=3600' },
    });
  }

  // ── Groq API key (free at https://console.groq.com) ──────────────────────
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error: GROQ_API_KEY not set' }), {
      status: 500,
      headers,
    });
  }

  const tagsStr = Array.isArray(tags) && tags.length ? tags.join(', ') : 'Not specified';
  const fitStr  = Array.isArray(fit)  && fit.length  ? fit.join(', ')  : 'Not specified';
  const repoUrl = githubRepo ? `https://github.com/${githubRepo}` : 'Not specified';

  const prompt = `You are a GSoC proposal writing assistant. Generate a structured GSoC proposal outline for the following organization:

Organization: ${orgName}
Domain: ${domain || 'Not specified'}
Tech Stack: ${tagsStr}
Description: ${description || 'Not specified'}
Ideal For: ${fitStr}
GitHub: ${repoUrl}

Generate a detailed GSoC proposal outline with these sections:
1. Personal Background & Motivation
2. Project Title (suggest one based on the org)
3. Abstract (3–4 sentences)
4. Goals & Deliverables (weekly milestones for 12 weeks)
5. Technical Approach
6. Why This Org
7. Prior Experience & Relevant Skills
8. Community Bonding Plan
9. Post-GSoC Plans

Keep it structured, actionable, and specific to this org's tech stack. Use plain text with clear section headers.`;

  try {
    // ── Groq API call (OpenAI-compatible format) ──────────────────────────
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // fast + high quality, free tier
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return new Response(JSON.stringify({ error: `LLM API error: ${response.status}`, detail: errText }), {
        status: 502,
        headers,
      });
    }

    const data = await response.json();
    // Groq uses OpenAI-compatible response format
    const outline = data.choices?.[0]?.message?.content ?? 'Unable to generate outline.';

    safeCacheSet(cacheKey, { outline, ts: Date.now() });

    return new Response(JSON.stringify({ outline }), {
      status: 200,
      headers: { ...headers, 'Cache-Control': 's-maxage=3600' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to reach LLM API: ' + err.message }), {
      status: 500,
      headers,
    });
  }
}