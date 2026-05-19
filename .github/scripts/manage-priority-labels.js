function parsePriority(input = '') {
  const m = String(input).match(/\bP([0-4])\b/i);
  return m ? `priority-p${m[1]}` : null;
}

function allPriorityLabels() {
  return ['priority-p0', 'priority-p1', 'priority-p2', 'priority-p3', 'priority-p4'];
}

module.exports = { parsePriority, allPriorityLabels };
