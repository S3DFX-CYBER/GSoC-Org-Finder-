// @ts-check
/* eslint-env node */
// Computes community activity scores for all GSoC orgs
// Run via GitHub Actions daily

const fs = require('node:fs');
const path = require('node:path');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OUTPUT_FILE = path.join(__dirname, '../../data/community_activity.json');

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN is required');
  process.exit(1);
}

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'gsoc-org-finder'
};

// Load orgs from org.js
const orgDataRaw = fs.readFileSync(
  path.join(__dirname, '../../src/js/org.js'), 'utf8'
);

// Extract github field from each org
const githubRepos = [];
const orgMatches = orgDataRaw.matchAll(/name:\s*"([^"]+)"[^}]+github:\s*"([^"]+)"/g);
for (const m of orgMatches) {
  const name = m[1];
  const repo = m[2];
  if (repo?.includes('/')) {
    githubRepos.push({ name, repo });
  }
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.json();
}

function computeScore({ issueResponseDays, commitFrequency, prMergeRate, ideasFreshnessDays, starsGrowth }) {
  const issueScore = Math.max(0, 100 - (issueResponseDays * 5));      
  const commitScore = Math.min(100, commitFrequency * 10);             
  const prScore = Math.min(100, prMergeRate * 100);                    
  const ideasScore = Math.max(0, 100 - (ideasFreshnessDays * 0.5));  
  const growthScore = Math.min(100, starsGrowth * 2);                  

  return Math.round(
    issueScore * 0.3 +
    commitScore * 0.2 +
    prScore * 0.15 +
    ideasScore * 0.2 +
    growthScore * 0.15
  );
}

function getTier(score) {
  if (score >= 80) return { tier: 'very-active', label: '🟢 Very Active' };
  if (score >= 60) return { tier: 'active', label: '🔵 Active' };
  if (score >= 40) return { tier: 'moderate', label: '🟡 Moderate' };
  return { tier: 'low', label: '🔴 Low Activity' };
}

async function analyzeOrg({ name, repo }) {
  try {
    const since = new Date(Date.now() - 90 * 86400000).toISOString();

    const commits = await fetchJSON(
      `https://api.github.com/repos/${repo}/commits?since=${since}&per_page=100`
    );
    const commitFrequency = Array.isArray(commits) ? commits.length / 90 : 0;

    const issues = await fetchJSON(
      `https://api.github.com/repos/${repo}/issues?state=closed&since=${since}&per_page=100`
    );
    let issueResponseDays = 14; 
    if (Array.isArray(issues) && issues.length > 0) {
      const responseTimes = issues
        .filter(i => i.created_at && i.closed_at && !i.pull_request)
        .map(i => (+new Date(i.closed_at) - +new Date(i.created_at)) / 86400000);
      if (responseTimes.length > 0) {
        issueResponseDays = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      }
    }

    // Fetch PRs
    const prs = await fetchJSON(
      `https://api.github.com/repos/${repo}/pulls?state=closed&since=${since}&per_page=100`
    );
    let prMergeRate = 0.5; 
    if (Array.isArray(prs) && prs.length > 0) {
      const merged = prs.filter(p => p.merged_at).length;
      prMergeRate = merged / prs.length;
    }

    const repoData = await fetchJSON(`https://api.github.com/repos/${repo}`);
    const starsGrowth = repoData ? Math.min(50, repoData.stargazers_count / 1000) : 0;

    const ideasFreshnessDays = repoData?.pushed_at
      ? (Date.now() - new Date(repoData.pushed_at)) / 86400000
      : 60;

    const score = computeScore({
      issueResponseDays,
      commitFrequency,
      prMergeRate,
      ideasFreshnessDays,
      starsGrowth
    });

    const { tier, label } = getTier(score);

    return {
      score,
      tier,
      label,
      signals: {
        issueResponseDays: Math.round(issueResponseDays),
        commitFrequency: Math.round(commitFrequency * 10) / 10,
        prMergeRate: Math.round(prMergeRate * 100),
        ideasFreshnessDays: Math.round(ideasFreshnessDays),
        starsGrowth: Math.round(starsGrowth * 10) / 10
      },
      lastUpdated: new Date().toISOString()
    };
  } catch (e) {
    console.error(`Error analyzing ${name}:`, e.message);
    return null;
  }
}

async function main() {
  console.log(`Analyzing ${githubRepos.length} orgs...`);
  const results = {};

  for (const org of githubRepos) {
    console.log(`Processing: ${org.name}`);
    const data = await analyzeOrg(org);
    if (data) results[org.name] = data;
    await new Promise(r => setTimeout(r, 500));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`✅ Done! Wrote ${Object.keys(results).length} orgs to community_activity.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
