export const config = { runtime: 'edge' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function fallbackReply(question, shortlistedOrgs) {
  const q = String(question || '').toLowerCase();
  const picks = (shortlistedOrgs || []).slice(0, 3);
  if (!picks.length) {
    return 'I could not find a close match yet. Try adding specific skills like Python, web, healthcare, ML, or robotics.';
  }
  const intro = q.includes('health') || q.includes('medical')
    ? 'Healthcare-oriented options from the 2026 selected organizations:'
    : 'Based on your interests, you can start with these 2026 organizations:';
  const lines = picks.map((org, i) =>
    `${i + 1}. ${org.name} - tags: ${(org.tags || []).slice(0, 4).join(', ')}; fit: ${(org.fit || []).slice(0, 2).join(', ')}`
  );
  return `${intro}\n${lines.join('\n')}\n\nShare your preferred language/domain and I can narrow this further.`;
}

function buildPrompt(question, shortlistedOrgs, recentMessages) {
  const compact = (shortlistedOrgs || []).slice(0, 8).map(org => ({
    name: org.name,
    tags: org.tags || [],
    fit: org.fit || [],
    category: org.category || '',
    desc: org.desc || '',
    ideas: org.ideas || '',
    github: org.github || ''
  }));

  return [
    {
      role: 'system',
      content: [
        'You are GSoC Guide for a 2026 org finder.',
        'Rules:',
        '- Use ONLY organizations present in the provided shortlist context.',
        '- Never invent organizations or years.',
        '- Give concise recommendations with rationale mapped to tags and fit profile.',
        '- Provide up to 3 recommendations.',
        '- End with one clarifying follow-up question.',
        '- Tone: warm and beginner-friendly.'
      ].join('\n')
    },
    ...(Array.isArray(recentMessages) ? recentMessages : []).slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '')
    })),
    {
      role: 'user',
      content: `User request: ${question}\n\nGrounding shortlist JSON:\n${JSON.stringify(compact)}`
    }
  ];
}

async function callOpenAI(messages) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 420
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return json({}, 204);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const question = String(body?.question || '').trim();
    const shortlistedOrgs = Array.isArray(body?.shortlistedOrgs) ? body.shortlistedOrgs : [];
    const recentMessages = Array.isArray(body?.recentMessages) ? body.recentMessages : [];

    if (!question) return json({ error: 'Missing question' }, 400);
    if (!shortlistedOrgs.length) return json({ reply: fallbackReply(question, shortlistedOrgs) });

    const messages = buildPrompt(question, shortlistedOrgs, recentMessages);
    const llm = await callOpenAI(messages);
    if (llm) return json({ reply: llm });

    return json({ reply: fallbackReply(question, shortlistedOrgs) });
  } catch (error) {
    return json({ reply: 'I could not process that request right now. Please try again.' }, 200);
  }
}
