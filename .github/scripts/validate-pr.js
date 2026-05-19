const LOW_EFFORT_PATTERNS = [/^minor update$/i, /^update$/i, /lgtm/i, /pls merge/i];

function extractIssueRefs(text) {
  const refs = [];
  const re = /(close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;
  let m;
  while ((m = re.exec(text || ''))) refs.push(Number(m[2]));
  return [...new Set(refs)];
}

function calcQuality(pr, files) {
  const additions = files.reduce((s, f) => s + (f.additions || 0), 0);
  const deletions = files.reduce((s, f) => s + (f.deletions || 0), 0);
  const changed = files.length;
  const body = `${pr.title || ''}\n${pr.body || ''}`;

  let score = 0;
  const reasons = [];
  if (changed > 25) { score += 2; reasons.push('Large number of changed files'); }
  if (additions + deletions > 1400) { score += 2; reasons.push('Very large diff'); }
  if (/^docs/i.test(pr.title || '') && changed > 8) { score += 2; reasons.push('Docs title with broad unrelated changes'); }
  const lockOnly = files.every(f => /(^|\/)package-lock\.json$|yarn\.lock$|pnpm-lock\.yaml$/i.test(f.filename));
  if (lockOnly) { score += 3; reasons.push('Lockfile-only PR'); }
  const readmeOnly = files.every(f => /readme\.md$/i.test(f.filename));
  if (readmeOnly && !/^docs/i.test(pr.title || '')) { score += 2; reasons.push('README-only non-doc PR'); }
  if (LOW_EFFORT_PATTERNS.some((p) => p.test((pr.title || '').trim()))) { score += 2; reasons.push('Low-effort title signal'); }
  if ((body || '').length < 30) { score += 1; reasons.push('Very short PR context'); }
  return { score, reasons };
}

module.exports = { extractIssueRefs, calcQuality };
