const safeStorage = globalThis.safeStorage || { setItem: () => {}, getItem: () => null, removeItem: () => {} };

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
    const raw = safeStorage.getItem(GITHUB_ANALYZER_CACHE_KEY);
    if (!raw || typeof raw !== 'string') return {};
    let cache = {};
    try {
      cache = JSON.parse(raw);
    } catch (error) {
      console.warn('Storage data corrupted');
      cache = {};
    }
    if (cache && typeof cache === 'object' && !Array.isArray(cache)) {
      return cache;
    }
    return {};
  } catch (err) {
    console.error('Failed to access local cache:', err);
    return {};
  }
}

function setLocalCache(cache) {
  try {
    if (!cache || typeof cache !== 'object') return;
    safeStorage.setItem(GITHUB_ANALYZER_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.error('Storage write failed:', err);
  }
}

async function fetchUserProfileFromAPI(normalizedUsername) {
  if (!normalizedUsername || typeof normalizedUsername !== 'string') {
    throw new Error("Invalid username");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const url = new URL(USER_API_ENDPOINT, globalThis.location.origin);
    url.searchParams.set('user', normalizedUsername);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response data');
    }

    return (data?.items) ? data.items : data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw new Error('Request failed');
  }
}

function handleAnalyzerError(err, username) {
  const message = err?.message || "";
  
  // Sanitize username for display in errors
  const safeUsername = String(username).replace(/[<>"']/g, '').slice(0, 50);

  if (message.includes("404")) {
    throw new Error(`GitHub user '${safeUsername}' not found.`);
  }
  if (message.includes("403")) {
    throw new Error("GitHub API rate limit reached. Please try again later.");
  }
  if (message.includes("401")) {
    throw new Error("GitHub API authorization failed.");
  }
  if (message === "Invalid user") {
    throw new Error(`The username '${safeUsername}' is not in a valid format.`);
  }

  throw new Error(`Could not analyze profile for '${safeUsername}'.`);
}

/**
 * Analyzes a GitHub username and returns a standardized UserProfile object.
 * 
 * @param {string} username - The GitHub username to analyze
 * @returns {Promise<Object>} - The UserProfile containing languages, topics, stars, and activity
 */
async function analyzeGitHubUser(username) {
  if (!username || typeof username !== 'string' || username.trim() === '' || username.length > 100) {
    throw new Error("Invalid username");
  }

  const normalizedUsername = username.trim().toLowerCase();
  // Basic GitHub username regex
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(normalizedUsername)) {
    throw new Error("Invalid GitHub username format");
  }

  const cache = getLocalCache();

  const cachedUser = cache?.[normalizedUsername];
  if (cachedUser && typeof cachedUser === 'object' && Date.now() - (cachedUser?.ts || 0) < CACHE_EXPIRY_MS) {
    return cachedUser?.data;
  }

  try {
    const data = await fetchUserProfileFromAPI(normalizedUsername);

    // Structure and validate the result
    const userProfile = {
      languages: Array.isArray(data?.languages) ? data.languages.slice(0, 20) : [],
      topics: Array.isArray(data?.topics) ? data.topics.slice(0, 20) : [],
      stars: typeof data?.stars === 'number' ? data.stars : 0,
      activity: typeof data?.activity === 'string' ? data.activity : 'low'
    };

    // Save to cache
    cache[normalizedUsername] = {
      ts: Date.now(),
      data: userProfile
    };
    setLocalCache(cache);

    return userProfile;
  } catch (err) {
    handleAnalyzerError(err, username);
  }
}

// Export for global usage
globalThis.analyzeGitHubUser = analyzeGitHubUser;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeGitHubUser };
}
