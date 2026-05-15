const fs = require('fs');
const ORGS = require('../../src/js/org.js');

const MAX_ISSUES_PER_ORG = 3;

// Parallel batching configuration
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2500;

// Optional request timeout
const REQUEST_TIMEOUT_MS = 15000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTargets(orgs) {
  return orgs
    .filter((org) => typeof org.github === 'string' && org.github.trim())
    .map((org) => {
      const github = org.github.trim();

      if (github.includes('/')) {
        return {
          name: org.name,
          github,
          query:
            `repo:${github} ` +
            `is:issue state:open archived:false ` +
            `label:"good first issue"`
        };
      }

      return {
        name: org.name,
        github,
        query:
          `user:${github} ` +
          `is:issue state:open archived:false ` +
          `label:"good first issue"`
      };
    });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTargetIssues({
  target,
  headers,
  oneYearAgo,
  seenIssueUrls
}) {
  try {
    const q = encodeURIComponent(target.query);

    const url =
      `https://api.github.com/search/issues` +
      `?q=${q}` +
      `&per_page=5` +
      `&sort=updated` +
      `&order=desc`;

    const res = await fetchWithTimeout(url, { headers });

    if (!res.ok) {
      const errorBody = await res.text();

      throw new Error(
        `GitHub API ${res.status}: ${errorBody.slice(0, 200)}`
      );
    }

    const data = await res.json();

    if (!Array.isArray(data.items)) {
      return [];
    }

    const mapped = data.items
      .filter((issue) => {
        return (
          issue.state === 'open' &&
          !seenIssueUrls.has(issue.html_url) &&
          new Date(issue.updated_at) >= oneYearAgo
        );
      })
      .slice(0, MAX_ISSUES_PER_ORG)
      .map((issue) => {
        const orgName = target.github.split('/')[0];

        return {
          org: target.name,
          github: target.github,
          logo: `https://avatars.githubusercontent.com/${orgName}`,
          title: issue.title,
          url: issue.html_url,
          repo: issue.repository_url
            .split('/')
            .slice(-2)
            .join('/'),
          labels: issue.labels.map((label) => label.name),
          comments: issue.comments,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          language: null
        };
      });

    mapped.forEach((issue) => {
      seenIssueUrls.add(issue.url);
    });

    console.log(
      `✅ ${target.github} → ${mapped.length} issues`
    );

    return mapped;
  } catch (e) {
    console.error(
      `❌ Failed for ${target.name} (${target.github}):`,
      e.message
    );

    return [];
  }
}

async function fetchIssues() {
  const results = [];
  const seenIssueUrls = new Set();

  const targets = normalizeTargets(ORGS);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'gsoc-org-finder-actions'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization =
      `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  console.log(
    `🚀 Fetching issues from ${targets.length} targets`
  );

  // ─────────────────────────────────────────────
  // Process in batches
  // ─────────────────────────────────────────────
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);

    console.log(
      `📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} ` +
      `(${batch.length} targets)`
    );

    const batchResults = await Promise.all(
      batch.map((target) =>
        fetchTargetIssues({
          target,
          headers,
          oneYearAgo,
          seenIssueUrls
        })
      )
    );

    batchResults.forEach((issues) => {
      results.push(...issues);
    });

    // Delay between batches
    if (i + BATCH_SIZE < targets.length) {
      console.log(
        `⏳ Waiting ${BATCH_DELAY_MS}ms before next batch`
      );

      await sleep(BATCH_DELAY_MS);
    }
  }

  // ─────────────────────────────────────────────
  // Ensure data directory exists
  // ─────────────────────────────────────────────
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }

  // ─────────────────────────────────────────────
  // Save dataset
  // ─────────────────────────────────────────────
  fs.writeFileSync(
    './data/issues.json',
    JSON.stringify(
      {
        updated_at: new Date().toISOString(),
        source_org_count: targets.length,
        total_issues: results.length,
        issues: results
      },
      null,
      2
    )
  );

  console.log(
    `🎉 Saved ${results.length} issues from ${targets.length} org targets`
  );
}

fetchIssues().catch((err) => {
  console.error('Fatal fetch error:', err);
  process.exit(1);
});