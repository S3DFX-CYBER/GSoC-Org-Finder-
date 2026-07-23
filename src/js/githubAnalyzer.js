// src/js/githubAnalyzer.js

const GITHUB_ANALYZER_CACHE_KEY = 'gaf_user_cache';
const USER_API_ENDPOINT = '/api/github';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function getLocalCache() {
  try {
    const raw = localStorage.getItem(GITHUB_ANALYZER_CACHE_KEY);
    if (!raw) return {};
    const cache = JSON.parse(raw);
    return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {};
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

export function getStaleLocalCache(normalizedUsername) {
  try {
    return getLocalCache()[normalizedUsername]?.data ?? null;
  } catch {
    return null;
  }
}

async function fetchUserProfileFromAPI(normalizedUsername, signal) {
  const response = await fetch(`${USER_API_ENDPOINT}?user=${encodeURIComponent(normalizedUsername)}`, { signal });
  let data;
  try {
    data = await response.json();
  } catch {

  }

  if (!response.ok) {
    throw new Error(data?.error || `Failed to fetch user data: ${response.status}`);
  }
  if (!data) throw new Error('No response data returned from server');
  if (data.error) throw new Error(data.error);
  return data;
}

function handleAnalyzerError(err, username) {
  if (err.name === 'AbortError') throw err;
  console.error('GitHub Analyzer Error:', err);

  const message = err.message || '';

  if (message.includes('GitHub 404')) {
    throw new Error(`GitHub user '${username}' not found. Please ensure the username is correct.`);
  }

  if (message.includes('GitHub 403') || message.includes('401')) {
    throw new Error('GitHub API authorization failed. Please check the API token configuration or try again.');
  }

  if (message === 'Invalid user') {
    throw new Error(`The username '${username}' is not in a valid GitHub format.`);
  }

  throw new Error(message || `Could not analyze GitHub profile for '${username}'.`);
}

async function analyzeGitHubUser(username, options = {}) {
  const { signal } = options;
  if (!username || username.trim() === '') throw new Error('Username cannot be empty');

  const normalizedUsername = username.trim().toLowerCase();
  const cache = getLocalCache();

  const cachedUser = cache[normalizedUsername];
  if (cachedUser && Date.now() - cachedUser.ts < CACHE_EXPIRY_MS) {
    return cachedUser.data;
  }

  try {
    const data = await fetchUserProfileFromAPI(normalizedUsername, signal);


    if (data.rateLimit) {
      const localStale = getStaleLocalCache(normalizedUsername);
      if (localStale) {
        console.warn('GitHub rate limit reached — serving stale local cache for', normalizedUsername);
        return { ...localStale, stale: true };
      }
      return {
        languages: data.languages || [],
        topics: data.topics || [],
        stars: data.stars || 0,
        activity: data.activity || 'low',
        stale: true,
      };
    }

    const userProfile = {
      languages: data.languages || [],
      topics: data.topics || [],
      stars: data.stars || 0,
      activity: data.activity || 'low',
    };

    cache[normalizedUsername] = { ts: Date.now(), data: userProfile };
    setLocalCache(cache);
    return userProfile;

  } catch (err) {
    const isRateLimit =
      err.message?.includes('rate limit') ||
      err.message?.includes('429');

    if (isRateLimit) {
      const localStale = getStaleLocalCache(normalizedUsername);
      if (localStale) {
        console.warn('GitHub rate limit reached — serving stale local cache for', normalizedUsername);
        return { ...localStale, stale: true };
      }
      throw new Error('GitHub API rate limit reached. Please try again later.');
    }

    handleAnalyzerError(err, username);
  }
}

globalThis.analyzeGitHubUser = analyzeGitHubUser;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeGitHubUser, getStaleLocalCache };
}