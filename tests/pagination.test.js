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

globalThis.ORGS = require('../src/js/org.js');
require('../src/js/skillExtractor.js');

const { buildCompactWindow } = require('../src/js/app.js');

test('buildCompactWindow centers a contiguous run on the current page', () => {
  assert.deepStrictEqual(buildCompactWindow(9, 21, 5), [7, 8, 9, 10, 11]);
  assert.deepStrictEqual(buildCompactWindow(9, 21, 7), [6, 7, 8, 9, 10, 11, 12]);
});

test('buildCompactWindow has no ellipsis, first or last padding', () => {
  const r = buildCompactWindow(9, 21, 3);
  assert.deepStrictEqual(r, [8, 9, 10]);
  assert.ok(!r.includes('...'));
  assert.ok(!r.includes(1));
  assert.ok(!r.includes(21));
});

test('buildCompactWindow clamps at the start and end of the range', () => {
  assert.deepStrictEqual(buildCompactWindow(1, 21, 3), [1, 2, 3]);
  assert.deepStrictEqual(buildCompactWindow(21, 21, 3), [19, 20, 21]);
});

test('buildCompactWindow caps the run at the total page count', () => {
  assert.deepStrictEqual(buildCompactWindow(2, 3, 7), [1, 2, 3]);
});
