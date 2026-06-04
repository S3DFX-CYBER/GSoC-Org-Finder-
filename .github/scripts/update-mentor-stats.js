const fs = require('fs');

const statsPath =
  '.github/reviewers/mentor-stats.json';

const mentorsPath =
  '.github/reviewers/gssoc-mentors.json';

// --------------------------------------------------
// ENV
// --------------------------------------------------

const reviewer =
  process.env.REVIEWER;

const reviewState =
  process.env.REVIEW_STATE;

const reviewId =
  process.env.REVIEW_ID;

// --------------------------------------------------
// LOAD FILES
// --------------------------------------------------

const mentorsData = JSON.parse(
  fs.readFileSync(mentorsPath, 'utf8')
);

const statsData = JSON.parse(
  fs.readFileSync(statsPath, 'utf8')
);

// --------------------------------------------------
// VALIDATE MENTOR
// --------------------------------------------------

const validMentors =
  new Set(mentorsData.reviewers || []);

if (!validMentors.has(reviewer)) {
  console.log(
    `${reviewer} is not a registered mentor`
  );

  process.exit(0);
}

// --------------------------------------------------
// INIT
// --------------------------------------------------

if (!statsData.mentors[reviewer]) {

  statsData.mentors[reviewer] = {
    reviews: 0,
    approvals: 0,
    changes_requested: 0,
    comments: 0,
    last_reviewed_at: null,
    review_ids: []
  };
}

const mentor =
  statsData.mentors[reviewer];

// --------------------------------------------------
// PREVENT DUPLICATES
// --------------------------------------------------

if (mentor.review_ids.includes(reviewId)) {

  console.log(
    `Review ${reviewId} already tracked`
  );

  process.exit(0);
}

// --------------------------------------------------
// UPDATE STATS
// --------------------------------------------------

mentor.reviews++;

 const reviewState =
  process.env.REVIEW_STATE;
const normalizedReviewState =
  (reviewState || '').toUpperCase();
if (normalizedReviewState === 'APPROVED') {
  mentor.approvals++;
}
if (normalizedReviewState === 'CHANGES_REQUESTED') {
  mentor.changes_requested++;
}
if (normalizedReviewState === 'COMMENTED') {
  mentor.comments++;
}

mentor.last_reviewed_at =
  new Date().toISOString();

mentor.review_ids.push(reviewId);

// Limit stored IDs
mentor.review_ids =
  mentor.review_ids.slice(-200);

// --------------------------------------------------
// SAVE
// --------------------------------------------------

fs.writeFileSync(
  statsPath,
  JSON.stringify(statsData, null, 2)
);

console.log(
  `Updated mentor stats for ${reviewer}`
);