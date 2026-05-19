const fs = require('fs');

const mentorsPath =
  '.github/reviewers/gssoc-mentors.json';

const statsPath =
  '.github/reviewers/mentor-stats.json';

const outputPath =
  '.github/reviewers/mentor-leaderboard.md';

// --------------------------------------------------
// LOAD FILES
// --------------------------------------------------

if (!fs.existsSync(mentorsPath)) {

  console.log(
    'gssoc-mentors.json missing'
  );

  process.exit(1);
}

if (!fs.existsSync(statsPath)) {

  console.log(
    'mentor-stats.json missing'
  );

  process.exit(1);
}

const mentorsData = JSON.parse(
  fs.readFileSync(
    mentorsPath,
    'utf8'
  )
);

const statsData = JSON.parse(
  fs.readFileSync(
    statsPath,
    'utf8'
  )
);

const mentorList =
  mentorsData.reviewers || [];

const mentorStats =
  statsData.mentors || {};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function daysSince(dateString) {

  if (!dateString) return 9999;

  const now = Date.now();

  const past =
    new Date(dateString).getTime();

  return Math.floor(
    (now - past) /
    (1000 * 60 * 60 * 24)
  );
}

function calculateScore(data) {

  const reviews =
    data.reviews || 0;

  const approvals =
    data.approvals || 0;

  const changesRequested =
    data.changes_requested || 0;

  const mergedReviews =
    data.merged_reviews || 0;

  const assignmentApprovals =
    data.assignment_approvals || 0;

  const qualityScore =
    data.review_quality_score || 0;

  const inactiveDays =
    daysSince(data.last_reviewed_at);

  let score =
      (reviews * 1)
    + (approvals * 3)
    + (changesRequested * 2)
    + (mergedReviews * 4)
    + (assignmentApprovals * 2)
    + qualityScore;

  // --------------------------------------------------
  // INACTIVITY DECAY
  // --------------------------------------------------

  if (inactiveDays > 7) {
    score *= 0.85;
  }

  if (inactiveDays > 14) {
    score *= 0.65;
  }

  if (inactiveDays > 30) {
    score *= 0.25;
  }

  return Math.max(
    0,
    Math.round(score)
  );
}

function getActivity(days) {

  if (days <= 3) {
    return '🟢 Very Active';
  }

  if (days <= 7) {
    return '🟢 Active';
  }

  if (days <= 14) {
    return '🟡 Moderate';
  }

  if (days <= 30) {
    return '🟠 Low Activity';
  }

  return '🔴 Inactive';
}

// --------------------------------------------------
// BUILD LEADERBOARD
// --------------------------------------------------

const ranked = mentorList
  .map((mentorName) => {

    const data =
      mentorStats[mentorName] || {};

    const inactiveDays =
      daysSince(data.last_reviewed_at);

    return {
      name: mentorName,

      score:
        calculateScore(data),

      reviews:
        data.reviews || 0,

      approvals:
        data.approvals || 0,

      mergedReviews:
        data.merged_reviews || 0,

      assignmentApprovals:
        data.assignment_approvals || 0,

      quality:
        data.review_quality_score || 0,

      lastReviewed:
        data.last_reviewed_at,

      activity:
        getActivity(inactiveDays)
    };

  })
  .sort((a, b) => {

    // Primary sort
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Secondary sort
    return (
      b.approvals - a.approvals
    );
  });

// --------------------------------------------------
// GENERATE MARKDOWN
// --------------------------------------------------

const medals = [
  '🥇',
  '🥈',
  '🥉'
];

let md = '';

md += '# 🏆 Mentor Leaderboard\n\n';

md +=
  '> Dynamic mentor ranking based on meaningful reviews, approvals, review quality, merged contributions, assignment participation, and recent activity.\n\n';

md +=
  '| Rank | Mentor | Score | Reviews | Approvals | Merged Reviews | Activity |\n';

md +=
  '|---|---|---|---|---|---|---|\n';

ranked.forEach(
  (mentor, index) => {

    const medal =
      medals[index] ||
      `#${index + 1}`;

    md +=
      `| ${medal} | @${mentor.name} | ${mentor.score} | ${mentor.reviews} | ${mentor.approvals} | ${mentor.mergedReviews} | ${mentor.activity} |\n`;
  }
);

md += '\n';

md +=
  `Last updated: ${new Date().toISOString()}\n`;

// --------------------------------------------------
// SAVE
// --------------------------------------------------

fs.writeFileSync(
  outputPath,
  md
);

console.log(
  'Generated mentor leaderboard'
);