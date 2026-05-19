const fs = require('fs');

const stats = JSON.parse(fs.readFileSync('.github/reviewers/mentor-stats.json', 'utf8'));
const mentors = Object.entries(stats.mentors || {});
const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

function formatLastActive(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const days = Math.floor((now - d.getTime()) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

const ranked = mentors
  .map(([username, m]) => {
    const last = m.last_reviewed_at ? new Date(m.last_reviewed_at).getTime() : 0;
    const recencyBoost = Math.max(0, 30 - Math.floor((now - last) / DAY));
    const score = m.reviews * 2 + m.approvals * 3 + recencyBoost;
    return { username, ...m, score, lastTs: last };
  })
  .sort((a, b) => b.score - a.score || b.reviews - a.reviews || b.lastTs - a.lastTs || a.username.localeCompare(b.username));

const medal = ['🥇', '🥈', '🥉'];
const rows = ranked.map((m, idx) => `| ${medal[idx] || `#${idx + 1}`} | @${m.username} | ${m.reviews} | ${m.approvals} | ${formatLastActive(m.last_reviewed_at)} |`);

const markdown = [
  '## 🔎 Mentor Leaderboard',
  '',
  '| Rank | Mentor | Reviews | Approvals | Last Active |',
  '|------|------|------|------|------|',
  ...(rows.length ? rows : ['| - | - | 0 | 0 | Never |'])
].join('\n');

fs.writeFileSync('.github/reviewers/mentor-leaderboard.md', `${markdown}\n`);
