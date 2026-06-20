const test = require('node:test');
const assert = require('node:assert');

// Mirror the DOM mock from tests/filtering.test.js
globalThis.window = {};
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };
globalThis.document = {
  documentElement: { classList: { toggle: () => {} } },
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

globalThis.ORGS = require('../src/js/org.js');
const { heroSearchMatches } = require('../src/js/hero-search.js');

test('returns empty array for empty string', () => {
  assert.deepStrictEqual(heroSearchMatches(''), []);
});

test('returns empty array for whitespace-only query', () => {
  assert.deepStrictEqual(heroSearchMatches('   '), []);
});

test('returns at most 3 results for a broad query', () => {
  const results = heroSearchMatches('a');
  assert.ok(results.length <= 3, `expected ≤ 3, got ${results.length}`);
});

test('returns empty array when no org name matches', () => {
  assert.deepStrictEqual(heroSearchMatches('zzzzzzzzzzzzzzzzzzz'), []);
});

test('matching is case-insensitive', () => {
  const lower = heroSearchMatches('dart');
  const upper = heroSearchMatches('DART');
  assert.deepStrictEqual(lower.map(r => r.name), upper.map(r => r.name));
});

test('exact match (case-insensitive) is ranked first', () => {
  // 'Dart' is an org in ORGS
  const results = heroSearchMatches('Dart');
  assert.ok(results.length > 0, 'expected at least one result for "Dart"');
  assert.strictEqual(results[0].name, 'Dart');
});

test('startsWith match ranked before mid-string match', () => {
  // 'Django Software Foundation' starts with 'dj'
  const results = heroSearchMatches('dj');
  assert.ok(results.length > 0, 'expected at least one match for "dj"');
  assert.ok(
    results[0].name.toLowerCase().startsWith('dj'),
    `expected first result to start with "dj", got "${results[0].name}"`
  );
});

test('each result has name (string) and tags (array)', () => {
  const results = heroSearchMatches('python');
  assert.ok(results.length > 0, 'expected results for "python"');
  results.forEach(r => {
    assert.strictEqual(typeof r.name, 'string');
    assert.ok(Array.isArray(r.tags));
  });
});
