'use strict';
const path = require('path');
const {
  canonicalizeMentor,
  readJsonSafe,
  weightedRandomSelect,
  seededRandom
} = require('./common-utils');

const mentorsPath = path.resolve(__dirname, '../reviewers/gssoc-mentors.json');
const statsPath   = path.resolve(__dirname, '../reviewers/mentor-stats.json');

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

const prAuthor = canonicalizeMentor(process.env.PR_AUTHOR);
const existingRequested = new Set(safeParseArray('EXISTING_REQUESTED').map(canonicalizeMentor));
const existingReviewers = new Set(safeParseArray('EXISTING_REVIEWERS').map(canonicalizeMentor));
const recentPings = new Set(safeParseArray('RECENT_MENTOR_PINGS').map(canonicalizeMentor));
const maxReviewers = Math.max(1, toNum(process.env.MAX_REVIEWERS || 2));
const prNumber = process.env.PR_NUMBER || '0';

const mentorData = readJsonSafe(mentorsPath, { reviewers: [] });
const mentors = (mentorData.reviewers || [])
  .filter(Boolean)
  .map(canonicalizeMentor)
  .filter(u => u.length > 0)
  .filter((u, i, arr) => arr.indexOf(u) === i); // deduplicate

const rawStats = readJsonSafe(statsPath, { mentors: {} }).mentors || {};
const stats = {};
for (const [k, v] of Object.entries(rawStats)) {
  stats[canonicalizeMentor(k)] = v || {};
}

const scoredCandidates = [];

for (const username of mentors) {
  const s = stats[username] || {};
  
  const recencyDays = daysSince(s.last_reviewed_at);
  const neverReviewed = recencyDays === null;
  
  if (
    username === prAuthor || 
    existingRequested.has(username) || 
    existingReviewers.has(username) || 
    recentPings.has(username) || 
    (recencyDays !== null && recencyDays > 60)
  ) {
    continue; // disqualified
  }

  const approvals = toNum(s.approvals) + toNum(s.assignment_approvals);
  const totalReviews = toNum(s.reviews);
  const quality = toNum(s.review_quality_score);
  const timeouts = toNum(s.timeouts);
  
  // Balanced score model
  const activity = Math.min(100, (approvals * 5) + (totalReviews * 2));
  const approvalRate = totalReviews > 0 ? (approvals / totalReviews) * 100 : 50;
  const responseSpeed = neverReviewed ? 50 : Math.max(0, 100 - (recencyDays * 5));
  const activeLoad = Math.max(0, totalReviews - approvals);
  
  let finalScore = (activity * 0.35) 
                 + (approvalRate * 0.25) 
                 + (responseSpeed * 0.20) 
                 - (timeouts * 0.15) 
                 - (activeLoad * 0.25);
                 
  // Ensure score is strictly positive for random weighting
  finalScore = Math.max(1, finalScore);
  
  scoredCandidates.push({ username, score: finalScore });
}

const seed = parseInt(prNumber, 10) + existingRequested.size * 1337;

const candidates = scoredCandidates.map(c => c.username);
const weights = scoredCandidates.map(c => c.score);

const selected = weightedRandomSelect(candidates, weights, maxReviewers, seed);

process.stdout.write(JSON.stringify({ selected, candidates: candidates.length }));
