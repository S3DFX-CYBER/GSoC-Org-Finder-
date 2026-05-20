/**
 * githubQueue.js
 * Async request queue for GitHub API calls.
 *
 * Solves issue #878:
 * - Prevents UI blocking via async batching with concurrency control
 * - Detects rate limiting (429/403) and backs off automatically
 * - Serves stale cache instantly while revalidating in background
 * - Prioritises visible/modal repos over background bulk fetches
 */

const CACHE_KEY   = 'gaf_ghc';
const CACHE_TTL   = 60 * 60 * 1000;        // 1 hour (fresh)
const STALE_TTL   = 4  * 60 * 60 * 1000;   // 4 hours (stale-but-usable)
const API         = '/api/github';

// ─── Persistent cache (localStorage) ────────────────────────────────────────

const _cache = (() => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
  catch { return {}; }
})();

function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(_cache)); }
  catch { /* storage full — skip silently */ }
}

/**
 * Returns cached data if it exists (fresh or stale).
 * @param {string} key
 * @returns {{ data: object, stale: boolean } | null}
 */
function getCached(key) {
  const hit = _cache[key];
  if (!hit) return null;
  const age = Date.now() - hit.ts;
  if (age > STALE_TTL) return null;            // too old — discard
  return { data: hit, stale: age > CACHE_TTL };
}

function setCache(key, data) {
  _cache[key] = { ...data, ts: Date.now() };
  saveCache();
}

// ─── Rate-limit state ────────────────────────────────────────────────────────

let _rateLimitedUntil = 0;   // epoch ms — no requests before this time
let _consecutiveErrors = 0;

function isRateLimited() {
  return Date.now() < _rateLimitedUntil;
}

function handleRateLimit(retryAfterHeader) {
  const seconds = parseInt(retryAfterHeader) || Math.pow(2, Math.min(_consecutiveErrors, 6)) * 5;
  _rateLimitedUntil = Date.now() + seconds * 1000;
  _consecutiveErrors++;
  console.warn(`[GH Queue] Rate limited. Backing off for ${seconds}s.`);
}

function resetErrors() {
  _consecutiveErrors = 0;
}

// ─── Priority queue ──────────────────────────────────────────────────────────
// Priority: 0 = highest (modal/explicit), 1 = normal, 2 = background bulk

class PriorityQueue {
  constructor() { this._q = []; }

  enqueue(item, priority = 1) {
    // Avoid duplicate repos already in queue
    if (this._q.some(e => e.repo === item.repo && e.mode === item.mode)) return;
    this._q.push({ ...item, priority });
    this._q.sort((a, b) => a.priority - b.priority);
  }

  dequeue() { return this._q.shift() || null; }

  get size() { return this._q.length; }

  remove(repo) {
    this._q = this._q.filter(e => e.repo !== repo);
  }
}

// ─── Worker pool ─────────────────────────────────────────────────────────────

const CONCURRENCY = 3;   // max simultaneous GitHub requests
let _active = 0;
const _queue = new PriorityQueue();
const _inFlight = new Map();   // Map<jobKey, {resolve, reject}[]>

/**
 * Core fetch with retry + rate-limit awareness.
 * @param {string} url
 * @param {number} retries
 * @returns {Promise<Response | null>}
 */
async function fetchWithBackoff(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (isRateLimited()) {
      const wait = _rateLimitedUntil - Date.now();
      await sleep(wait);
    }

    try {
      const res = await fetch(url);

      if (res.status === 429 || res.status === 403) {
        handleRateLimit(res.headers.get('Retry-After'));
        if (attempt < retries) {
          await sleep(_rateLimitedUntil - Date.now());
          continue;
        }
        return null;
      }

      resetErrors();
      return res;

    } catch (err) {
      _consecutiveErrors++;
      const backoff = Math.pow(2, attempt) * 500;
      console.warn(`[GH Queue] Fetch error (attempt ${attempt + 1}): ${err.message}. Retrying in ${backoff}ms.`);
      if (attempt < retries) await sleep(backoff);
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, Math.max(0, ms)));
}

// ─── Queue processor ─────────────────────────────────────────────────────────

function tick() {
  while (_active < CONCURRENCY && _queue.size > 0) {
    const job = _queue.dequeue();
    if (!job) break;
    _active++;
    processJob(job).finally(() => {
      _active--;
      _inFlight.delete(job.repo + job.mode);
      tick();   // process next
    });
  }
}

async function processJob({ repo, mode, resolve, reject }) {
  const cacheKey = mode === 'gfi'    ? repo + '__gfi'
                 : mode === 'issues' ? repo + '__issues'
                 : repo;

  // Double-check cache before hitting network (another job may have populated it)
  const hit = getCached(cacheKey);
  if (hit && !hit.stale) { resolve(hit.data); return; }

  const url = mode === 'gfi'
    ? `${API}?repo=${encodeURIComponent(repo)}&gfi=1`
    : mode === 'issues'
    ? `${API}?repo=${encodeURIComponent(repo)}&gfi=1&issues=1`
    : `${API}?repo=${encodeURIComponent(repo)}`;

  const res = await fetchWithBackoff(url);
  if (!res) { resolve(hit ? hit.data : null); return; }   // return stale on failure

  try {
    const data = await res.json();
    if (!data.error) {
      setCache(cacheKey, data);
      resolve(data);
    } else {
      resolve(hit ? hit.data : null);
    }
  } catch {
    resolve(hit ? hit.data : null);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch GitHub stats for a repo.
 * Immediately returns stale cached data if available, then revalidates.
 *
 * @param {string} repo   e.g. "django/django"
 * @param {number} priority  0=urgent, 1=normal, 2=bulk
 * @returns {Promise<object|null>}
 */
export function fetchGH(repo, priority = 1) {
  if (!repo) return Promise.resolve(null);

  const cacheKey = repo;
  const hit = getCached(cacheKey);

  // Return fresh cache instantly
  if (hit && !hit.stale) return Promise.resolve(hit.data);

  return new Promise((resolve, reject) => {
    const jobKey = repo + 'stats';

    // FIX: if already in-flight, attach to existing waiters instead of duplicating
    if (_inFlight.has(jobKey)) {
      _inFlight.get(jobKey).push({ resolve, reject });
      return;
    }

    _inFlight.set(jobKey, [{ resolve, reject }]);

    const _resolve = (d) => {
      (_inFlight.get(jobKey) || []).forEach(w => w.resolve(d));
      _inFlight.delete(jobKey);
    };
    const _reject = (e) => {
      (_inFlight.get(jobKey) || []).forEach(w => w.reject(e));
      _inFlight.delete(jobKey);
    };

    // Return stale immediately and revalidate in background
    if (hit && hit.stale) {
      resolve(hit.data);
      _queue.enqueue({
        repo,
        mode: 'stats',
        resolve: (fresh) => {
          if (fresh) setCache(repo, fresh);
          _inFlight.delete(jobKey);
        },
        reject: () => { _inFlight.delete(jobKey); },
      }, Math.max(priority, 2));
      tick();
      return;
    }

    _queue.enqueue({ repo, mode: 'stats', resolve: _resolve, reject: _reject }, priority);
    tick();
  });
}

/**
 * Fetch good-first-issue count for a repo.
 * @param {string} repo
 * @param {number} priority
 * @returns {Promise<number|null>}
 */
export function fetchGFI(repo, priority = 1) {
  if (!repo) return Promise.resolve(null);

  const cacheKey = repo + '__gfi';
  const hit = getCached(cacheKey);
  if (hit && !hit.stale) return Promise.resolve(hit.data.gfi ?? hit.data.count ?? null);

  return new Promise((resolve, reject) => {
    const jobKey = repo + 'gfi';

    // FIX: was _inFlight.add(jobKey) — Map has no .add(). Also attach waiter properly.
    if (_inFlight.has(jobKey)) {
      _inFlight.get(jobKey).push({ resolve, reject });
      return;
    }
    _inFlight.set(jobKey, [{ resolve, reject }]);

    const _resolve = (d) => {
      const val = d?.gfi ?? d?.count ?? null;
      (_inFlight.get(jobKey) || []).forEach(w => w.resolve(val));
      _inFlight.delete(jobKey);
    };
    const _reject = (e) => {
      (_inFlight.get(jobKey) || []).forEach(w => w.reject(e));
      _inFlight.delete(jobKey);
    };

    if (hit && hit.stale) {
      resolve(hit.data.gfi ?? hit.data.count ?? null);
      _queue.enqueue({
        repo,
        mode: 'gfi',
        resolve: () => { _inFlight.delete(jobKey); },
        reject:  () => { _inFlight.delete(jobKey); },
      }, 2);
      tick();
      return;
    }

    _queue.enqueue({ repo, mode: 'gfi', resolve: _resolve, reject: _reject }, priority);
    tick();
  });
}

/**
 * Fetch full issue items for the Issues page.
 * @param {string} repo
 * @param {number} priority
 * @returns {Promise<{total: number, items: object[]}|null>}
 */
export function fetchIssues(repo, priority = 2) {
  if (!repo) return Promise.resolve(null);

  const cacheKey = repo + '__issues';
  const hit = getCached(cacheKey);
  if (hit && !hit.stale) return Promise.resolve(hit.data);

  return new Promise((resolve, reject) => {
    const jobKey = repo + 'issues';

    // FIX: was _inFlight.add(jobKey) — Map has no .add(). Also attach waiter properly.
    if (_inFlight.has(jobKey)) {
      _inFlight.get(jobKey).push({ resolve, reject });
      return;
    }
    _inFlight.set(jobKey, [{ resolve, reject }]);

    const _resolve = (d) => {
      (_inFlight.get(jobKey) || []).forEach(w => w.resolve(d));
      _inFlight.delete(jobKey);
    };
    const _reject = (e) => {
      (_inFlight.get(jobKey) || []).forEach(w => w.reject(e));
      _inFlight.delete(jobKey);
    };

    if (hit && hit.stale) {
      resolve(hit.data);
      _queue.enqueue({
        repo,
        mode: 'issues',
        resolve: () => { _inFlight.delete(jobKey); },
        reject:  () => { _inFlight.delete(jobKey); },
      }, 2);
      tick();
      return;
    }

    _queue.enqueue({ repo, mode: 'issues', resolve: _resolve, reject: _reject }, priority);
    tick();
  });
}

/**
 * Bulk-fetch stats for all orgs with GitHub repos.
 * Non-blocking: resolves per-org as data arrives, calling onProgress each time.
 *
 * @param {object[]} orgs       Array of org objects with .github property
 * @param {function} onProgress Called with (org, data) after each fetch
 * @param {function} onDone     Called when all fetches complete
 */
export function fetchAllStats(orgs, onProgress, onDone) {
  const withGithub = orgs.filter(o => o.github);
  if (withGithub.length === 0) { onDone?.(); return; }
  let completed = 0;

  for (const org of withGithub) {
    fetchGH(org.github, 2)
      .then(data => {
        if (data) { org._gh = data; onProgress?.(org, data); }
      })
      .catch(() => { /* swallow individual errors — still count as done */ })
      .finally(() => {
        // FIX: use .finally() so completed always increments even on rejection,
        // preventing onDone from never being called (UI deadlock).
        completed++;
        if (completed === withGithub.length) onDone?.();
      });
  }

  tick();
}

/**
 * Invalidate cached data for a specific repo, forcing a fresh fetch next call.
 * Call this before a manual "Refresh" action so stale data isn't returned.
 *
 * @param {string} repo  e.g. "django/django"
 */
export function invalidateCache(repo) {
  delete _cache[repo];
  delete _cache[repo + '__gfi'];
  delete _cache[repo + '__issues'];
  saveCache();
}

/**
 * Returns current queue status — useful for progress UI.
 */
export function queueStatus() {
  return {
    queued: _queue.size,
    active: _active,
    rateLimited: isRateLimited(),
    resumesAt: _rateLimitedUntil,
  };
}

/**
 * Cancel all pending background (priority 2) jobs — e.g. when user navigates away.
 * FIX: also cleans up _inFlight entries so future requests aren't permanently blocked.
 */
export function cancelBulk() {
  const toCancel = _queue._q.filter(j => j.priority >= 2);
  _queue._q = _queue._q.filter(j => j.priority < 2);

  for (const job of toCancel) {
    const key = job.repo + job.mode;
    const waiters = _inFlight.get(key);
    if (waiters) {
      waiters.forEach(w => w.resolve(null));
      _inFlight.delete(key);
    }
  }
}