'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Normalizes a GitHub username to lowercase
 */
function canonicalizeMentor(username) {
  return String(username || '').trim().toLowerCase();
}

/**
 * Safely reads a JSON file
 */
function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

/**
 * Atomically writes a JSON file using a temporary file and rename
 */
function writeJsonAtomic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tempPath, filePath);
}

/**
 * Generates a SHA-256 hash for a string to compare content easily
 */
function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Updates a sticky comment, avoiding API calls if the content hasn't changed.
 * Returns { action: 'created'|'updated'|'skipped', id: commentId }
 */
async function updateStickyComment({ github, owner, repo, issue_number, marker, newBody }) {
  const fullBody = `${marker}\n${newBody}\n${marker.replace('-->', ':end -->')}`;
  const newHash = hashString(fullBody);

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner, repo, issue_number, per_page: 50
  });

  const existing = comments.find(c => c.body && c.body.includes(marker));

  if (existing) {
    const existingHash = hashString(existing.body);
    if (existingHash === newHash) {
      console.log('Sticky comment unchanged. Skipping update.');
      return { action: 'skipped', id: existing.id };
    }
    await github.rest.issues.updateComment({
      owner, repo, comment_id: existing.id, body: fullBody
    });
    console.log(`Updated sticky comment ${existing.id}`);
    return { action: 'updated', id: existing.id };
  } else {
    const created = await github.rest.issues.createComment({
      owner, repo, issue_number, body: fullBody
    });
    console.log(`Created new sticky comment ${created.data.id}`);
    return { action: 'created', id: created.data.id };
  }
}

/**
 * Safely adds and removes labels
 */
async function syncLabels({ github, owner, repo, issue_number, add = [], remove = [] }) {
  if (remove.length > 0) {
    for (const label of remove) {
      try {
        await github.rest.issues.removeLabel({ owner, repo, issue_number, name: label });
      } catch (e) {
        if (e.status !== 404) console.warn(`Failed to remove label ${label}:`, e.message);
      }
    }
  }
  if (add.length > 0) {
    try {
      await github.rest.issues.addLabels({ owner, repo, issue_number, labels: add });
    } catch (e) {
      console.warn(`Failed to add labels ${add.join(',')}:`, e.message);
    }
  }
}

/**
 * Seeded pseudo-random number generator (Mulberry32)
 */
function seededRandom(seed) {
  return function() {
    var t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * Selects N items from an array based on weighted probabilities using a seeded RNG
 */
function weightedRandomSelect(items, weights, n, seed) {
  const selected = [];
  const rng = seededRandom(seed);
  let availableItems = [...items];
  let availableWeights = [...weights];

  for (let i = 0; i < n && availableItems.length > 0; i++) {
    const totalWeight = availableWeights.reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) break;
    
    let r = rng() * totalWeight;
    let chosenIndex = -1;
    for (let j = 0; j < availableWeights.length; j++) {
      r -= availableWeights[j];
      if (r <= 0) {
        chosenIndex = j;
        break;
      }
    }

    if (chosenIndex === -1) chosenIndex = availableWeights.length - 1;

    selected.push(availableItems[chosenIndex]);
    availableItems.splice(chosenIndex, 1);
    availableWeights.splice(chosenIndex, 1);
  }
  return selected;
}

/**
 * Trigram Jaccard similarity for strings
 */
function stringSimilarity(str1, str2) {
  function getTrigrams(s) {
    const set = new Set();
    const str = `  ${s.toLowerCase().replace(/[^a-z0-9\s]/g, '')}  `;
    for (let i = 0; i < str.length - 2; i++) {
      set.add(str.slice(i, i + 3));
    }
    return set;
  }
  const set1 = getTrigrams(str1);
  const set2 = getTrigrams(str2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

module.exports = {
  canonicalizeMentor,
  readJsonSafe,
  writeJsonAtomic,
  hashString,
  updateStickyComment,
  syncLabels,
  seededRandom,
  weightedRandomSelect,
  stringSimilarity
};
