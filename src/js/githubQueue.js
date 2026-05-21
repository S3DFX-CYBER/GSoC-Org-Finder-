const CACHE_KEY = 'gaf_ghc';
const CACHE_TTL = 60 * 60 * 1000;
const STALE_TTL = 4 * 60 * 60 * 1000;
const API = '/api/github';

const _cache = (() => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
  catch { return {}; }
})();

function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(_cache)); }
  catch {}
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

let _rateLimitedUntil = 0;
let _consecutiveErrors = 0;

function isRateLimited() {
  return Date.now() < _rateLimitedUntil;
}

function handleRateLimit(retryAfterHeader) {
  // FIX: Number.parseInt instead of parseInt (SonarCloud)
  const seconds = Number.parseInt(retryAfterHeader) || Math.pow(2, Math.min(_consecutiveErrors, 6)) * 5;
  _rateLimitedUntil = Date.now() + seconds * 1000;
  _consecutiveErrors++;
}

function resetErrors() {
  _consecutiveErrors = 0;
}

class PriorityQueue {
  constructor() { this._q = []; }

  enqueue(item, priority = 1) {
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

const CONCURRENCY = 3;
let _active = 0;
const _queue = new PriorityQueue();
const _inFlight = new Map();

async function fetchWithBackoff(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (isRateLimited()) await sleep(_rateLimitedUntil - Date.now());

    try {
      const res = await fetch(url);

      if (res.status === 429 || res.status === 403) {
        handleRateLimit(res.headers.get('Retry-After'));
        if (attempt < retries) { await sleep(_rateLimitedUntil - Date.now()); continue; }
        return null;
      }

      resetErrors();
      return res;

    } catch (err) {
      // FIX: log the error so it's not silently swallowed (SonarCloud line 89)
      console.warn(`[GH Queue] fetch attempt ${attempt + 1} failed:`, err.message);
      _consecutiveErrors++;
      const backoff = Math.pow(2, attempt) * 500;
      if (attempt < retries) await sleep(backoff);
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, Math.max(0, ms)));
}

function tick() {
  while (_active < CONCURRENCY && _queue.size > 0) {
    const job = _queue.dequeue();
    if (!job) break;
    _active++;
    processJob(job).finally(() => {
      _active--;
      _inFlight.delete(job.repo + job.mode);
      tick();
    });
  }
}

// FIX: extracted nested ternary into independent statements (SonarCloud lines 114, 123)
// FIX: reduced cognitive complexity by splitting cacheKey and url resolution (SonarCloud line 111)
function getCacheKey(repo, mode) {
  if (mode === 'gfi') return repo + '__gfi';
  if (mode === 'issues') return repo + '__issues';
  return repo;
}

function getUrl(repo, mode) {
  if (mode === 'gfi') return `${API}?repo=${encodeURIComponent(repo)}&gfi=1`;
  if (mode === 'issues') return `${API}?repo=${encodeURIComponent(repo)}&gfi=1&issues=1`;
  return `${API}?repo=${encodeURIComponent(repo)}`;
}

async function processJob({ repo, mode, resolve, reject }) {
  const cacheKey = getCacheKey(repo, mode);
  const hit = getCached(cacheKey);
  if (hit && !hit.stale) { resolve(hit.data); return; }

  const url = getUrl(repo, mode);
  const res = await fetchWithBackoff(url);
  if (!res) { resolve(hit ? hit.data : null); return; }

  try {
    const data = await res.json();
    // FIX: removed negated condition — flipped to positive check (SonarCloud line 130)
    if (data.error) {
      resolve(hit ? hit.data : null);
    } else {
      setCache(cacheKey, data);
      resolve(data);
    }
  } catch (err) {
    console.warn('[GH Queue] JSON parse failed:', err.message);
    resolve(hit ? hit.data : null);
  }
}

function broadcastAndClean(jobKey, value) {
  // FIX: optional chain instead of || [] pattern (SonarCloud lines 162, 166, 204, 245)
  _inFlight.get(jobKey)?.forEach(w => w.resolve(value));
  _inFlight.delete(jobKey);
}

function broadcastErrorAndClean(jobKey, err) {
  _inFlight.get(jobKey)?.forEach(w => w.reject(err));
  _inFlight.delete(jobKey);
}

export function fetchGH(repo, priority = 1) {
  if (!repo) return Promise.resolve(null);

  const hit = getCached(repo);
  if (hit && !hit.stale) return Promise.resolve(hit.data);

  return new Promise((resolve, reject) => {
    const jobKey = repo + 'stats';

    if (_inFlight.has(jobKey)) {
      _inFlight.get(jobKey).push({ resolve, reject });
      return;
    }

    _inFlight.set(jobKey, [{ resolve, reject }]);

    if (hit && hit.stale) {
      resolve(hit.data);
      _queue.enqueue({
        repo, mode: 'stats',
        resolve: (fresh) => { if (fresh) setCache(repo, fresh); _inFlight.delete(jobKey); },
        reject: () => { _inFlight.delete(jobKey); },
      }, Math.max(priority, 2));
      tick();
      return;
    }

    _queue.enqueue({
      repo, mode: 'stats',
      resolve: (d) => broadcastAndClean(jobKey, d),
      reject:  (e) => broadcastErrorAndClean(jobKey, e),
    }, priority);
    tick();
  });
}

export function fetchGFI(repo, priority = 1) {
  if (!repo) return Promise.resolve(null);

  const cacheKey = repo + '__gfi';
  const hit = getCached(cacheKey);
  if (hit && !hit.stale) return Promise.resolve(hit.data.gfi ?? hit.data.count ?? null);

  return new Promise((resolve, reject) => {
    const jobKey = repo + 'gfi';

    if (_inFlight.has(jobKey)) {
      _inFlight.get(jobKey).push({ resolve, reject });
      return;
    }
    _inFlight.set(jobKey, [{ resolve, reject }]);

    if (hit && hit.stale) {
      resolve(hit.data.gfi ?? hit.data.count ?? null);
      _queue.enqueue({
        repo, mode: 'gfi',
        resolve: () => { _inFlight.delete(jobKey); },
        reject:  () => { _inFlight.delete(jobKey); },
      }, 2);
      tick();
      return;
    }

    _queue.enqueue({
      repo, mode: 'gfi',
      resolve: (d) => broadcastAndClean(jobKey, d?.gfi ?? d?.count ?? null),
      reject:  (e) => broadcastErrorAndClean(jobKey, e),
    }, priority);
    tick();
  });
}

export function fetchIssues(repo, priority = 2) {
  if (!repo) return Promise.resolve(null);

  const cacheKey = repo + '__issues';
  const hit = getCached(cacheKey);
  if (hit && !hit.stale) return Promise.resolve(hit.data);

  return new Promise((resolve, reject) => {
    const jobKey = repo + 'issues';

    if (_inFlight.has(jobKey)) {
      _inFlight.get(jobKey).push({ resolve, reject });
      return;
    }
    _inFlight.set(jobKey, [{ resolve, reject }]);

    if (hit && hit.stale) {
      resolve(hit.data);
      _queue.enqueue({
        repo, mode: 'issues',
        resolve: () => { _inFlight.delete(jobKey); },
        reject:  () => { _inFlight.delete(jobKey); },
      }, 2);
      tick();
      return;
    }

    _queue.enqueue({
      repo, mode: 'issues',
      resolve: (d) => broadcastAndClean(jobKey, d),
      reject:  (e) => broadcastErrorAndClean(jobKey, e),
    }, priority);
    tick();
  });
}

export function fetchAllStats(orgs, onProgress, onDone) {
  const withGithub = orgs.filter(o => o.github);
  if (withGithub.length === 0) { onDone?.(); return; }
  let completed = 0;

  for (const org of withGithub) {
    fetchGH(org.github, 2)
      .then(data => { if (data) { org._gh = data; onProgress?.(org, data); } })
      .catch((err) => { console.warn('[GH Queue] fetchAllStats error:', err.message); })
      .finally(() => { if (++completed === withGithub.length) onDone?.(); });
  }

  tick();
}

export function invalidateCache(repo) {
  delete _cache[repo];
  delete _cache[repo + '__gfi'];
  delete _cache[repo + '__issues'];
  saveCache();
}

export function queueStatus() {
  return { queued: _queue.size, active: _active, rateLimited: isRateLimited(), resumesAt: _rateLimitedUntil };
}

export function cancelBulk() {
  const toCancel = _queue._q.filter(j => j.priority >= 2);
  _queue._q = _queue._q.filter(j => j.priority < 2);
  for (const job of toCancel) {
    const key = job.repo + job.mode;
    _inFlight.get(key)?.forEach(w => w.resolve(null));
    _inFlight.delete(key);
  }
}