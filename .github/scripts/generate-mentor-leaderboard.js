const fs = require('fs');

const mentorsPath = '.github/reviewers/gssoc-mentors.json';
const statsPath = '.github/reviewers/mentor-stats.json';
const outPath = '.github/reviewers/mentor-leaderboard.md';

function readJson(path, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return fallback;
    }

    throw err;
  }
}

function n(v) {
  return Number.isFinite(Number(v))
    ? Number(v)
    : 0;
}

const mentors =
  Array.from(
    new Map(
      (
        readJson(mentorsPath, {
          reviewers: []
        }).reviewers || []
      )
        .map((m) => String(m).trim())
        .filter((m) => m.length > 0)
        .map((m) => [m.toLowerCase(), m])
    ).values()
  );

const rawStats =
  readJson(statsPath, {});

const statsSource =
  rawStats.mentors || rawStats;

const stats =
  Object.fromEntries(
    Object.entries(statsSource).map(
      ([key, value]) => [
        String(key).trim().toLowerCase(),
        value
      ]
    )
  );

const rows = mentors
  .map((username) => {

    const s =
      stats[username.toLowerCase()] || {};

    return {
      username,
      reviews: n(s.reviews),
      score: n(s.score)
    };

  })
  .sort((a, b) => {

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.username.toLowerCase().localeCompare(
      b.username.toLowerCase()
    );
  });

const medals = [
  '🥇',
  '🥈',
  '🥉'
];

const lines = [
  '# 🏆 Mentor Review Leaderboard',
  '',
  '> Tracks mentor review activity and review quality across all merged pull requests.',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '| Rank | Mentor | Reviews | Score |',
  '|------|--------|---------|-------|',

  ...rows.map((r, index) =>
    `| ${medals[index] || `${index + 1}`} | @${r.username} | ${r.reviews} | ${r.score} |`
  )
];

const next =
  `${lines.join('\n')}\n`;

const normalize = (content) =>
  content.replace(
    /Generated:.*\n/,
    ''
  );

const previous =
  fs.existsSync(outPath)
    ? fs.readFileSync(outPath, 'utf8')
    : '';

if (
  previous &&
  normalize(previous) === normalize(next)
) {
  console.log(
    'No leaderboard changes'
  );

  process.exit(0);
}

fs.writeFileSync(outPath, next);

console.log(
  'Leaderboard updated'
);
