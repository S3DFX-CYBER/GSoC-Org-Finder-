const fs = require('fs');

// Bug fix 3: Guard against missing input file BEFORE attempting to read it.
// Previously, the existsSync check was only on './data' after the read,
// so a missing issues.json caused an unhandled crash instead of a clear message.
if (!fs.existsSync('./data/issues.json')) {
  console.error('Error: ./data/issues.json not found. Please ensure the data file exists before running this script.');
  process.exit(1);
}

let issuesData;
// Bug fix 2: Wrap readFileSync and JSON.parse in try/catch so invalid JSON
// or read errors produce a clear error message instead of an unhandled exception.
try {
  issuesData = JSON.parse(
    fs.readFileSync('./data/issues.json', 'utf8')
  );
} catch (err) {
  console.error('Error reading or parsing ./data/issues.json:', err.message);
  process.exit(1);
}

const issues = issuesData.issues || [];

const orgs = new Set();
const labels = new Set();

// Bug fix 1: Correct for loop syntax — no }a)th typo in closing brace.
for (const issue of issues) {
  // Bug fix 4: Use != null instead of truthy check so falsy org values
  // like 0 or "" are correctly counted rather than silently skipped.
  if (issue.org != null) orgs.add(issue.org);

  if (Array.isArray(issue.labels)) {
    issue.labels.forEach(label => labels.add(label));
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  totalIssues: issues.length,
  totalOrgs: orgs.size,
  totalLabels: labels.size,
  topOrganizations: [...orgs].slice(0, 10)
};

if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

fs.writeFileSync(
  './data/ui-summary.json',
  JSON.stringify(summary, null, 2)
);

console.log('Generated UI cache');
console.log(summary);
