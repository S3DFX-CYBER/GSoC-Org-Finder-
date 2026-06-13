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
const { orgMatchesLanguages, applySecondarySort, getOrgSize, getMentorshipLevel } = require('../src/js/app.js');
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
  const a = { name: 'A', years: 10, competition: 'hot', _gh: { stars: 100, gfi: 5, activity: 'active' } };
  const b = { name: 'B', years: 5, competition: 'chill', _gh: { stars: 50, gfi: 15, activity: 'moderate' } };

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

  // activity sort: active before moderate
  assert.ok(applySecondarySort(a, b, 'activity') < 0);
});

test('getOrgSize classifies orgs by years', () => {
  assert.strictEqual(getOrgSize({ years: 10 }), 'large');
  assert.strictEqual(getOrgSize({ years: 8 }), 'large');
  assert.strictEqual(getOrgSize({ years: 7 }), 'medium');
  assert.strictEqual(getOrgSize({ years: 4 }), 'medium');
  assert.strictEqual(getOrgSize({ years: 3 }), 'small');
  assert.strictEqual(getOrgSize({ years: 1 }), 'small');
});

test('getMentorshipLevel classifies orgs by mentor count', () => {
  assert.strictEqual(getMentorshipLevel({ name: 'NoMentorOrg' }), 'low');
  assert.strictEqual(getMentorshipLevel({ name: 'SingleMentorOrg' }), 'low');
});

test('activity sort orders active before moderate before inactive', () => {
  const active = { name: 'X', _gh: { activity: 'active' } };
  const moderate = { name: 'Y', _gh: { activity: 'moderate' } };
  const inactive = { name: 'Z', _gh: { activity: 'inactive' } };
  const noData = { name: 'W' };

  assert.ok(applySecondarySort(active, moderate, 'activity') < 0);
  assert.ok(applySecondarySort(moderate, inactive, 'activity') < 0);
  assert.strictEqual(applySecondarySort(inactive, noData, 'activity'), 0);
  assert.ok(applySecondarySort(noData, active, 'activity') > 0);
});
