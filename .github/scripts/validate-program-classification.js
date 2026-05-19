function detectPrograms({ body = '', labels = [], headRef = '', issueLabels = [] }) {
  const text = `${body}`.toLowerCase();
  const found = new Set();

  if (/program\s*:\s*gssoc/.test(text) || /\[x\]\s*gssoc/.test(text) || /\bgssoc\b/.test(headRef.toLowerCase())) found.add('gssoc');
  if (/program\s*:\s*nsoc/.test(text) || /\[x\]\s*nsoc/.test(text) || /\bnsoc\b/.test(headRef.toLowerCase())) found.add('nsoc');
  if (/program\s*:\s*general/.test(text) || /\[x\]\s*general contribution/.test(text) || /\bgeneral\b/.test(headRef.toLowerCase())) found.add('general');

  const labelSet = new Set(labels.map((l) => l.toLowerCase()));
  if (labelSet.has('gssoc26') || issueLabels.includes('gssoc26')) found.add('gssoc');
  if (labelSet.has('nsoc26') || issueLabels.includes('nsoc26')) found.add('nsoc');
  if (labelSet.has('general-contribution') || issueLabels.includes('general-contribution')) found.add('general');

  return [...found];
}

module.exports = { detectPrograms };
