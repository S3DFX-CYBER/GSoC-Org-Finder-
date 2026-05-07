const fs = require('fs');
const path = require('path');

const leaderboardPath = path.join(
  process.cwd(),
  'data/nsoc-leaderboard.json'
);

const username = process.env.USERNAME;
const action = process.env.ACTION;
const merged = process.env.MERGED === 'true';

if (!fs.existsSync(leaderboardPath)) {
  fs.mkdirSync(path.dirname(leaderboardPath), { recursive: true });

  fs.writeFileSync(
    leaderboardPath,
    JSON.stringify(
      {
        updated_at: new Date().toISOString(),
        users: []
      },
      null,
      2
    )
  );
}

const leaderboard = JSON.parse(
  fs.readFileSync(leaderboardPath, 'utf8')
);

let user = leaderboard.users.find(
  u => u.username.toLowerCase() === username.toLowerCase()
);

if (!user) {
  user = {
    username,
    open_prs: 0,
    merged_prs: 0,
    closed_prs: 0,
    score: 0
  };

  leaderboard.users.push(user);
}

// PR opened
if (action === 'opened' || action === 'reopened') {
  user.open_prs += 1;
  user.score += 1;
}

// PR closed
if (action === 'closed') {
  if (user.open_prs > 0) {
    user.open_prs -= 1;
  }

  user.closed_prs += 1;

  if (merged) {
    user.merged_prs += 1;
    user.score += 10;
  }
}

leaderboard.updated_at = new Date().toISOString();

leaderboard.users.sort((a, b) => b.score - a.score);

fs.writeFileSync(
  leaderboardPath,
  JSON.stringify(leaderboard, null, 2)
);

console.log(`Updated leaderboard for ${username}`);