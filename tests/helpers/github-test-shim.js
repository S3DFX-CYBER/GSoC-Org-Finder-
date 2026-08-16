// tests/helpers/github-test-shim.js

class MockResponse {
    constructor(body, init = {}) {
        this._body = body;
        this.status = init.status ?? 200;
        this.headers = init.headers ?? {};
    }
    async json() { return JSON.parse(this._body); }
    async text() { return this._body; }
}
globalThis.Response = MockResponse;

function isRateLimited(res) {
    if (res.status === 429) return true;
    if (res.status === 403) {
        return res.headers.get('x-ratelimit-remaining') === '0';
    }
    return false;
}

function staleResponse(data, headers) {
    const { ts, ...payload } = data;
    const staleSeconds = Math.round((Date.now() - ts) / 1000);
    return new Response(
        JSON.stringify({ ...payload, cached: true, rateLimit: true, staleSeconds }),
        { status: 200, headers }
    );
}

function createTestInstance(maxSize) {
    const cache = new Map();
    function set(key, value) {
        if (!cache.has(key) && cache.size >= maxSize) {
            cache.delete(cache.keys().next().value);
        }
        cache.set(key, value);
    }
    return { cache, set };
}

const safeCacheSet = Object.assign(
    function safeCacheSet(key, value) {
    },
    { createTestInstance }
);

module.exports = { isRateLimited, staleResponse, safeCacheSet };