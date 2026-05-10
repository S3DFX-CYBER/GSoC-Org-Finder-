const fs = require('fs');

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const ARCHIVE_REPO = 'satwiksps/GSoC_archive_2026';
const API_BASE = 'https://api.github.com/repos';

// Optional request timeout
const REQUEST_TIMEOUT_MS = 30000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'GSoC-Org-Finder',
        'Accept': 'application/vnd.github.v3+json',
        ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` }),
        ...options.headers,
      },
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Recursively fetches all tree entries from GitHub API
 * Handles pagination and large directories
 */
async function fetchTreeRecursive(sha, path = '') {
  const url = `${API_BASE}/${ARCHIVE_REPO}/git/trees/${sha}?recursive=1`;
  
  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      console.error(`Failed to fetch tree: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.tree || [];
  } catch (error) {
    console.error(`Error fetching tree from ${url}:`, error.message);
    return [];
  }
}

/**
 * Fetches the default branch's tree from the repository
 */
async function getRepositoryDefaultBranch() {
  const url = `${API_BASE}/${ARCHIVE_REPO}`;

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      console.error(`Failed to fetch repo info: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.default_branch || 'main';
  } catch (error) {
    console.error(`Error fetching repo info:`, error.message);
    return null;
  }
}

/**
 * Gets the commit SHA of the default branch
 */
async function getDefaultBranchSha(branch) {
  const url = `${API_BASE}/${ARCHIVE_REPO}/git/refs/heads/${branch}`;

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      console.error(`Failed to fetch branch: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.object.sha;
  } catch (error) {
    console.error(`Error fetching branch SHA:`, error.message);
    return null;
  }
}

/**
 * Parses a winner from an accepted proposal PDF path
 * Example path: "Python Software Foundation/Accepted/contributor_John_Doe_Project_Title_2026.pdf"
 * 
 * @param {string} path - Full path to PDF file
 * @returns {Object|null} Parsed winner object or null if invalid
 */
function parseWinnerPath(path) {
  // Check if path contains /Accepted/ and ends with .pdf
  if (!path.includes('/Accepted/') || !path.endsWith('.pdf')) {
    return null;
  }

  const segments = path.split('/');

  // Must have at least: orgName/Accepted/filename.pdf
  if (segments.length < 3) {
    return null;
  }

  const orgName = segments[0];
  const filename = segments[segments.length - 1];

  // Remove .pdf extension
  const nameWithoutExt = filename.slice(0, -4);

  // Split by underscore to extract components
  // Expected format: contributor_username_Project_Title_Year
  // Example: contributor_John_Doe_Project_Title_2026
  let parts = nameWithoutExt.split('_');

  if (parts.length < 2) {
    return null;
  }

  // Remove "contributor" prefix if it's the first part
  if (parts[0].toLowerCase() === 'contributor') {
    parts = parts.slice(1);
  }

  if (parts.length < 1) {
    return null;
  }

  // The first part is the username
  const username = parts[0];

  // Remove year suffix (4-digit number at the end) if present
  let projectTitleParts = parts.slice(1);
  if (projectTitleParts.length > 0 && /^\d{4}$/.test(projectTitleParts[projectTitleParts.length - 1])) {
    projectTitleParts = projectTitleParts.slice(0, -1);
  }

  let projectTitle = projectTitleParts.join(' ');

  // Validate we have meaningful data
  if (!username || !projectTitle) {
    return null;
  }

  return {
    username,
    projectTitle,
    orgName,
    path,
  };
}

/**
 * Fetches and parses all accepted GSoC proposals
 */
async function fetchWinners() {
  console.log(`Fetching GSoC 2026 winners from ${ARCHIVE_REPO}...`);

  // Get repository default branch
  const branch = await getRepositoryDefaultBranch();
  if (!branch) {
    throw new Error('Failed to fetch repository default branch');
  }

  console.log(`Using branch: ${branch}`);

  // Get branch SHA
  const sha = await getDefaultBranchSha(branch);
  if (!sha) {
    throw new Error('Failed to fetch branch SHA');
  }

  console.log(`Fetching tree with SHA: ${sha.slice(0, 7)}...`);

  // Fetch all tree entries
  const treeEntries = await fetchTreeRecursive(sha);
  console.log(`Found ${treeEntries.length} entries in repository tree`);

  // Filter for accepted proposal PDFs
  const acceptedPaths = treeEntries
    .filter((entry) => entry.type === 'blob' && entry.path && entry.path.includes('/Accepted/') && entry.path.endsWith('.pdf'))
    .map((entry) => entry.path);

  console.log(`Found ${acceptedPaths.length} accepted proposal PDFs`);

  // Parse winners
  const winners = acceptedPaths
    .map((path) => parseWinnerPath(path))
    .filter((winner) => winner !== null);

  console.log(`Parsed ${winners.length} winners from PDF paths`);

  // Deduplicate by (username, orgName) pair
  const uniqueWinners = [];
  const seen = new Set();

  for (const winner of winners) {
    const key = `${winner.username}|${winner.orgName}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueWinners.push(winner);
    }
  }

  console.log(`Deduplicated to ${uniqueWinners.length} unique winners`);

  return uniqueWinners;
}

/**
 * Writes winners data to file
 */
function writeWinnersData(winners) {
  const dataDir = 'data';

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Write winners.json
  const winnersFile = `${dataDir}/winners.json`;
  fs.writeFileSync(winnersFile, JSON.stringify(winners, null, 2), 'utf-8');
  console.log(`✓ Wrote ${winners.length} winners to ${winnersFile}`);

  // Write winners-last-updated.json
  const timestampFile = `${dataDir}/winners-last-updated.json`;
  const timestamp = new Date().toISOString();
  fs.writeFileSync(
    timestampFile,
    JSON.stringify({ updatedAt: timestamp, count: winners.length }, null, 2),
    'utf-8'
  );
  console.log(`✓ Updated timestamp in ${timestampFile}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    const winners = await fetchWinners();

    if (winners.length === 0) {
      console.warn('⚠ No winners found. Check archive repo structure.');
      console.warn('Skipping file write to preserve existing data.');
      return;
    }

    writeWinnersData(winners);
    console.log('\n✓ Winners data updated successfully');
    console.log(`Sample winner:`, winners[0]);
  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error('Skipping file write to preserve existing data.');
    process.exit(1);
  }
}

main();
