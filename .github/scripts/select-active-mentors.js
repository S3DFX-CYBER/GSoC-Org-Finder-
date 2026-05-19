const DAY_MS = 24 * 60 * 60 * 1000;

function toNum(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function scoreMentor(entry, nowMs) {
  const stats = entry.stats;
  const lastTs = stats.last_reviewed_at ? new Date(stats.last_reviewed_at).getTime() : 0;
  const inactivityDays = lastTs ? Math.floor((nowMs - lastTs) / DAY_MS) : 9999;
  const score =
    toNum(stats.reviews) * 2 +
    toNum(stats.approvals) * 3 +
    toNum(stats.merged_reviews) * 5 +
    toNum(stats.assignment_approvals) * 2;

  let adjusted = score;
  if (inactivityDays > 14) adjusted -= 50;

  return { ...entry, score, adjusted, inactivityDays, lastTs };
}

function selectActiveMentors({ mentors = [], stats = {}, exclude = [], count = 2, recentMentorPings = [], maxOpenAssignments = 10, now = Date.now() }) {
  const excluded = new Set((exclude || []).map((x) => String(x).toLowerCase()));
  const recentlyPinged = new Set((recentMentorPings || []).map((x) => String(x).toLowerCase()));
  const mentorMap = stats.mentors || {};

  const base = mentors.map((username) => ({
    username,
    stats: mentorMap[username] || {}
  }))
  .filter((m) => !excluded.has(m.username.toLowerCase()))
  .map((m) => scoreMentor(m, now))
  .filter((m) => m.inactivityDays <= 30)
  .filter((m) => toNum(m.stats.open_assignments) < maxOpenAssignments)
  .filter((m) => !recentlyPinged.has(m.username.toLowerCase()));

  const active = base.filter((m) => m.inactivityDays <= 14 && toNum(m.stats.reviews) >= 2);
  const fallbackRecent = base.filter((m) => m.inactivityDays <= 30);
  const pool = active.length ? active : fallbackRecent;

  const ranked = pool.sort((a, b) => b.adjusted - a.adjusted || a.inactivityDays - b.inactivityDays || a.username.localeCompare(b.username));
  const top = ranked.slice(0, Math.max(count * 3, count));
  const shuffled = [...top].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((m) => m.username);
}

module.exports = { selectActiveMentors };

if (require.main === module) {
  const fs = require('fs');
  const mentorsData = JSON.parse(fs.readFileSync('.github/reviewers/gssoc-mentors.json', 'utf8'));
  const mentorStats = JSON.parse(fs.readFileSync('.github/reviewers/mentor-stats.json', 'utf8'));
  const selected = selectActiveMentors({ mentors: mentorsData.reviewers || [], stats: mentorStats, count: Number(process.env.MAX_MENTORS || '5') }).map((username) => ({ username }));
  process.stdout.write(JSON.stringify({ selected }, null, 2));
}
