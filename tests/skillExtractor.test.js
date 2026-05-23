const test = require('node:test');
const assert = require('node:assert/strict');

const { extractSkills, normalizeSkill } = require('../src/js/skillExtractor');

test('normalizeSkill collapses known aliases', () => {
  assert.equal(normalizeSkill('golang'), 'go');
  assert.equal(normalizeSkill('reactjs'), 'react');
  assert.equal(normalizeSkill('canvas'), 'html5 canvas');
});

test('extractSkills finds explicit and contextual skills without false positives', () => {
  const skills = extractSkills(
    'Built backend services in Go, Python, and Kubernetes. I also use R for statistics.'
  );

  assert.deepEqual(
    skills.filter(skill => ['go', 'python', 'kubernetes', 'r'].includes(skill)).sort(),
    ['go', 'kubernetes', 'python', 'r']
  );
});

test('extractSkills ignores conversational go usage but keeps C in technical lists', () => {
  const skills = extractSkills(
    'I want to go into systems work with Python, C, and Rust.'
  );

  assert.equal(skills.includes('go'), false);
  assert.equal(skills.includes('c'), true);
  assert.equal(skills.includes('python'), true);
  assert.equal(skills.includes('rust'), true);
});
