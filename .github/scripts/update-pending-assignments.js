'use strict';
const path = require('path');
const { readJsonSafe, writeJsonAtomic, canonicalizeMentor } = require('./common-utils');

const QUEUE_PATH = path.resolve(__dirname, '../reviewers/pending-assignments.json');
const TTL_MS     = 24 * 60 * 60 * 1000; // 24 hours

function safeParseArray(raw) {
  try {
    const p = JSON.parse(raw || '[]');
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

const op              = String(process.env.OPERATION    || '').toLowerCase();
const issueNumber     = parseInt(process.env.ISSUE_NUMBER || '0', 10);
const claimant        = canonicalizeMentor(process.env.CLAIMANT);
const selectedMentors = safeParseArray(process.env.SELECTED_MENTORS).map(canonicalizeMentor);
const approver        = canonicalizeMentor(process.env.APPROVER);

const data = readJsonSafe(QUEUE_PATH, { assignments: [] });
if (!Array.isArray(data.assignments)) data.assignments = [];

if (op === 'queue') {
  data.assignments = data.assignments.filter(
    a => !(a.issue_number === issueNumber && a.claimant === claimant && a.status === 'pending')
  );
  data.assignments.push({
    issue_number:   issueNumber,
    claimant,
    requested_at:  new Date().toISOString(),
    pinged_mentors: selectedMentors,
    status:        'pending'
  });
  writeJsonAtomic(QUEUE_PATH, data);
  process.stdout.write(JSON.stringify({ ok: true }));

} else if (op === 'approve') {
  const entry = data.assignments.find(
    a => a.issue_number === issueNumber && a.status === 'pending'
  );
  if (!entry) {
    process.stdout.write(JSON.stringify({ ok: false, error: 'not_found' }));
    process.exit(0);
  }
  const authorized = (entry.pinged_mentors || []).map(canonicalizeMentor);
  if (!authorized.includes(approver)) {
    process.stdout.write(JSON.stringify({
      ok: false, error: 'not_authorized',
      claimant: entry.claimant, authorized: entry.pinged_mentors
    }));
    process.exit(0);
  }
  data.assignments = data.assignments.filter(a => a !== entry);
  writeJsonAtomic(QUEUE_PATH, data);
  process.stdout.write(JSON.stringify({ ok: true, claimant: entry.claimant }));

} else if (op === 'expire') {
  const cutoff  = Date.now() - TTL_MS;
  const expired = data.assignments.filter(
    a => a.status === 'pending' && new Date(a.requested_at).getTime() < cutoff
  );
  // Mark expired as 'escalated' so they aren't processed again
  for (const entry of expired) {
    entry.status = 'escalated';
  }
  writeJsonAtomic(QUEUE_PATH, data);
  process.stdout.write(JSON.stringify({ expired }));

} else {
  console.error(`Unknown OPERATION: ${op}`);
  process.exit(1);
}
