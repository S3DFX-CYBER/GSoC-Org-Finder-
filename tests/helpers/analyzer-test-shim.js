// tests/helpers/analyzer-test-shim.js
function getStaleLocalCache(normalizedUsername, storage = {}) {
    return storage[normalizedUsername]?.data ?? null;
}

module.exports = { getStaleLocalCache };