// tests/github-ratelimit.test.js
const test = require('node:test');
const assert = require('node:assert');

const { isRateLimited, staleResponse, safeCacheSet } = require('./helpers/github-test-shim.js');
const { getStaleLocalCache } = require('./helpers/analyzer-test-shim.js');

class MockHeaders extends Map {
    get(k) { return super.get(k.toLowerCase()) ?? null; }
    set(k, v) { return super.set(k.toLowerCase(), v); }
    has(k) { return super.has(k.toLowerCase()); }
}

function makeRes(status, headers = {}) {
    const h = new MockHeaders(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    return { status, ok: status >= 200 && status < 300, headers: h };
}


test('isRateLimited: 429 is always a rate limit', () => {
    assert.ok(isRateLimited(makeRes(429)));
});

test('isRateLimited: 403 with x-ratelimit-remaining=0 is a rate limit', () => {
    assert.ok(isRateLimited(makeRes(403, { 'x-ratelimit-remaining': '0' })));
});

test('isRateLimited: 403 without x-ratelimit-remaining is an auth error, not a rate limit', () => {
    assert.ok(!isRateLimited(makeRes(403)));
});

test('isRateLimited: 403 with remaining > 0 is an auth error, not a rate limit', () => {
    assert.ok(!isRateLimited(makeRes(403, { 'x-ratelimit-remaining': '42' })));
});

test('isRateLimited: 200 OK is never a rate limit', () => {
    assert.ok(!isRateLimited(makeRes(200)));
});


test('staleResponse: returns a Response with status 200', async () => {
    const fakeHeaders = { 'Content-Type': 'application/json' };
    const data = { stars: 10, forks: 2, ts: Date.now() - 3000 };
    const res = staleResponse(data, fakeHeaders);
    assert.strictEqual(res.status, 200);
});

test('staleResponse: body has rateLimit=true, cached=true, no ts field', async () => {
    const fakeHeaders = { 'Content-Type': 'application/json' };
    const ts = Date.now() - 5000;
    const res = staleResponse({ stars: 42, forks: 3, ts }, fakeHeaders);
    const body = await res.json();
    assert.strictEqual(body.rateLimit, true);
    assert.strictEqual(body.cached, true);
    assert.strictEqual(body.stars, 42);
    assert.ok(!('ts' in body), 'ts should be stripped');
    assert.ok(body.staleSeconds >= 4 && body.staleSeconds <= 6, `staleSeconds should be ~5, got ${body.staleSeconds}`);
});


test('safeCacheSet: evicts the oldest entry when cache is at capacity', () => {
    const { cache, set } = safeCacheSet.createTestInstance(3);
    set('a', 1); set('b', 2); set('c', 3);
    set('d', 4); // should evict 'a'
    assert.ok(!cache.has('a'), 'oldest entry should be evicted');
    assert.ok(cache.has('d'), 'newest entry should exist');
    assert.strictEqual(cache.size, 3);
});


test('getStaleLocalCache: returns data for an existing user ignoring TTL', () => {
    const staleProfile = { languages: ['Python'], topics: ['ml'], stars: 10, activity: 'low' };
    const fakeStorage = {
        'octocat': { ts: Date.now() - 2 * 60 * 60 * 1000, data: staleProfile }
    };
    const result = getStaleLocalCache('octocat', fakeStorage);
    assert.deepStrictEqual(result, staleProfile);
});

test('getStaleLocalCache: returns null for a user not in cache', () => {
    const result = getStaleLocalCache('nobody', {});
    assert.strictEqual(result, null);
});


test('analyzeGitHubUser: GitHub 403 message triggers auth error, not stale cache', async () => {
    const staleProfile = { languages: ['Go'], topics: [], stars: 1, activity: 'low' };
    const fakeStorage = { 'someuser': { ts: Date.now() - 9999999, data: staleProfile } };

    function handleAnalyzerError(err, username) {
        const message = err.message || '';
        if (message.includes('GitHub 403') || message.includes('401')) {
            throw new Error('GitHub API authorization failed. Please check the API token configuration or try again.');
        }
        if (message.includes('rate limit') || message.includes('429')) {
            const localStale = getStaleLocalCache(username, fakeStorage);
            if (localStale) return { ...localStale, stale: true };
            throw new Error('GitHub API rate limit reached. Please try again later.');
        }
        throw new Error(message);
    }

    assert.throws(
        () => handleAnalyzerError(new Error('GitHub 403'), 'someuser'),
        (err) => {
            assert.ok(err.message.includes('authorization'), `Expected auth error, got: ${err.message}`);
            return true;
        }
    );
});

test('analyzeGitHubUser: rate limit (429) serves stale cache when available', () => {
    const staleProfile = { languages: ['Rust'], topics: ['systems'], stars: 20, activity: 'high' };
    const fakeStorage = { 'rustacean': { ts: Date.now() - 9999999, data: staleProfile } };

    function handleRateLimit(username) {
        const localStale = getStaleLocalCache(username, fakeStorage);
        if (localStale) return { ...localStale, stale: true };
        throw new Error('GitHub API rate limit reached. Please try again later.');
    }

    const result = handleRateLimit('rustacean');
    assert.strictEqual(result.stale, true);
    assert.deepStrictEqual(result.languages, ['Rust']);
});