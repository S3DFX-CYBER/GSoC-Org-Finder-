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

const reviewSubmittedAt =
  process.env.REVIEW_SUBMITTED_AT ||
  new Date().toISOString();

const reviewAuthor =
  process.env.PR_AUTHOR || '';

const priorityAssigned =
  (
    process.env.PRIORITY_ASSIGNED || ''
  ).toLowerCase();

const actionType =
  process.env.ACTION_TYPE || 'review';

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

if (!reviewer || !reviewId) {

  console.log(
    'Missing reviewer or review id'
  );

  process.exit(0);
}

// Prevent self-review stat farming
if (
  reviewAuthor &&
  reviewAuthor.toLowerCase() ===
    reviewer.toLowerCase()
) {

  console.log(
    'Skipping self-review tracking'
  );

  process.exit(0);
}

// Ignore bot reviews
if (
  reviewer.endsWith('[bot]')
) {

  console.log(
    'Skipping bot review'
  );

  process.exit(0);
}

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
// INIT ROOT
// --------------------------------------------------

if (!statsData.mentors) {
  statsData.mentors = {};
}

// --------------------------------------------------
// INIT MENTOR
// --------------------------------------------------

if (!statsData.mentors[reviewer]) {

  statsData.mentors[reviewer] = {
    reviews: 0,
    approvals: 0,
    changes_requested: 0,
    comments: 0,
    merged_reviews: 0,

    assignment_approvals: 0,

    priority_reviews: {
      p0: 0,
      p1: 0,
      p2: 0,
      p3: 0,
      p4: 0
    },

    review_quality_score: 0,

    last_reviewed_at: null,

    review_ids: []
  };
}

const mentor =
  statsData.mentors[reviewer];

// --------------------------------------------------
// PREVENT DUPLICATES
// --------------------------------------------------

if (
  mentor.review_ids.includes(reviewId)
) {

  console.log(
    `Review ${reviewId} already tracked`
  );

  process.exit(0);
}

// --------------------------------------------------
// TRACK ASSIGNMENT APPROVALS
// --------------------------------------------------

if (
  actionType === 'assignment_approval'
) {

  mentor.assignment_approvals++;

  mentor.last_reviewed_at =
    reviewSubmittedAt;

  mentor.review_ids.push(reviewId);

  mentor.review_ids =
    mentor.review_ids.slice(-300);

  fs.writeFileSync(
    statsPath,
    JSON.stringify(statsData, null, 2)
  );

  console.log(
    `Tracked assignment approval for ${reviewer}`
  );

  process.exit(0);
}

// --------------------------------------------------
// REVIEW WEIGHTING
// --------------------------------------------------

let reviewWeight = 1;

if (reviewState === 'APPROVED') {
  reviewWeight = 3;
}

if (
  reviewState === 'CHANGES_REQUESTED'
) {
  reviewWeight = 4;
}

if (
  reviewState === 'COMMENTED'
) {
  reviewWeight = 1;
}

// --------------------------------------------------
// UPDATE STATS
// --------------------------------------------------

mentor.reviews++;

if (reviewState === 'APPROVED') {
  mentor.approvals++;
}

if (
  reviewState === 'CHANGES_REQUESTED'
) {
  mentor.changes_requested++;
}

if (
  reviewState === 'COMMENTED'
) {
  mentor.comments++;
}

// Weighted mentor quality score
mentor.review_quality_score +=
  reviewWeight;

// --------------------------------------------------
// PRIORITY TRACKING
// --------------------------------------------------

const validPriorities = [
  'p0',
  'p1',
  'p2',
  'p3',
  'p4'
];

if (
  validPriorities.includes(
    priorityAssigned
  )
) {

  mentor.priority_reviews[
    priorityAssigned
  ]++;
}

// --------------------------------------------------
// TIMESTAMP
// --------------------------------------------------

mentor.last_reviewed_at =
  reviewSubmittedAt;

// --------------------------------------------------
// STORE REVIEW IDS
// --------------------------------------------------

mentor.review_ids.push(reviewId);

// Keep bounded history
mentor.review_ids =
  mentor.review_ids.slice(-300);

// --------------------------------------------------
// SORT MENTORS
// deterministic ordering
// --------------------------------------------------

const sortedMentors =
  Object.keys(statsData.mentors)
    .sort((a, b) =>
      a.localeCompare(b)
    )
    .reduce((acc, key) => {
      acc[key] =
        statsData.mentors[key];
      return acc;
    }, {});

statsData.mentors =
  sortedMentors;

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