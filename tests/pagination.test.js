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

const { buildPageWindow } = require('../src/js/app.js');

test('buildPageWindow returns empty array for 1 page', () => {
  assert.deepStrictEqual(buildPageWindow(1, 1), []);
});

test('buildPageWindow returns all pages when total fits within windowSize + 2', () => {
  assert.deepStrictEqual(buildPageWindow(4, 8), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('buildPageWindow on page 1 shows first 6 pages, ellipsis, then last', () => {
  const r = buildPageWindow(1, 5618);
  assert.deepStrictEqual(r.slice(0, 7), [1, 2, 3, 4, 5, 6, '...']);
  assert.strictEqual(r[r.length - 1], 5618);
});

test('buildPageWindow on middle page shows 1, ellipsis, window, ellipsis, last', () => {
  const r = buildPageWindow(100, 5618);
  assert.strictEqual(r[0], 1);
  assert.strictEqual(r[1], '...');
  assert.ok(r.includes(100));
  assert.strictEqual(r[r.length - 2], '...');
  assert.strictEqual(r[r.length - 1], 5618);
});

test('buildPageWindow on last page shows 1, ellipsis, last 6 pages', () => {
  const r = buildPageWindow(5618, 5618);
  assert.strictEqual(r[0], 1);
  assert.strictEqual(r[1], '...');
  assert.strictEqual(r[r.length - 1], 5618);
  assert.strictEqual(r[r.length - 2], 5617);
});

test('buildPageWindow fills adjacent gap without ellipsis when lo === 2', () => {
  const r = buildPageWindow(5, 5618);
  assert.notStrictEqual(r[1], '...');
  assert.strictEqual(r[1], 2);
});
