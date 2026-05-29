const fs = require('fs');
const path = require('path');

const DATA_DIR = './data';
const ISSUES_FILE = path.join(DATA_DIR, 'issues.json');
const UI_SUMMARY_FILE = path.join(DATA_DIR, 'ui-summary.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let issuesData;
try {
  if (!fs.existsSync(ISSUES_FILE)) {
    throw new Error(`File not found: ${ISSUES_FILE}`);
  }
  const rawData = fs.readFileSync(ISSUES_FILE, 'utf8');
  issuesData = JSON.parse(rawData);
} catch (error) {
  console.error(`Fatal Error: Failed to read or parse issues data from '${ISSUES_FILE}'.`);
  console.error(`Details: ${error.message}`);
  process.exit(1);
}

const issues = issuesData.issues || [];
const orgs = new Set();
const labels = new Set();

for (const issue of issues) {
  if (issue.org !== undefined && issue.org !== null) {
    orgs.add(issue.org);
  }
  if (Array.isArray(issue.labels)) {
    issue.labels.forEach((label) => labels.add(label));
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  totalIssues: issues.length,
  totalOrgs: orgs.size,
  totalLabels: labels.size,
  topOrganizations: [...orgs].slice(0, 10)
};

try {
  fs.writeFileSync(UI_SUMMARY_FILE, JSON.stringify(summary, null, 2));
  console.log('Generated UI cache successfully.');
  console.log(summary);
} catch (error) {
  console.error(`Fatal Error: Failed to write UI cache to '${UI_SUMMARY_FILE}'.`);
  console.error(`Details: ${error.message}`);
  process.exit(1);
}
