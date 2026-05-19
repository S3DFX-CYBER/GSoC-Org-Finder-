function stripHtmlComments(input) {
  let previous;
  let output = input;
  do {
    previous = output;
    output = output.replace(/<!--[\s\S]*?-->/g, '');
  } while (output !== previous);
  return output;
}

function analyzeIssue(issue) {
  const title = (issue.title || '').trim();
  const body = (issue.body || '').trim();
  const lower = body.toLowerCase();
  const problems = [];

  if (title.length < 12) problems.push('Use a more descriptive title (at least 12 characters).');
  if (stripHtmlComments(body).trim().length < 80) problems.push('Add more detail so maintainers can reproduce and validate.');
  if (!/step|reproduce/i.test(lower)) problems.push('Include reproduction steps.');
  if (!/expected/i.test(lower)) problems.push('Include expected behavior.');
  if (!/actual|happen|observed/i.test(lower)) problems.push('Include actual behavior.');

  const spamSignals = [
    /^pls assign/i,
    /^assign me/i,
    /^bug fix needed$/i,
    /^help$/i,
    /as an ai language model/i,
  ];
  const spam = spamSignals.some((re) => re.test(body)) || (body.length < 20 && title.length < 15);

  return { problems, spam };
}

module.exports = { analyzeIssue };
