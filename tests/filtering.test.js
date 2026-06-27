const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals for Node.js test environment before importing app.js
globalThis.window = {};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
globalThis.sessionStorage = {
  getItem: () => null,
  setItem: () => {}
};
globalThis.document = {
  documentElement: {
    classList: {
      toggle: () => {}
    }
  },
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Set up global ORGS
globalThis.ORGS = require('../src/js/org.js');

// Import the modules
const { orgMatchesLanguages, applySecondarySort, searchComparator } = require('../src/js/app.js');
require('../src/js/skillExtractor.js'); // Populates LANGUAGE_MAP on global

test('orgMatchesLanguages returns true when languages set is empty', () => {
  const org = { tags: ['python', 'django'] };
  const selectedLangs = new Set();
  assert.strictEqual(orgMatchesLanguages(org, selectedLangs), true);
});

test('orgMatchesLanguages filters correctly with matchAllLanguages = false', () => {
  const org = { tags: ['python', 'django'] };
  const selectedLangs = new Set(['Python', 'Java']);
  
  globalThis.matchAllLanguages = false;
  assert.strictEqual(orgMatchesLanguages(org, selectedLangs), true);
});

test('orgMatchesLanguages filters correctly with matchAllLanguages = true', () => {
  const org = { tags: ['python', 'django'] };
  
  // Both match
  const selectedLangs1 = new Set(['Python', 'Django']);
  globalThis.matchAllLanguages = true;
  assert.strictEqual(orgMatchesLanguages(org, selectedLangs1), true);

  // One mismatch
  const selectedLangs2 = new Set(['Python', 'Java']);
  assert.strictEqual(orgMatchesLanguages(org, selectedLangs2), false);
});

test('applySecondarySort sorts correctly', () => {
  const a = { name: 'A', years: 10, competition: 'hot', _gh: { stars: 100, gfi: 5 } };
  const b = { name: 'B', years: 5, competition: 'chill', _gh: { stars: 50, gfi: 15 } };

  // stars sort (descending)
  assert.ok(applySecondarySort(a, b, 'stars') < 0);
  
  // gfi sort (descending)
  assert.ok(applySecondarySort(a, b, 'gfi') > 0);

  // years-desc sort
  assert.ok(applySecondarySort(a, b, 'years-desc') < 0);

  // years-asc sort
  assert.ok(applySecondarySort(a, b, 'years-asc') > 0);

  // alphabetical sort (default)
  assert.ok(applySecondarySort(a, b, 'alpha') < 0);
});

test('searchComparator sorts with fuzzy scores', () => {
  const a = { name: 'The Python Foundation', years: 10, competition: 'hot' };
  const b = { name: 'A Pyhton Group', years: 5, competition: 'chill' };
  const c = { name: 'Some Other', years: 5, competition: 'chill' };

  globalThis.orgSearchScores = new Map();
  globalThis.orgSearchScores.set('The Python Foundation', 0.1);
  globalThis.orgSearchScores.set('A Pyhton Group', 0.3);
  globalThis.orgSearchScores.set('Some Other', 0.9);

  // a has better score than b
  assert.ok(searchComparator(a, b, 'pyhton', 'alpha') < 0);
  // b has better score than c
  assert.ok(searchComparator(b, c, 'pyhton', 'alpha') < 0);

  // Exact match takes precedence over score
  const exact = { name: 'pyhton', years: 1, competition: 'chill' };
  globalThis.orgSearchScores.set('pyhton', 0.5); // Worse score somehow
  assert.ok(searchComparator(exact, a, 'pyhton', 'alpha') < 0);

  // StartsWith takes precedence over score
  const starts = { name: 'pyhton starts', years: 1, competition: 'chill' };
  globalThis.orgSearchScores.set('pyhton starts', 0.4);
  assert.ok(searchComparator(starts, b, 'pyhton', 'alpha') < 0);
});
