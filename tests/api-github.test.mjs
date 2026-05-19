import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler, {
  buildGitHubHeaders,
  fetchWithFallback,
  isTokenValid,
} from '../api/github.js';

const originalFetch = globalThis.fetch;
const originalToken = process.env.GITHUB_TOKEN;

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('isTokenValid()', () => {
  it('returns false for missing and malformed token values', () => {
    assert.equal(isTokenValid(undefined), false);
    assert.equal(isTokenValid(null), false);
    assert.equal(isTokenValid(''), false);
    assert.equal(isTokenValid('undefined'), false);
    assert.equal(isTokenValid('Bearer undefined'), false);
    assert.equal(isTokenValid('notavalidtoken'), false);
    assert.equal(isTokenValid(12345), false);
  });

  it('returns true for GitHub token prefixes used by PATs, OAuth, and apps', () => {
    assert.equal(isTokenValid('ghp_abc123xyz456'), true);
    assert.equal(isTokenValid('gho_abc123xyz456'), true);
    assert.equal(isTokenValid('ghs_abc123xyz456'), true);
    assert.equal(isTokenValid('ghr_abc123xyz456'), true);
    assert.equal(isTokenValid('github_pat_abc123xyz456'), true);
  });
});

describe('buildGitHubHeaders()', () => {
  it('omits Authorization when token is missing or invalid', () => {
    assert.equal('Authorization' in buildGitHubHeaders(undefined), false);
    assert.equal('Authorization' in buildGitHubHeaders('Bearer undefined'), false);
    assert.equal('Authorization' in buildGitHubHeaders(''), false);
  });

  it('includes Authorization only for a valid GitHub token format', () => {
    const headers = buildGitHubHeaders('ghp_testtoken12345');

    assert.equal(headers.Authorization, 'token ghp_testtoken12345');
    assert.equal(headers.Accept, 'application/vnd.github.v3+json');
    assert.equal(headers['User-Agent'], 'gsoc-org-finder');
  });
});

describe('fetchWithFallback()', () => {
  it('retries without auth header when a token-backed request returns 401', async () => {
    const callLog = [];
    const mockFetch = async (url, opts) => {
      const hasAuth = Boolean(opts?.headers?.Authorization);
      callLog.push({ url, hasAuth });

      if (callLog.length === 1 && hasAuth) {
        return jsonResponse({ message: 'Bad credentials' }, { status: 401 });
      }

      return jsonResponse({ ok: true });
    };

    const response = await fetchWithFallback(
      'https://api.github.com/users/testuser',
      buildGitHubHeaders('ghp_expiredtoken12345'),
      {},
      mockFetch
    );

    assert.equal(callLog.length, 2);
    assert.equal(callLog[0].hasAuth, true);
    assert.equal(callLog[1].hasAuth, false);
    assert.equal(response.status, 200);
  });

  it('does not retry when no auth header was sent', async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      return jsonResponse({ message: 'Not Found' }, { status: 404 });
    };

    const response = await fetchWithFallback(
      'https://api.github.com/users/doesnotexist',
      buildGitHubHeaders(undefined),
      {},
      mockFetch
    );

    assert.equal(callCount, 1);
    assert.equal(response.status, 404);
  });

  it('does not retry on 403 rate limit responses', async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      return jsonResponse({ message: 'API rate limit exceeded' }, { status: 403 });
    };

    const response = await fetchWithFallback(
      'https://api.github.com/users/testuser',
      buildGitHubHeaders('ghp_validtoken12345'),
      {},
      mockFetch
    );

    assert.equal(callCount, 1);
    assert.equal(response.status, 403);
  });
});

describe('github API handler user mode', () => {
  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
  });

  it('fetches public GitHub repos without Authorization when token is absent', async () => {
    const calls = [];
    globalThis.fetch = async (url, opts) => {
      calls.push({ url, headers: opts.headers });
      return jsonResponse([
        {
          fork: false,
          language: 'JavaScript',
          stargazers_count: 7,
          topics: ['web'],
          pushed_at: new Date().toISOString(),
        },
      ]);
    };

    const response = await handler(new Request('https://findmygsoc.test/api/github?user=public-user-no-token'));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal('Authorization' in calls[0].headers, false);
    assert.deepEqual(body.languages, ['JavaScript']);
    assert.deepEqual(body.topics, ['web']);
    assert.equal(body.stars, 7);
  });

  it('retries public GitHub repo lookup without Authorization when configured token is rejected', async () => {
    process.env.GITHUB_TOKEN = 'ghp_expiredtoken12345';
    const calls = [];

    globalThis.fetch = async (url, opts) => {
      const hasAuth = Boolean(opts.headers.Authorization);
      calls.push({ url, hasAuth });

      if (calls.length === 1 && hasAuth) {
        return jsonResponse({ message: 'Bad credentials' }, { status: 401 });
      }

      return jsonResponse([]);
    };

    const response = await handler(new Request('https://findmygsoc.test/api/github?user=public-user-expired-token'));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].hasAuth, true);
    assert.equal(calls[1].hasAuth, false);
    assert.deepEqual(body.languages, []);
  });
});
