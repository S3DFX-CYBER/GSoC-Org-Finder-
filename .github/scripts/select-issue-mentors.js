'use strict';
const fs = require('fs');

const mentorsPath = '.github/reviewers/gssoc-mentors.json';
const statsPath   = '.github/reviewers/mentor-stats.json';

function readJsonSafe(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function toNum(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }

function daysSince(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, (Date.now() - t) / 86400000);
}

function safeParseArray(envVar) {
  try {
    const p = JSON.parse(process.env[envVar] || '[]');
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

const claimant = String(process.env.ISSUE_CLAIMANT || '').trim().toLowerCase();
const excluded = new Set(
  safeParseArray('EXCLUDED_MENTORS').map(v => String(v).trim().toLowerCase())
);
const maxMentors = Math.max(1, toNum(process.env.MAX_MENTORS || 2));

const mentorData = readJsonSafe(mentorsPath, { reviewers: [] });
const mentors = (mentorData.reviewers || [])
  .filter(Boolean)
  .map(u => String(u).trim())
  .filter(u => u.length > 0)
  .filter((u, i, arr) =>
    arr.findIndex(v => v.toLowerCase() === u.toLowerCase()) === i
  );

const rawStats = readJsonSafe(statsPath, { mentors: {} }).mentors || {};
const stats = {};
for (const [k, v] of Object.entries(rawStats)) {
  stats[String(k).trim().toLowerCase()] = v || {};
}

const scored = mentors.map(username => {
  const lower = username.toLowerCase();
  const s     = stats[lower] || {};
  const recencyDays  = daysSince(s.last_reviewed_at);
  const neverReviewed = recencyDays === null;
  const inactivityPenalty = neverReviewed ? 5 : Math.min(40, recencyDays * 0.8);
  const approvals       = toNum(s.approvals);
  const merged          = toNum(s.merged_reviews);
  const quality         = toNum(s.review_quality_score);
  const assignApprovals = toNum(s.assignment_approvals);
  const priorityReviews = toNum(s.priority_reviews);
  const totalReviews    = toNum(s.reviews);
  const overloadPenalty = Math.max(0, totalReviews - approvals * 2) * 0.15;
  let score = 0;
  score += Math.min(25, approvals * 1.2);
  score += Math.min(20, merged * 2);
  score += Math.min(25, quality);
  score += Math.min(10, assignApprovals * 1.5);
  score += Math.min(8,  priorityReviews * 0.7);
  score += Math.min(8,  Math.log2(totalReviews + 1) * 3);
  score -= inactivityPenalty;
  score -= overloadPenalty;
  const disqualified = (
    lower === claimant ||
    excluded.has(lower) ||
    (recencyDays !== null && recencyDays > 60)
  );
  return { username, score, recencyDays, neverReviewed, disqualified };
});

const selected = scored
  .filter(s => !s.disqualified)
  .sort((a, b) =>
    b.score - a.score ||
    ((a.recencyDays ?? 9999) - (b.recencyDays ?? 9999)) ||
    a.username.localeCompare(b.username)
  )
  .slice(0, maxMentors)
  .map(s => s.username);

process.stdout.write(JSON.stringify({ selected, candidates: scored.length }));
