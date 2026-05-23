const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeSkill } = require('../src/js/skillExtractor');
globalThis.normalizeSkill = normalizeSkill;

const {
  calculateScoreForOrg,
  classifyActivityLevel,
  getRecommendations
} = require('../src/js/recommender');

test('classifyActivityLevel groups known activity labels', () => {
  assert.equal(classifyActivityLevel('hot'), 'high');
  assert.equal(classifyActivityLevel('moderate'), 'medium');
  assert.equal(classifyActivityLevel('chill'), 'low');
  assert.equal(classifyActivityLevel('unknown'), 'unknown');
});

test('getRecommendations returns the strongest matching organizations first', () => {
  globalThis.ORGS = [
    {
      name: 'Docs Org',
      tags: ['documentation'],
      cat: 'docs',
      codebase: 'beginner',
      years: 2
    },
    {
      name: 'Systems Org',
      tags: ['go', 'kubernetes', 'distributed systems'],
      cat: 'systems programming',
      codebase: 'advanced',
      years: 12,
      _gh: { activity: 'high' }
    }
  ];

  const recommendations = getRecommendations(
    ['Go', 'Distributed Systems'],
    {
      languages: ['Go'],
      topics: ['Kubernetes'],
      activity: 'high',
      stars: 120
    }
  );

  assert.equal(recommendations.length, 2);
  assert.equal(recommendations[0].org.name, 'Systems Org');
  assert.ok(recommendations[0].matchedSkills.includes('go'));
  assert.ok(recommendations[0].reasons.some(reason => reason.includes('Strong stack match')));
});

test('calculateScoreForOrg falls back safely when organization data is sparse', () => {
  const result = calculateScoreForOrg(
    {},
    0,
    new Set(),
    new Set(),
    null
  );

  assert.equal(result.score > 0, true);
  assert.deepEqual(result.matchedSkills, []);
  assert.equal(result.reasons.includes('Matches your developer profile'), true);
});
