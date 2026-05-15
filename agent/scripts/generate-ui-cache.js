const fs = require('fs');

const issuesData = JSON.parse(
  fs.readFileSync('./data/issues.json', 'utf8')
);


const issues = issuesData.issues || [];

// Build frequency map of organizations from the issues list
const orgCounts = Object.create(null);
const labels = new Set();

for (const issue of issues) {
  if (issue.org) {
    orgCounts[issue.org] = (orgCounts[issue.org] || 0) + 1;
  }

  if (Array.isArray(issue.labels)) {
    issue.labels.forEach(label => labels.add(label));
  }
}

const uniqueOrgs = Object.keys(orgCounts);

// Sort organizations by frequency (desc). Use alphabetical tiebreaker for stability.
const topOrganizations = uniqueOrgs
  .sort((a, b) => {
    const diff = (orgCounts[b] || 0) - (orgCounts[a] || 0);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  })
  .slice(0, 10);

const summary = {
  generatedAt: new Date().toISOString(),
  totalIssues: issues.length,
  totalOrgs: uniqueOrgs.length,
  totalLabels: labels.size,
  topOrganizations
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
