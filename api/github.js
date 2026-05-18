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

// =========================
// ANALYTICS HELPERS
// =========================

function getDifficulty(gfi, issues, stars) {

  if (gfi > 50) return 'Beginner Friendly';

  if (issues > 200 && stars > 5000) {
    return 'Intermediate';
  }

  return 'Advanced';
}

function getTrendingScore(stars, forks, issues) {
  return (stars * 2) + forks - issues;
}

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
    return new Response(null, {
      status: 204,
      headers
    });
  }

  const { searchParams } = new URL(req.url);

  const repo = searchParams.get('repo');

  const user = searchParams.get('user');

  const gfiMode = searchParams.get('gfi') === '1';

  const issuesMode = searchParams.get('issues') === '1';

  const rateLimitMode = searchParams.get('rate') === '1';

  if (!repo && !user && !rateLimitMode) {

    return new Response(
      JSON.stringify({
        error: 'Missing repo or user parameter'
      }),
      {
        status: 400,
        headers
      }
    );
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {

    return new Response(
      JSON.stringify({
        error: 'No token'
      }),
      {
        status: 500,
        headers
      }
    );
  }

  const ghHeaders = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'gsoc-org-finder',
  };

  // =========================
  // RATE LIMIT MODE
  // =========================

  if (rateLimitMode) {

    try {

      const res = await fetch(
        'https://api.github.com/rate_limit',
        { headers: ghHeaders }
      );

      const data = await res.json();

      return new Response(
        JSON.stringify({
          remaining: data.rate.remaining,
          limit: data.rate.limit,
          reset: data.rate.reset
        }),
        {
          status: 200,
          headers
        }
      );

    } catch (err) {

      return new Response(
        JSON.stringify({
          error: err.message
        }),
        {
          status: 500,
          headers
        }
      );
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
        JSON.stringify({
          ...cached,
          cached: true
        }),
        {
          status: 200,
          headers
        }
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

        // FIXED: proper error handling
        if (!res.ok) {

          if (page === 1) {

            return new Response(
              JSON.stringify({
                error: `GitHub ${res.status}`
              }),
              {
                status: 502,
                headers
              }
            );
          }

          break;
        }

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

          if (days < activeDays) {
            activeDays = days;
          }
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

      if (activeDays < 30) {
        activity = 'high';
      } else if (activeDays < 90) {
        activity = 'medium';
      }

      // =========================
      // AI RECOMMENDATIONS
      // =========================

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
        {
          status: 200,
          headers
        }
      );

    } catch (err) {

      return new Response(
        JSON.stringify({
          error: err.message
        }),
        {
          status: 500,
          headers
        }
      );
    }
  }

  // =========================
  // LEGACY GFI + ISSUES MODE
  // =========================

  if (gfiMode && issuesMode) {

    const cacheKey = repo + '__issues';

    const cached = CACHE.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {

      return new Response(
        JSON.stringify({
          total: cached.total,
          items: cached.items,
          cached: true
        }),
        {
          status: 200,
          headers
        }
      );
    }

    try {

      const q = encodeURIComponent(
        `repo:${repo} label:"good first issue" state:open`
      );

      const res = await fetch(
        `https://api.github.com/search/issues?q=${q}&per_page=30&sort=created&order=desc`,
        {
          headers: ghHeaders
        }
      );

      if (!res.ok) {

        return new Response(
          JSON.stringify({
            total: 0,
            items: [],
            error: `GitHub ${res.status}`
          }),
          {
            status: 200,
            headers
          }
        );
      }

      const data = await res.json();

      const total = data.total_count ?? 0;

      const items = (data.items || []).map(i => ({
        title: i.title,
        html_url: i.html_url,
        created_at: i.created_at,
        comments: i.comments,
        labels: (i.labels || []).map(l => ({
          name: l.name,
          color: l.color
        })),
      }));

      safeCacheSet(cacheKey, {
        total,
        items,
        ts: Date.now()
      });

      safeCacheSet(repo + '__gfi', {
        gfi: total,
        ts: Date.now()
      });

      return new Response(
        JSON.stringify({
          total,
          items
        }),
        {
          status: 200,
          headers
        }
      );

    } catch (err) {

      return new Response(
        JSON.stringify({
          total: 0,
          items: [],
          error: err.message
        }),
        {
          status: 200,
          headers
        }
      );
    }
  }

  // =========================
  // LEGACY GFI COUNT MODE
  // =========================

  if (gfiMode) {

    const cacheKey = repo + '__gfi';

    const cached = CACHE.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {

      return new Response(
        JSON.stringify({
          gfi: cached.gfi
        }),
        {
          status: 200,
          headers
        }
      );
    }

    try {

      const q = encodeURIComponent(
        `repo:${repo} label:"good first issue" state:open`
      );

      const res = await fetch(
        `https://api.github.com/search/issues?q=${q}&per_page=1`,
        {
          headers: ghHeaders
        }
      );

      if (!res.ok) {

        return new Response(
          JSON.stringify({
            gfi: null,
            error: `GitHub ${res.status}`
          }),
          {
            status: 200,
            headers
          }
        );
      }

      const data = await res.json();

      const gfi = data.total_count ?? null;

      if (gfi !== null) {

        safeCacheSet(cacheKey, {
          gfi,
          ts: Date.now()
        });
      }

      return new Response(
        JSON.stringify({
          gfi
        }),
        {
          status: 200,
          headers
        }
      );

    } catch (err) {

      return new Response(
        JSON.stringify({
          gfi: null,
          error: err.message
        }),
        {
          status: 200,
          headers
        }
      );
    }
  }

  // =========================
  // STANDARD REPO MODE
  // =========================

  const cached = CACHE.get(repo);

  if (cached && Date.now() - cached.ts < CACHE_TTL) {

    return new Response(
      JSON.stringify({
        ...cached,
        cached: true
      }),
      {
        status: 200,
        headers
      }
    );
  }

  try {

    const [repoRes, commitsRes] = await Promise.all([

      fetch(
        `https://api.github.com/repos/${repo}`,
        {
          headers: ghHeaders
        }
      ),

      fetch(
        `https://api.github.com/repos/${repo}/commits?per_page=1`,
        {
          headers: ghHeaders
        }
      )

    ]);

    if (!repoRes.ok) {

      return new Response(
        JSON.stringify({
          error: 'Repo not found'
        }),
        {
          status: 404,
          headers
        }
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

        if (activityDays === 0) {
          lastCommit = 'Today';
        } else if (activityDays === 1) {
          lastCommit = '1d ago';
        } else if (activityDays < 30) {
          lastCommit = `${activityDays}d ago`;
        } else if (activityDays < 365) {
          lastCommit =
            `${Math.floor(activityDays / 30)}mo ago`;
        } else {
          lastCommit =
            `${Math.floor(activityDays / 365)}y ago`;
        }
      }
    }

    const activity =
      activityDays < 14
        ? 'active'
        : activityDays < 60
          ? 'moderate'
          : 'low';

    // =========================
    // ANALYTICS
    // =========================

    const trendingScore =
      getTrendingScore(
        repoData.stargazers_count,
        repoData.forks_count,
        repoData.open_issues_count
      );

    // FIXED: no hardcoded values
    const difficulty =
      getDifficulty(
        repoData.open_issues_count,
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

      saved: false,

      ts: Date.now(),
    };

    safeCacheSet(repo, result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers
      }
    );

  } catch (err) {

    return new Response(
      JSON.stringify({
        error: 'Fetch failed: ' + err.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
}