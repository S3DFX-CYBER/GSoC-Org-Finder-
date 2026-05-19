function detectLowEffortReview(body = '') {
  const text = String(body || '').trim().toLowerCase();
  if (!text) return { lowEffort: true, weight: 0, reason: 'Empty review body' };
  const short = text.length < 15;
  const canned = ['lgtm', 'ok', 'done', 'nice', 'looks good', 'ship it'].includes(text);
  if (short || canned) return { lowEffort: true, weight: 0.25, reason: 'Low-detail review text' };
  return { lowEffort: false, weight: 1, reason: 'Substantive review text' };
}
module.exports = { detectLowEffortReview };
