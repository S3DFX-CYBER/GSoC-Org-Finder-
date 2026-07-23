/* eslint-env node */
// Shared Node.js test harness. app.js touches several browser globals at import
// time, so suites that import it must stub those first. Require this module
// before requiring app.js. Also loads the org dataset onto globalThis.
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

globalThis.ORGS = require('../../src/js/org.js');
