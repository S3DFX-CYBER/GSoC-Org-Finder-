const token = process.env.GITHUB_TOKEN;

const username = process.env.PR_AUTHOR;
const action = process.env.PR_ACTION;
const merged = process.env.PR_MERGED === 'true';

const owner = process.env.REPO_OWNER;
const repo = process.env.REPO_NAME;

async function github(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'nsoc-leaderboard'
    }
  });

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}`);
  }

  return res.json();
}

async function getAllClosedPRs() {
  let page = 1;
  let all = [];

  while (true) {
    const prs = await github(
      `/repos/${owner}/${repo}/pulls?state=closed&per_page=100&page=${page}`
    );

    if (!prs.length) break;

    all.push(...prs);

    page++;
  }

  return all;
}

(async () => {
  const prs = await getAllClosedPRs();

  const contributorMap = new Map();

  for (const pr of prs) {
    if (!pr.user) continue;

    const login = pr.user.login;

    if (!contributorMap.has(login)) {
      contributorMap.set(login, {
        username: login,
        merged: 0,
        closed: 0,
        score: 0
      });
    }

    const user = contributorMap.get(login);

    user.closed++;

    if (pr.merged_at) {
      user.merged++;
      user.score += 10;
    }
  }

  // Add open PR score
  const openPRs = await github(
    `/repos/${owner}/${repo}/pulls?state=open&per_page=100`
  );

  for (const pr of openPRs) {
    if (!pr.user) continue;

    const login = pr.user.login;

    if (!contributorMap.has(login)) {
      contributorMap.set(login, {
        username: login,
        merged: 0,
        closed: 0,
        score: 0
      });
    }

    const user = contributorMap.get(login);

    user.score += 1;
  }

  const leaderboard = Array.from(contributorMap.values())
    .sort((a, b) => b.score - a.score);

  const rank =
    leaderboard.findIndex(
      u => u.username.toLowerCase() === username.toLowerCase()
    ) + 1;

  const current =
    leaderboard.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

  let title = '## 📊 Monthly Leaderboard';

  if (action === 'opened') {
    title = '## 🚀 Pull Request Opened';
  }

  if (merged) {
    title = '## 🎉 Pull Request Merged';
  }

  if (action === 'closed' && !merged) {
    title = '## 📌 Pull Request Closed';
  }

  const nearby = leaderboard.slice(
    Math.max(rank - 2, 0),
    Math.min(rank + 1, leaderboard.length)
  );

  let md = '';

  md += `<!-- leaderboard-${action} -->\n\n`;

  md += `${title}\n\n`;

  md += `Hi @${username}! Here's your current ranking:\n\n`;

  md += '| Rank | User | Merged PRs | Score |\n';
  md += '|---|---|---|---|\n';

  for (const user of nearby) {
    const r = leaderboard.indexOf(user) + 1;

    const highlight =
      user.username.toLowerCase() === username.toLowerCase()
        ? ' ✨'
        : '';

    md += `| ${r} | @${user.username}${highlight} | ${user.merged} | ${user.score} |\n`;
  }

  md += '\n';

  if (merged) {
    md += 'Congratulations on getting your PR merged 🚀\n\n';
  }

  if (action === 'closed' && !merged) {
    md += 'This PR was closed without merge. Keep contributing 💡\n\n';
  }

  md += `Current Rank: **#${rank || 'N/A'}**\n\n`;

  md += `Current Score: **${current?.score || 0}**\n\n`;

  md += 'Keep contributing to climb the leaderboard 📈';

  console.log(md);
})();