// api/github.js — Vercel Edge Function
export const config = { runtime: 'edge' };

const CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000;
const CACHE_MAX_SIZE = 1000;

function safeCacheSet(key, value) {
  if (!CACHE.has(key) && CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey);
  }
  CACHE.set(key, value);
}

// NEW: Difficulty analyzer
function getDifficulty(gfi, issues, stars) {
  if (gfi > 50) return 'Beginner Friendly';
  if (issues > 200 && stars > 5000) return 'Intermediate';
  return 'Advanced';
}

// NEW: Trending score
function getTrendingScore(stars, forks, issues) {
  return (stars * 2) + forks - issues;
}

// NEW: Open source score
function getOpenSourceScore(stars, repos, activity) {
  let score = stars + (repos * 5);

  if (activity === 'high') score += 50;
  if (activity === 'medium') score += 20;

  return Math.min(score, 100);
}

export default async function handler(req) {

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const { searchParams } = new URL(req.url);

  const repo = searchParams.get('repo');
  const user = searchParams.get('user');

  const gfiMode = searchParams.get('gfi') === '1';
  const issuesMode = searchParams.get('issues') === '1';

  // NEW FEATURES
  const rateLimitMode = searchParams.get('rate') === '1';
  const compareRepo = searchParams.get('compare');

  if (!repo && !user && !rateLimitMode) {
    return new Response(
      JSON.stringify({ error: 'Missing repo or user parameter' }),
      { status: 400, headers }
    );
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'No token' }),
      { status: 500, headers }
    );
  }

  const ghHeaders = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'gsoc-org-finder',
  };

  // =========================
  // NEW: RATE LIMIT MONITOR
  // =========================
  if (rateLimitMode) {
    try {

      const res = await fetch(
        'https://api.github.com/rate_limit',
        { headers: ghHeaders }
      );

      const data = await res.json();

      return new Response(JSON.stringify({
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        reset: data.rate.reset
      }), { status: 200, headers });

    } catch (err) {

      return new Response(JSON.stringify({
        error: err.message
      }), { status: 500, headers });

    }
  }

  // =========================
  // USER ANALYSIS MODE
  // =========================
  if (user) {

    const cacheKey = 'user__' + user;

    const cached = CACHE.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(
        JSON.stringify({ ...cached, cached: true }),
        { status: 200, headers }
      );
    }

    try {

      let page = 1;
      let repos = [];

      while (page <= 3) {

        const res = await fetch(
          `https://api.github.com/users/${user}/repos?per_page=100&sort=updated&page=${page}`,
          {
            headers: ghHeaders,
            signal: AbortSignal.timeout(5000)
          }
        );

        if (!res.ok) break;

        const pageRepos = await res.json();

        repos = repos.concat(pageRepos);

        if (pageRepos.length < 100) break;

        page++;
      }

      let totalStars = 0;

      const languageCounts = {};
      const topicCounts = {};

      let activeDays = 9999;

      repos.forEach(r => {

        if (r.fork) return;

        totalStars += r.stargazers_count;

        if (r.language) {
          languageCounts[r.language] =
            (languageCounts[r.language] || 0) + 1;
        }

        if (r.topics) {
          r.topics.forEach(t => {
            topicCounts[t] =
              (topicCounts[t] || 0) + 1;
          });
        }

        if (r.pushed_at) {

          const d = new Date(r.pushed_at);

          const days =
            Math.floor((Date.now() - d) / 86400000);

          if (days < activeDays) activeDays = days;
        }

      });

      const languages =
        Object.entries(languageCounts)
          .sort((a, b) => b[1] - a[1])
          .map(x => x[0]);

      const topics =
        Object.entries(topicCounts)
          .sort((a, b) => b[1] - a[1])
          .map(x => x[0]);

      let activity = 'low';

      if (activeDays < 30) activity = 'high';
      else if (activeDays < 90) activity = 'medium';

      // NEW: AI Recommendation Tags
      const recommendations = [];

      if (languages.includes('Java')) {
        recommendations.push('Apache Foundation');
        recommendations.push('Jenkins');
      }

      if (languages.includes('Python')) {
        recommendations.push('Django');
        recommendations.push('NumPy');
      }

      if (languages.includes('JavaScript')) {
        recommendations.push('Webpack');
        recommendations.push('Node.js');
      }

      // NEW: Contribution Score
      const contributionScore =
        getOpenSourceScore(
          totalStars,
          repos.length,
          activity
        );

      const result = {
        languages,
        topics,
        stars: totalStars,
        activity,
        contributionScore,
        recommendations,
        repoCount: repos.length,
        ts: Date.now()
      };

      safeCacheSet(cacheKey, result);

      return new Response(
        JSON.stringify(result),
        { status: 200, headers }
      );

    } catch (err) {

      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers }
      );

    }
  }

  // =========================
  // STANDARD REPO MODE
  // =========================

  const cached = CACHE.get(repo);

  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(
      JSON.stringify({ ...cached, cached: true }),
      { status: 200, headers }
    );
  }

  try {

    const [repoRes, commitsRes] = await Promise.all([

      fetch(
        `https://api.github.com/repos/${repo}`,
        { headers: ghHeaders }
      ),

      fetch(
        `https://api.github.com/repos/${repo}/commits?per_page=1`,
        { headers: ghHeaders }
      )

    ]);

    if (!repoRes.ok) {

      return new Response(
        JSON.stringify({ error: 'Repo not found' }),
        { status: 404, headers }
      );
    }

    const repoData = await repoRes.json();

    let lastCommit = '—';

    let activityDays = 9999;

    if (commitsRes.ok) {

      const commits = await commitsRes.json();

      if (commits[0]?.commit?.author?.date) {

        const d =
          new Date(commits[0].commit.author.date);

        activityDays =
          Math.floor((Date.now() - d) / 86400000);

        lastCommit = `${activityDays}d ago`;
      }
    }

    const activity =
      activityDays < 14
        ? 'active'
        : activityDays < 60
          ? 'moderate'
          : 'low';

    // NEW FEATURES
    const trendingScore =
      getTrendingScore(
        repoData.stargazers_count,
        repoData.forks_count,
        repoData.open_issues_count
      );

    const difficulty =
      getDifficulty(
        20,
        repoData.open_issues_count,
        repoData.stargazers_count
      );

    const beginnerFriendly =
      repoData.open_issues_count > 20;

    const result = {

      stars: repoData.stargazers_count,

      forks: repoData.forks_count,

      issues: repoData.open_issues_count,

      watchers: repoData.watchers_count,

      lastCommit,

      activity,

      language: repoData.language,

      trendingScore,

      difficulty,

      beginnerFriendly,

      aiSummary:
        `${repoData.name} is an active open source project mainly using ${repoData.language}.`,

      compareWith: compareRepo || null,

      saved: false,

      ts: Date.now(),
    };

    safeCacheSet(repo, result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers }
    );

  } catch (err) {

    return new Response(
      JSON.stringify({
        error: 'Fetch failed: ' + err.message
      }),
      { status: 500, headers }
    );
  }
}