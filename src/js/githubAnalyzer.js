// src/js/githubAnalyzer.js

/**
 * githubAnalyzer.js
 * 
 * Fetches and analyzes a user's GitHub profile to extract dominant languages, 
 * topics, and activity levels. Uses the Vercel edge proxy to avoid CORS/rate limits
 * where possible, and falls back to local cache.
 */

const GITHUB_ANALYZER_CACHE_KEY = 'gaf_user_cache';
const USER_API_ENDPOINT = '/api/github';

const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function getLocalCache() {
  try {
    const raw = localStorage.getItem(GITHUB_ANALYZER_CACHE_KEY);
    if (!raw) return {};
    const cache = JSON.parse(raw);
    if (cache && typeof cache === 'object' && !Array.isArray(cache)) {
      return cache;
    }
    return {};
  } catch {
    return {};
  }
}

function setLocalCache(cache) {
  try {
    localStorage.setItem(GITHUB_ANALYZER_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Could not write to localStorage for githubAnalyzer', err);
  }
}

function createGitHubError(message, status) {
  const error = new Error(message);
  if (status) error.status = status;
  return error;
}

/**
 * Analyzes a GitHub username and returns a standardized UserProfile object.
 * 
 * @param {string} username - The GitHub username to analyze
 * @returns {Promise<Object>} - The UserProfile containing languages, topics, stars, and activity
 */
async function analyzeGitHubUser(username) {
  if (!username || username.trim() === '') {
    throw new Error("Username cannot be empty");
  }

  const normalizedUsername = username.trim().toLowerCase();
  const cache = getLocalCache();

  const cachedUser = cache[normalizedUsername];
  if (cachedUser && Date.now() - cachedUser.ts < CACHE_EXPIRY_MS) {
    return cachedUser.data;
  }

  try {
    const response = await fetch(`${USER_API_ENDPOINT}?user=${encodeURIComponent(normalizedUsername)}`);
    let data;
    try {
      data = await response.json();
    } catch {
      // Handle case where response is not valid JSON
    }

    if (!response.ok) {
      const status = data?.status || response.status;
      const msg = data?.message || data?.error || `Failed to fetch user data: ${status}`;
      throw createGitHubError(msg, status);
    }

    if (!data) {
      throw new Error("No response data returned from server");
    }

    if (data.error) {
      throw createGitHubError(data.message || data.error || 'GitHub API error', data.status);
    }

    // Structure the result
    const userProfile = {
      languages: data.languages || [],
      topics: data.topics || [],
      stars: data.stars || 0,
      activity: data.activity || 'low'
    };

    // Save to cache
    cache[normalizedUsername] = {
      ts: Date.now(),
      data: userProfile
    };
    setLocalCache(cache);

    return userProfile;
  } catch (err) {
    console.error("GitHub Analyzer Error:", err);

    const message = err.message || "";
    if (err.status === 404 || message.includes("GitHub 404")) {
      throw createGitHubError(
        `GitHub user '${username}' not found. Please ensure the username is correct.`,
        404
      );
    }
    if (err.status === 403 || message.includes("GitHub 403")) {
      throw createGitHubError("GitHub API rate limit reached. Please try again later.", 403);
    }
    if (message === "Invalid user") {
      throw createGitHubError(`The username '${username}' is not in a valid GitHub format.`, 400);
    }

    // Propagate operational errors directly instead of masking them
    throw createGitHubError(
      message || `Could not analyze GitHub profile for '${username}'.`,
      err.status
    );
  }
}

// Export for global usage
globalThis.analyzeGitHubUser = analyzeGitHubUser;
