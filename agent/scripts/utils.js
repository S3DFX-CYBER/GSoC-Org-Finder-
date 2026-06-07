const fs = require('node:fs');
const path = require('node:path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function buildSummary(issues) {
  const orgs = new Set();
  const labels = new Set();

  for (const issue of issues) {
    if (issue.org !== undefined && issue.org !== null && issue.org !== '') {
      orgs.add(issue.org);
    }
    if (Array.isArray(issue.labels)) {
      issue.labels.forEach((label) => labels.add(label));
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalIssues: issues.length,
    totalOrgs: orgs.size,
    totalLabels: labels.size,
    topOrganizations: [...orgs].slice(0, 10)
  };
}

module.exports = { ensureDir, readJsonFile, writeJsonFile, buildSummary };