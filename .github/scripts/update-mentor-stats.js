const fs = require('fs');
const path = require('path');

const VALID_STATES = new Set(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED']);
const MAX_REVIEW_IDS = 300;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}
`);
}

function safeLower(value) {
  return String(value || '').trim().toLowerCase();
}

const ROOT = process.cwd();
const mentorsPath = path.join(ROOT, '.github/reviewers/gssoc-mentors.json');
const statsPath = path.join(ROOT, '.github/reviewers/mentor-stats.json');
const actionType = process.env.ACTION_TYPE || 'review';

const mentorsData = readJson(mentorsPath);
const statsData = readJson(statsPath);
const mentorSet = new Set((mentorsData.reviewers || []).map(safeLower));

if (!statsData.mentors || typeof statsData.mentors !== 'object') statsData.mentors = {};

function ensureMentor(name) {
  if (!statsData.mentors[name]) {
    statsData.mentors[name] = {
      reviews: 0,
      approvals: 0,
      changes_requested: 0,
      comments: 0,
      merged_reviews: 0,
      assignment_approvals: 0,
      priority_reviews: 0,
      review_quality_score: 0,
      last_reviewed_at: null,
      review_ids: []
    };
  }
  return statsData.mentors[name];
}

if (actionType === 'assignment_approval') {
  const reviewer = process.env.REVIEWER || '';
  if (!mentorSet.has(safeLower(reviewer))) {
    console.log(`${reviewer} is not a configured mentor; skipping`);
    process.exit(0);
  }
  const mentor = ensureMentor(reviewer);
  mentor.assignment_approvals = Number(mentor.assignment_approvals || 0) + 1;
  mentor.last_reviewed_at = new Date().toISOString();
} else {
  const reviewer = process.env.REVIEWER || '';
  const reviewState = process.env.REVIEW_STATE || '';
  const reviewIdRaw = process.env.REVIEW_ID || '';
  const reviewSubmittedAt = process.env.REVIEW_SUBMITTED_AT || new Date().toISOString();
  const prAuthor = process.env.PR_AUTHOR || '';
  const reviewerType = process.env.REVIEWER_TYPE || '';

  if (!reviewIdRaw || Number.isNaN(Number(reviewIdRaw))) {
    console.log('Invalid review id; skipping');
    process.exit(0);
  }
  if (!VALID_STATES.has(reviewState)) {
    console.log(`Unsupported review state ${reviewState}; skipping`);
    process.exit(0);
  }
  if (safeLower(reviewerType) === 'bot' || reviewer.endsWith('[bot]')) {
    console.log('Bot review ignored');
    process.exit(0);
  }
  if (safeLower(reviewer) === safeLower(prAuthor)) {
    console.log('Self-review ignored');
    process.exit(0);
  }
  if (!mentorSet.has(safeLower(reviewer))) {
    console.log(`${reviewer} is not a configured mentor; skipping`);
    process.exit(0);
  }

  const mentor = ensureMentor(reviewer);
  mentor.review_ids = Array.isArray(mentor.review_ids) ? mentor.review_ids.map(String) : [];
  const reviewId = String(reviewIdRaw);
  if (mentor.review_ids.includes(reviewId)) {
    console.log(`Review ${reviewId} already tracked`);
    process.exit(0);
  }

  const reviewWeight = Number(process.env.REVIEW_WEIGHT || '1');
  const priorityAssigned = process.env.PRIORITY_ASSIGNED === 'true';

  mentor.reviews += 1;
  if (reviewState === 'APPROVED') mentor.approvals += 1;
  if (reviewState === 'CHANGES_REQUESTED') mentor.changes_requested += 1;
  if (reviewState === 'COMMENTED') mentor.comments += 1;
  mentor.last_reviewed_at = new Date(reviewSubmittedAt).toISOString();
  mentor.review_quality_score = Number(mentor.review_quality_score || 0) + (Number.isFinite(reviewWeight) ? reviewWeight : 1);
  if (priorityAssigned) mentor.priority_reviews = Number(mentor.priority_reviews || 0) + 1;
  mentor.review_ids.push(reviewId);
  mentor.review_ids = mentor.review_ids.slice(-MAX_REVIEW_IDS);
}

statsData.mentors = Object.keys(statsData.mentors).sort((a, b) => a.localeCompare(b)).reduce((acc, key) => {
  acc[key] = statsData.mentors[key];
  return acc;
}, {});

writeJson(statsPath, statsData);
console.log('Mentor stats updated');
