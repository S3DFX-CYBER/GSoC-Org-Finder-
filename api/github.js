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

// Helper to fetch GFI count cleanly without breaking primary endpoints
async function fetchGfiCount(repo, headers) {
  try {
    const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
    const res = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=1`, { headers });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.total_count ?? 0;
  } catch {
    return 0;
  }
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
  const compare = searchParams.get('compare');
  const gfiMode = searchParams.get('gfi') === '1';
  const issuesMode = searchParams.get('issues') === '1';
  const rateLimitMode = searchParams.get('rate') === '1';

  // Base checking
  if (!repo && !user && !rateLimitMode) {
    return new Response(JSON.stringify({ error: 'Missing repo or user parameter' }), { status: 400, headers });
  }

  // VIOLATION #1 FIXED: Enforce strict parameter validation before caching or hitting the GitHub API
  if (user && !/^[\w.-]+$/.test(user)) {
    return new Response(JSON.stringify({ error: 'Invalid user parameter format' }), { status: 400, headers });
  }
  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return new Response(JSON.stringify({ error: 'Invalid repo parameter format' }), { status: 400, headers });
  }
  if (compare && !/^[\w.-]+\/[\w.-]+$/.test(compare)) {
    return new Response(JSON.stringify({ error: 'Invalid compare parameter format' }), { status: 400, headers });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'No token' }), { status: 500, headers });
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
      const res = await fetch('https://api.github.com/rate_limit', { headers: ghHeaders });
      
      // VIOLATION #5 FIXED: Check res.ok before running JSON mapping
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `GitHub API error: ${res.status} ${res.statusText}` }), { status: res.status, headers });
      }

      const data = await res.json();
      return new Response(
        JSON.stringify({
          remaining: data.rate.remaining,
          limit: data.rate.limit,
          reset: data.rate.reset
        }),
        { status: 200, headers }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }

  // =========================
  // USER ANALYSIS MODE
  // =========================
  if (user) {
    const cacheKey = 'user__' + user;
    const cached = CACHE.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers });
    }

    try {
      let page = 1;
      let repos = [];

      while (page <= 3) {
        // VIOLATION #4 FIXED: Added inner try/catch to gracefully capture page 2-3 timeouts or network issues
        try {
          const res = await fetch(
            `https://api.github.com/users/${user}/repos?per_page=100&sort=updated&page=${page}`,
            { headers: ghHeaders, signal: AbortSignal.timeout(5000) }
          );

          if (!res.ok) {
            if (page === 1) {
              return new Response(JSON.stringify({ error: `GitHub Error: ${res.status}` }), { status: 502, headers });
            }
            break; // Break loop on page 2 or 3 to gracefully process whatever repositories we managed to fetch
          }

          const pageRepos = await res.json();
          repos = repos.concat(pageRepos);
          if (pageRepos.length < 100) break;
          page++;
        } catch (pageErr) {
          if (page === 1) throw pageErr; // Complete failure if page 1 crashes
          break; // Return early collected pages on secondary pagination failure
        }
      }

      let totalStars = 0;
      const languageCounts = {};
      const topicCounts = {};
      let activeDays = 9999;

      repos.forEach(r => {
        if (r.fork) return;
        totalStars += r.stargazers_count;

        if (r.language) {
          languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
        }
        if (r.topics) {
          r.topics.forEach(t => {
            topicCounts[t] = (topicCounts[t] || 0) + 1;
          });
        }
        if (r.pushed_at) {
          const d = new Date(r.pushed_at);
          const days = Math.floor((Date.now() - d) / 86400000);
          if (days < activeDays) activeDays = days;
        }
      });

      const languages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]).map(x => x[0]);
      const topics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(x => x[0]);

      let activity = 'low';
      if (activeDays < 30) activity = 'high';
      else if (activeDays < 90) activity = 'medium';

      const recommendations = [];
      if (languages.includes('Java')) recommendations.push('Apache Foundation', 'Jenkins');
      if (languages.includes('Python')) recommendations.push('Django', 'NumPy');
      if (languages.includes('JavaScript')) recommendations.push('Webpack', 'Node.js');

      const contributionScore = getOpenSourceScore(totalStars, repos.length, activity);
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
      return new Response(JSON.stringify(result), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }

  // =========================
  // LEGACY GFI + ISSUES MODE
  // =========================
  if (gfiMode && issuesMode) {
    const cacheKey = repo + '__issues';
    const cached = CACHE.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ total: cached.total, items: cached.items, cached: true }), { status: 200, headers });
    }

    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=30&sort=created&order=desc`, { headers: ghHeaders });

      if (!res.ok) {
        return new Response(JSON.stringify({ total: 0, items: [], error: `GitHub ${res.status}` }), { status: 200, headers });
      }

      const data = await res.json();
      const total = data.total_count ?? 0;
      const items = (data.items || []).map(i => ({
        title: i.title,
        html_url: i.html_url,
        created_at: i.created_at,
        comments: i.comments,
        labels: (i.labels || []).map(l => ({ name: l.name, color: l.color })),
      }));

      safeCacheSet(cacheKey, { total, items, ts: Date.now() });
      safeCacheSet(repo + '__gfi', { gfi: total, ts: Date.now() });

      return new Response(JSON.stringify({ total, items }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ total: 0, items: [], error: err.message }), { status: 200, headers });
    }
  }

  // =========================
  // LEGACY GFI COUNT MODE
  // =========================
  if (gfiMode) {
    const cacheKey = repo + '__gfi';
    const cached = CACHE.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ gfi: cached.gfi }), { status: 200, headers });
    }

    try {
      const gfi = await fetchGfiCount(repo, ghHeaders);
      safeCacheSet(cacheKey, { gfi, ts: Date.now() });
      return new Response(JSON.stringify({ gfi }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ gfi: null, error: err.message }), { status: 200, headers });
    }
  }

  // =========================
  // STANDARD REPO + COMPARE MODE
  // =========================
  const baseCacheKey = compare ? `${repo}__vs__${compare}` : repo;
  const cachedRepo = CACHE.get(baseCacheKey);

  if (cachedRepo && Date.now() - cachedRepo.ts < CACHE_TTL) {
    return new Response(JSON.stringify({ ...cachedRepo, cached: true }), { status: 200, headers });
  }

  try {
    // Helper closure to process standalone repository data
    const fetchRepoContext = async (targetRepo) => {
      const [repoRes, commitsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${targetRepo}`, { headers: ghHeaders }),
        fetch(`https://api.github.com/repos/${targetRepo}/commits?per_page=1`, { headers: ghHeaders })
      ]);

      // VIOLATION #3 FIXED: Stop masking errors with a hardcoded 404 message. Pass accurate context up.
      if (!repoRes.ok) {
        throw new Error(`Upstream repository request details: ${repoRes.status} ${repoRes.statusText}`);
      }

      const repoData = await repoRes.json();
      let lastCommit = '—';
      let activityDays = 9999;

      if (commitsRes.ok) {
        const commits = await commitsRes.json();
        if (commits[0]?.commit?.author?.date) {
          const d = new Date(commits[0].commit.author.date);
          activityDays = Math.floor((Date.now() - d) / 86400000);

          if (activityDays === 0) lastCommit = 'Today';
          else if (activityDays === 1) lastCommit = '1d ago';
          else if (activityDays < 30) lastCommit = `${activityDays}d ago`;
          else if (activityDays < 365) lastCommit = `${Math.floor(activityDays / 30)}mo ago`;
          else lastCommit = `${Math.floor(activityDays / 365)}y ago`;
        }
      }

      const activity = activityDays < 14 ? 'active' : activityDays < 60 ? 'moderate' : 'low';
      const trendingScore = getTrendingScore(repoData.stargazers_count, repoData.forks_count, repoData.open_issues_count);
      
      // VIOLATION #6 FIXED: Fetch genuine Good First Issues counts to supply accurate values to getDifficulty
      const actualGfiCount = await fetchGfiCount(targetRepo, ghHeaders);
      const difficulty = getDifficulty(actualGfiCount, repoData.open_issues_count, repoData.stargazers_count);

      // MAINTAINER ALIGNMENT FIXED: beginnerFriendly flag is directly matched to the difficulty engine result
      const beginnerFriendly = (difficulty === 'Beginner Friendly');

      return {
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
        aiSummary: `${repoData.name} is an active open source project mainly using ${repoData.language}.`,
      };
    };

    // Execute core single repo fetch
    const mainRepoData = await fetchRepoContext(repo);
    let finalResult = { ...mainRepoData, saved: false, ts: Date.now() };

    // VIOLATION #2 FIXED: Add full Repository Comparison mode output payload
    if (compare) {
      const compareRepoData = await fetchRepoContext(compare);
      finalResult.compareWith = {
        repo: compare,
        ...compareRepoData
      };
    }

    safeCacheSet(baseCacheKey, finalResult);
    return new Response(JSON.stringify(finalResult), { status: 200, headers });

  } catch (err) {
    // Dynamically distinguish not found errors from systemic edge platform crashes
    const status = err.message.includes('404') ? 404 : 500;
    return new Response(JSON.stringify({ error: err.message }), { status, headers });
  }
}