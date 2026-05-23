'use strict';

/**
 * generate-leaderboard-comment.js
 *
 * Generates a PR comment that shows:
 *  1. Contributor leaderboard  — how this PR author ranks vs others
 *  2. Mentor leaderboard       — top active mentors this month (OWASP-BLT style)
 *
 * Called by leaderboard.yml on pull_request_target closed+merged.
 */

const fs   = require('fs');
const path = require('path');

const token           = process.env.GITHUB_TOKEN;
const username        = process.env.PR_AUTHOR;
const userType        = process.env.PR_AUTHOR_TYPE;
const userAssociation = process.env.PR_AUTHOR_ASSOCIATION;
const action          = process.env.PR_ACTION;
const merged          = process.env.PR_MERGED === 'true';
const owner           = process.env.REPO_OWNER;
const repo            = process.env.REPO_NAME;

const EXCLUDED_USERS = ['S3DFX-CYBER'];


/**
 * Returns true if this user should be excluded from the contributor leaderboard.
 */
function isExcluded(login, type, association) {
  if (!login) return true;
  const lc = login.toLowerCase();
  const isBot =
    type === 'Bot' ||
    lc.endsWith('[bot]') ||
    lc.endsWith('-bot');
  const isMaintainer =
    association === 'OWNER' ||
    association === 'MEMBER';
  return (
    EXCLUDED_USERS.some(u => u.toLowerCase() === lc) ||
    isBot ||
    isMaintainer
  );
}

/** Safe JSON file reader — returns fallback when file is missing or invalid. */
function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

/** Fetch a GitHub API path and return parsed JSON. */
async function ghFetch(apiPath) {
  const res = await fetch(`https://api.github.com${apiPath}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/vnd.github+json',
      'User-Agent':  'gsoc-leaderboard-bot'
    }
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} — ${apiPath}`);
  return res.json();
}

/** Paginate over all closed PRs. */
async function getAllClosedPRs() {
  let page = 1;
  const all = [];
  while (true) {
    const prs = await ghFetch(
      `/repos/${owner}/${repo}/pulls?state=closed&per_page=100&page=${page}`
    );
    if (!prs.length) break;
    all.push(...prs);
    page++;
  }
  return all;
}

/** Medal emoji for top 3, number string for the rest. */
function rankLabel(index) {
  return ['🥇', '🥈', '🥉'][index] ?? `${index + 1}`;
}

/** Returns a month string like "May 2026" for grouping. */
function monthLabel(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}


/**
 * Reads mentor-stats.json and returns top N mentors sorted by:
 *   - merged_reviews this month (primary)
 *   - total score (secondary)
 *
 * This produces the OWASP-BLT style "Reviewer Leaderboard" section.
 */
function buildMentorLeaderboardSection(topN = 5) {
  const statsPath = path.join(
    '.github', 'reviewers', 'mentor-stats.json'
  );
  const data = readJson(statsPath, { mentors: {} });
  const mentors = data.mentors || {};

  const now       = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const rows = Object.entries(mentors)
    .map(([login, s]) => {
      const lastAt  = s.last_reviewed_at || '';
      const inMonth = lastAt.startsWith(thisMonth);

      const score = Number(
        (
          (Number(s.approvals        || 0) * 2) +
          (Number(s.merged_reviews   || 0) * 3) +
          (Number(s.assignment_approvals || 0) * 2) +
          (Number(s.reviews          || 0) * 0.5) +
          (Number(s.priority_reviews || 0) * 1.5) +
          Number(s.review_quality_score || 0)
        ).toFixed(2)
      );

      return {
        login,
        mergedReviews: Number(s.merged_reviews || 0),
        totalReviews:  Number(s.reviews        || 0),
        score,
        inMonth,
        lastAt
      };
    })
    .filter(r => r.totalReviews > 0)
    .sort((a, b) => {
      if (b.mergedReviews !== a.mergedReviews)
        return b.mergedReviews - a.mergedReviews;
      if (b.score !== a.score)
        return b.score - a.score;
      return a.login.localeCompare(b.login);
    })
    .slice(0, topN);

  if (!rows.length) {
    return [
      '',
      '---',
      '',
      '### 🔍 Mentor Leaderboard',
      '',
      `> Top mentors for ${now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}:`,
      '',
      '_No mentor activity recorded yet. Rankings will appear after reviews are submitted._',
      ''
    ].join('\n');
  }

  const monthStr = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const lines = [
    '',
    '---',
    '',
    '### 🔍 Mentor Leaderboard',
    '',
    `Top mentors for **${monthStr}**:`,
    '',
    '| Rank | Mentor | Reviews | Points |',
    '|---|---|---|---|'
  ];

  rows.forEach((r, i) => {
    lines.push(
      `| ${rankLabel(i)} | @${r.login} | ${r.mergedReviews} | ${r.score} |`
    );
  });

  lines.push('');
  lines.push(
    'Mentors earn **+3 points** per merged review, **+2 points** per approval. ' +
    'Thank you to everyone who helps review PRs! 🙏'
  );
  lines.push('');

  return lines.join('\n');
}


if (isExcluded(username, userType, userAssociation)) {
  process.exit(0);
}

(async () => {
  const closedPRs = await getAllClosedPRs();
  const openPRs   = await ghFetch(
    `/repos/${owner}/${repo}/pulls?state=open&per_page=100`
  );

  const contributorMap = new Map();

  for (const pr of closedPRs) {
    if (!pr.user || isExcluded(pr.user.login, pr.user.type, pr.author_association))
      continue;

    const login = pr.user.login;
    if (!contributorMap.has(login)) {
      contributorMap.set(login, { username: login, merged: 0, closed: 0, score: 0 });
    }
    const u = contributorMap.get(login);
    u.closed++;
    if (pr.merged_at) {
      u.merged++;
      u.score += 10;
    }
  }

  for (const pr of openPRs) {
    if (!pr.user || isExcluded(pr.user.login, pr.user.type, pr.author_association))
      continue;

    const login = pr.user.login;
    if (!contributorMap.has(login)) {
      contributorMap.set(login, { username: login, merged: 0, closed: 0, score: 0 });
    }
    contributorMap.get(login).score += 1;
  }

  const contributorBoard = Array.from(contributorMap.values())
    .sort((a, b) => b.score - a.score);

  const myRank = contributorBoard.findIndex(
    u => u.username.toLowerCase() === username.toLowerCase()
  ) + 1;

  const myEntry = contributorBoard.find(
    u => u.username.toLowerCase() === username.toLowerCase()
  );

  const nearby = contributorBoard.slice(
    Math.max(myRank - 3, 0),
    Math.min(myRank + 1, contributorBoard.length)
  );

  let title = '## 📊 Monthly Leaderboard';
  if (action === 'opened')            title = '##  Pull Request Opened';
  if (merged)                         title = '## 🎉 Pull Request Merged!';
  if (action === 'closed' && !merged) title = '## 📌 Pull Request Closed';

  let md = '';

  md += `<!-- leaderboard-${action} -->\n\n`;

  md += `${title}\n\n`;
  md += `Hi @${username}! Here's your current contributor ranking:\n\n`;

  md += '| Rank | Contributor | Merged PRs | Score |\n';
  md += '|---|---|---|---|\n';

  for (const u of nearby) {
    const r         = contributorBoard.indexOf(u) + 1;
    const highlight = u.username.toLowerCase() === username.toLowerCase() ? ' ' : '';
    md += `| ${rankLabel(r - 1)} | @${u.username}${highlight} | ${u.merged} | ${u.score} |\n`;
  }

  md += '\n';

  if (merged) {
    md += '🎊 Congratulations on getting your PR merged! Great work.\n\n';
  } else if (action === 'closed' && !merged) {
    md += '💡 This PR was closed without merge. Keep contributing — every attempt counts!\n\n';
  }

  md += `**Your Rank:** #${myRank || 'N/A'}  \n`;
  md += `**Your Score:** ${myEntry?.score ?? 0} points\n\n`;
  md += 'Keep contributing to climb the leaderboard 📈\n';

  md += buildMentorLeaderboardSection(5);

  console.log(md);
})();
