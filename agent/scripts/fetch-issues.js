const fs = require('fs');
const ORGS = require('../../src/js/org.js');

const SEARCH_DELAY_MS = 2200; // Stay under search API secondary limits.
const MAX_ISSUES_PER_ORG = 3;

function normalizeTargets(orgs) {
  return orgs
    .filter((org) => typeof org.github === 'string' && org.github.trim())
    .map((org) => {
      const github = org.github.trim();
      if (github.includes('/')) {
        return {
          name: org.name,
          github,
          query: `repo:${github} is:issue label:"good first issue" state:open archived:false`
        };
      }

      return {
        name: org.name,
        github,
        query: `user:${github} is:issue label:"good first issue" state:open archived:false`
      };
    });
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
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  for (const target of targets) {
    try {
      const q = encodeURIComponent(target.query);
      const res = await fetch(
        `https://api.github.com/search/issues?q=${q}&per_page=5&sort=updated&order=desc`,
        { headers }
      );

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`GitHub API ${res.status}: ${errorBody.slice(0, 200)}`);
      }

      const data = await res.json();
      if (Array.isArray(data.items)) {
        const mapped = data.items
          .filter((issue) => issue.state === 'open' && !seenIssueUrls.has(issue.html_url) && new Date(issue.updated_at) >= oneYearAgo)
          .slice(0, MAX_ISSUES_PER_ORG)
          .map((issue) => {
            const orgName = target.github.split('/')[0];
            return {
              org: target.name,
              github: target.github,
              logo: `https://avatars.githubusercontent.com/${orgName}`,
              title: issue.title,
              url: issue.html_url,
              repo: issue.repository_url.split('/').slice(-2).join('/'),
              labels: issue.labels.map((label) => label.name),
              comments: issue.comments,
              created_at: issue.created_at,
              updated_at: issue.updated_at,
              language: null
            };
          });

        mapped.forEach((issue) => seenIssueUrls.add(issue.url));
        results.push(...mapped);
      }

      await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY_MS));
    } catch (e) {
      console.error(`Failed for ${target.name} (${target.github}):`, e.message);
    }
  }

  if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });

  fs.writeFileSync(
    './data/issues.json',
    JSON.stringify(
      {
        updated_at: new Date().toISOString(),
        source_org_count: targets.length,
        issues: results
      },
      null,
      2
    )
  );

  console.log(`✅ Saved ${results.length} issues from ${targets.length} org targets`);
}

fetchIssues();
