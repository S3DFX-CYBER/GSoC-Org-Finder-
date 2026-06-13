/* eslint-env node */
'use strict';

const fs = require('fs');

const ARCHIVE_OWNER = 'satwiksps';
const ARCHIVE_REPO = 'GSoC_archive_2026';
const ARCHIVE_BRANCH = 'main';
const TREE_API = `https://api.github.com/repos/${ARCHIVE_OWNER}/${ARCHIVE_REPO}/git/trees/${ARCHIVE_BRANCH}?recursive=1`;

async function fetchArchiveTree() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'gsoc-org-finder-actions'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let res;
  try {
    res = await fetch(TREE_API, { headers, signal: controller.signal });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error && error.name === 'AbortError') {
      throw new Error('GitHub tree fetch timed out after 10 seconds');
    }
    throw error;
  }

  clearTimeout(timeoutId);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data || !Array.isArray(data.tree)) {
    throw new Error('Invalid GitHub tree payload');
  }

  return data;
}

async function main() {
  const data = await fetchArchiveTree();

  const payload = {
    updated_at: new Date().toISOString(),
    source: {
      repo: `${ARCHIVE_OWNER}/${ARCHIVE_REPO}`,
      ref: ARCHIVE_BRANCH
    },
    truncated: Boolean(data.truncated),
    tree: data.tree.map((node) => ({
      path: node.path,
      type: node.type
    }))
  };

  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }

  fs.writeFileSync(
    './data/winners-tree.json',
    JSON.stringify(payload, null, 2)
  );

  console.log(
    `Saved ${payload.tree.length} archive entries to data/winners-tree.json`
  );
}

main().catch((err) => {
  console.error('Winners archive fetch failed:', err.message);
  process.exit(1);
});
