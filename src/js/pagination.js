// src/js/pagination.js

// Single source of truth for the pagination page window. Loaded by index.html
// at runtime via <script src> and required directly by the Node test suite, so
// the logic lives in exactly one place (no index.html / app.js duplication).

// Contiguous run of pages centered on the current one, clamped to range — no
// ellipsis / first / last, since the «/» buttons already jump to the boundaries.
function buildCompactWindow(currentPage, totalPages, count) {
  const n = Math.min(count, totalPages);
  let lo = currentPage - Math.floor((n - 1) / 2);
  lo = Math.max(1, Math.min(lo, totalPages - n + 1));
  return Array.from({ length: n }, (_, i) => lo + i);
}

globalThis.buildCompactWindow = buildCompactWindow;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildCompactWindow };
}
