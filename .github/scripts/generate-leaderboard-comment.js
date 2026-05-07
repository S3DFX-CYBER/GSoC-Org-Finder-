const fs = require('fs');
const path = require('path');

const leaderboardPath = path.join(process.cwd(), 'data/nsoc-leaderboard.json');

if (!fs.existsSync(leaderboardPath)) {
  console.log('## ⚠️ Leaderboard Data Missing');
  process.exit(0);
}

const leaderboard = JSON.parse(
  fs.readFileSync(leaderboardPath, 'utf8')
);

const username = process.env.PR_AUTHOR;
const merged = process.env.PR_MERGED === 'true';
const action = process.env.PR_ACTION;

const sorted = [...leaderboard.users]
  .sort((a, b) => b.score - a.score);

const rank = sorted.findIndex(
  u => u.username.toLowerCase() === username.toLowerCase()
) + 1;

const currentUser = sorted.find(
  u => u.username.toLowerCase() === username.toLowerCase()
);

if (!currentUser) {
  console.log(
`## 👋 Welcome Contributor

Hi @${username}!

Thanks for contributing to this repository 🚀`
  );

  process.exit(0);
}

const nearby = sorted.slice(
  Math.max(rank - 2, 0),
  Math.min(rank + 1, sorted.length)
);

let header = '## 📊 Monthly Leaderboard';

if (action === 'opened') {
  header = '## 🚀 Pull Request Opened';
}

if (merged) {
  header = '## 🎉 Pull Request Merged';
}

if (action === 'closed' && !merged) {
  header = '## 📌 Pull Request Closed';
}

let body = `${header}\n\n`;

body += `Hi @${username}! Here's your current ranking:\n\n`;

body += '| Rank | User | Open PRs | Merged PRs | Score |\n';
body += '|---|---|---|---|---|\n';

for (const user of nearby) {
  const userRank = sorted.indexOf(user) + 1;
  const highlight = user.username.toLowerCase() === username.toLowerCase()
    ? ' ✨'
    : '';

  body += `| ${userRank} | @${user.username}${highlight} | ${user.open_prs} | ${user.merged_prs} | ${user.score} |\n`;
}

body += '\n';

if (merged) {
  body += 'Congratulations on getting your PR merged 🚀\n\n';
}

if (action === 'closed' && !merged) {
  body += 'This PR was closed without merge. Keep improving and contributing 💡\n\n';
}

body += `Current Rank: **#${rank}**\n\n`;
body += `Current Score: **${currentUser.score}**\n\n`;
body += 'Keep contributing to climb the leaderboard 📈';

console.log(body);