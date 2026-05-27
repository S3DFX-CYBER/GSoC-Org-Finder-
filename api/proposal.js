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

// Fix 3: normalize githubRepo — strips full URLs down to "owner/repo"
function normalizeRepo(raw) {
  if (!raw) return '';
  try {
    const str = raw.includes('://') ? raw : `https://github.com/${raw}`;
    const url = new URL(str);
    return url.pathname.replace(/^\//, '').replace(/\/$/, '');
  } catch {
    return raw.replace(/^\/|\/$/g, '');
  }
}

export default async function handler(req) {
  // Fix 1: CORS — only allow your own site, not the whole internet
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://your-vercel-app.vercel.app';
  const origin = req.headers.get('origin') || '';

  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    if (origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Block requests from unknown origins
  if (origin !== ALLOWED_ORIGIN) {
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders });
  }

  const { orgName, description, tags, domain, fit, githubRepo } = body;

  if (!orgName) {
    return new Response(JSON.stringify({ error: 'Missing orgName' }), { status: 400, headers: corsHeaders });
  }

  // Check cache first
  const cacheKey = `proposal__${orgName}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(JSON.stringify({ outline: cached.outline, cached: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Cache-Control': 's-maxage=3600' },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error: GROQ_API_KEY not set' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const tagsStr  = Array.isArray(tags) && tags.length ? tags.join(', ') : 'Not specified';
  const fitStr   = Array.isArray(fit)  && fit.length  ? fit.join(', ')  : 'Not specified';
  // Fix 3: use normalized repo value
  const safeRepo = normalizeRepo(githubRepo);
  const repoUrl  = safeRepo ? `https://github.com/${safeRepo}` : 'Not specified';

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

  // Fix 2: AbortController — 15 second timeout so the edge function never stalls
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return new Response(JSON.stringify({ error: `LLM API error: ${response.status}`, detail: errText }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    const data = await response.json();
    const outline = data.choices?.[0]?.message?.content ?? 'Unable to generate outline.';

    safeCacheSet(cacheKey, { outline, ts: Date.now() });

    return new Response(JSON.stringify({ outline }), {
      status: 200,
      headers: { ...corsHeaders, 'Cache-Control': 's-maxage=3600' },
    });

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Request timed out. Please try again.' }), {
        status: 504,
        headers: corsHeaders,
      });
    }
    return new Response(JSON.stringify({ error: 'Failed to reach LLM API' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}