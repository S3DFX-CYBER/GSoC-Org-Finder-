/**
 * githubQueue.js — async priority queue for GitHub API fetching (issue #878)
 *
 * - Async batching with concurrency control (no UI blocking)
 * - Rate-limit detection via HTTP status, Retry-After, and X-RateLimit-Remaining
 * - Stale-while-revalidate cache (localStorage, 1h fresh / 4h stale)
 * - Priority 0 = urgent (modal), 1 = normal, 2 = background bulk
 */

const CACHE_KEY = 'gaf_ghc';
const CACHE_TTL = 60 * 60 * 1000;      // 1h fresh
const STALE_TTL = 4  * 60 * 60 * 1000; // 4h stale-but-usable
const API       = '/api/github';

// ─── Cache ───────────────────────────────────────────────────────────────────
const _cache = (() => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
  catch { return {}; }
})();

function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(_cache)); }
  catch { /* storage full */ }
}

function getCached(key) {
  const hit = _cache[key];
  if (!hit) return null;
  const age = Date.now() - hit.ts;
  if (age > STALE_TTL) return null;
  return { data: hit, stale: age > CACHE_TTL };
}

function setCache(key, data) {
  _cache[key] = { ...data, ts: Date.now() };
  saveCache();
}

// ─── Rate-limit state ────────────────────────────────────────────────────────
let _rateLimitedUntil  = 0;
let _consecutiveErrors = 0;

const isRateLimited = () => Date.now() < _rateLimitedUntil;

function handleRateLimit(retryAfterHeader) {
  const seconds = Number.parseInt(retryAfterHeader, 10) || Math.pow(2, Math.min(_consecutiveErrors, 6)) * 5;
  _rateLimitedUntil = Date.now() + seconds * 1000;
  _consecutiveErrors++;
  console.warn(`[GH Queue] Rate limited. Backing off ${seconds}s.`);
}

const resetErrors = () => { _consecutiveErrors = 0; };

// ─── Priority queue ──────────────────────────────────────────────────────────
class PriorityQueue {
  constructor() { this._q = []; }

 enqueue(item, priority = 1) {
  const existing = this._q.find(e => e.repo === item.repo && e.mode === item.mode);
  if (existing) {
    if (priority < existing.priority) {
      existing.priority = priority;
      this._q.sort((a, b) => a.priority - b.priority);
    }
    return;
  }
  this._q.push({ ...item, priority });
  this._q.sort((a, b) => a.priority - b.priority);
}

  dequeue()    { return this._q.shift() || null; }
  get size()   { return this._q.length; }
  remove(repo) { this._q = this._q.filter(e => e.repo !== repo); }
}

// ─── Worker pool ─────────────────────────────────────────────────────────────
const CONCURRENCY = 3;
let _active      = 0;
const _queue     = new PriorityQueue();
const _inFlight  = new Map(); // Map<jobKey, {resolve, reject}[]>

// Returns true if already in-flight (caller should not re-enqueue).
function attachInFlight(jobKey, resolve, reject) {
  if (_inFlight.has(jobKey)) { _inFlight.get(jobKey).push({ resolve, reject }); return true; }
  _inFlight.set(jobKey, [{ resolve, reject }]);
  return false;
}

const resolveInFlight = (k, v) => { (_inFlight.get(k) || []).forEach(w => w.resolve(v)); _inFlight.delete(k); };
const rejectInFlight  = (k, e) => { (_inFlight.get(k) || []).forEach(w => w.reject(e));  _inFlight.delete(k); };

// ─── Rate-limit detection ────────────────────────────────────────────────────
// Checks all three sources: HTTP status, forwarded headers, and body.
// Needed because api/github.js normalises GitHub errors to HTTP 200 and
// forwards X-RateLimit-* / Retry-After headers so the queue can back off.
function detectRateLimit(res, data) {
  if (res.status === 429 || res.status === 403) {
    handleRateLimit(res.headers.get('Retry-After'));
    return true;
  }
  const retryAfter = res.headers.get('Retry-After');
  if (retryAfter) { handleRateLimit(retryAfter); return true; }

  const remaining = res.headers.get('X-RateLimit-Remaining');
  if (remaining !== null && Number.parseInt(remaining, 10) === 0) {
    const reset = res.headers.get('X-RateLimit-Reset');
    const wait  = reset
      ? Math.max(0, Math.ceil((Number.parseInt(reset, 10) * 1000 - Date.now()) / 1000))
      : 60;
    handleRateLimit(String(wait));
    return true;
  }

  if (data?.error && res.status === 200) {
    const msg = String(data.error).toLowerCase();
    if (msg.includes('rate') || msg.includes('limit') || msg.includes('403') || msg.includes('429')) {
      handleRateLimit(null);
      return true;
    }
  }

  return false;
}

// ─── Fetch with backoff ───────────────────────────────────────────────────────
async function fetchWithBackoff(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (isRateLimited()) await sleep(_rateLimitedUntil - Date.now());
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      let   data = null;
      try { data = await res.clone().json(); } catch { /* non-JSON */ }

      if (detectRateLimit(res, data)) {
        if (attempt < retries) { await sleep(_rateLimitedUntil - Date.now()); continue; }
        return null;
      }
      resetErrors();
      return { res, data };
    } catch (err) {
      _consecutiveErrors++;
      const backoff = Math.pow(2, attempt) * 500;
      console.warn(`[GH Queue] attempt ${attempt + 1} failed: ${err.message}. Retrying in ${backoff}ms.`);
      if (attempt < retries) await sleep(backoff);
    }
  }
  return null;
}

const sleep = (ms) => new Promise(r => setTimeout(r, Math.max(0, ms)));

// ─── Job helpers ──────────────────────────────────────────────────────────────
function buildUrl(repo, mode) {
  const base = `${API}?repo=${encodeURIComponent(repo)}`;
  if (mode === 'gfi')    return `${base}&gfi=1`;
  if (mode === 'issues') return `${base}&gfi=1&issues=1`;
  return base;
}

function cacheKeyFor(repo, mode) {
  if (mode === 'gfi')    return repo + '__gfi';
  if (mode === 'issues') return repo + '__issues';
  return repo;
}

async function fetchAndCache(repo, mode, staleHit) {
  const result = await fetchWithBackoff(buildUrl(repo, mode));
  if (!result) return staleHit?.data ?? null;
  const { data } = result;
  if (data && !data.error) { setCache(cacheKeyFor(repo, mode), data); return data; }
  return staleHit?.data ?? null;
}

// ─── Queue processor ──────────────────────────────────────────────────────────
function tick() {
  while (_active < CONCURRENCY && _queue.size > 0) {
    const job = _queue.dequeue();
    if (!job) break;
    _active++;
    processJob(job).finally(() => { _active--; _inFlight.delete(job.repo + job.mode); tick(); });
  }
}

async function processJob({ repo, mode, resolve, reject }) {
  const hit = getCached(cacheKeyFor(repo, mode));
  if (hit && !hit.stale) { resolve(hit.data); return; }
  try { resolve(await fetchAndCache(repo, mode, hit)); }
  catch (err) { reject(err); }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetch GitHub stats. Returns stale data immediately and revalidates in background. */
export function fetchGH(repo, priority = 1) {
  if (!repo) return Promise.resolve(null);
  const hit = getCached(repo);
  if (hit && !hit.stale) return Promise.resolve(hit.data);

  return new Promise((resolve, reject) => {
    const jobKey = repo + 'stats';
    if (attachInFlight(jobKey, resolve, reject)) return;

    if (hit?.stale) {
      resolve(hit.data);
      _queue.enqueue({
        repo, mode: 'stats',
resolve: (fresh) => { if (fresh) setCache(repo, fresh); resolveInFlight(jobKey, fresh); },
        reject:  (e)     => { rejectInFlight(jobKey, e); },
      }, Math.max(priority, 2));
      tick(); return;
    }

    _queue.enqueue({
      repo, mode: 'stats',
      resolve: (d) => resolveInFlight(jobKey, d),
      reject:  (e) => rejectInFlight(jobKey, e),
    }, priority);
    tick();
  });
}

/** Fetch good-first-issue count. */
export function fetchGFI(repo, priority = 1) {
  if (!repo) return Promise.resolve(null);
  const hit = getCached(repo + '__gfi');
  if (hit && !hit.stale) return Promise.resolve(hit.data.gfi ?? hit.data.count ?? null);
  const toGfi = (d) => d?.gfi ?? d?.count ?? null;

  return new Promise((resolve, reject) => {
    const jobKey = repo + 'gfi';
    if (attachInFlight(jobKey, resolve, reject)) return;

    if (hit?.stale) {
      resolve(toGfi(hit.data));
      _queue.enqueue({
        repo, mode: 'gfi',
        resolve: (fresh) => { resolveInFlight(jobKey, toGfi(fresh)); },
        reject:  (e)     => { rejectInFlight(jobKey, e); },
      }, 2);
      tick(); return;
    }
    _queue.enqueue({
      repo, mode: 'gfi',
      resolve: (d) => resolveInFlight(jobKey, toGfi(d)),
      reject:  (e) => rejectInFlight(jobKey, e),
    }, priority);
    tick();
  });
}

/** Fetch full issue list (title, url, labels, comments). */
export function fetchIssues(repo, priority = 2) {
  if (!repo) return Promise.resolve(null);
  const hit = getCached(repo + '__issues');
  if (hit && !hit.stale) return Promise.resolve(hit.data);

  return new Promise((resolve, reject) => {
    const jobKey = repo + 'issues';
    if (attachInFlight(jobKey, resolve, reject)) return;

    if (hit?.stale) {
      resolve(hit.data);
      _queue.enqueue({
        repo, mode: 'issues',
        resolve: (fresh) => { resolveInFlight(jobKey, fresh); },
        reject:  (e)     => { rejectInFlight(jobKey, e); },
      }, 2);
      tick(); return;
    }
    _queue.enqueue({
      repo, mode: 'issues',
      resolve: (d) => resolveInFlight(jobKey, d),
      reject:  (e) => rejectInFlight(jobKey, e),
    }, priority);
    tick();
  });
}

/** Bulk-fetch stats for all orgs. Non-blocking — calls onProgress per org as data arrives. */
export function fetchAllStats(orgs, onProgress, onDone) {
  const withGithub = orgs.filter(o => o.github);
  if (withGithub.length === 0) { onDone?.(); return; }

  let completed = 0;
  for (const org of withGithub) {
    fetchGH(org.github, 2)
      .then(data => { if (data) { org._gh = data; onProgress?.(org, data); } })
      .catch(() => {})
      .finally(() => { if (++completed === withGithub.length) onDone?.(); });
  }
  tick();
}

/** Bust cache for a repo — call before a manual Refresh so stale data isn't returned. */
export function invalidateCache(repo) {
  delete _cache[repo];
  delete _cache[repo + '__gfi'];
  delete _cache[repo + '__issues'];
  saveCache();
}

/** Current queue status for progress UI. */
export function queueStatus() {
  return { queued: _queue.size, active: _active, rateLimited: isRateLimited(), resumesAt: _rateLimitedUntil };
}

/** Cancel all pending background (priority 2) jobs. Cleans up in-flight so future requests aren't blocked. */
export function cancelBulk() {
  const toCancel = _queue._q.filter(j => j.priority >= 2);
  _queue._q      = _queue._q.filter(j => j.priority < 2);
  for (const job of toCancel) {
    const key = job.repo + job.mode;
    (_inFlight.get(key) || []).forEach(w => w.resolve(null));
    _inFlight.delete(key);
  }
}