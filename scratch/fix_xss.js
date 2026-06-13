
const fs = require("fs");

// Fix index.html
let html = fs.readFileSync("index.html", "utf8");

// We need to replace interpolations of dynamic text variables with escapeHtml(var)
const replacements = [
  { rx: /\$\{label\}/g, rw: "${escapeHtml(label)}" },
  { rx: /\$\{mentor\.name \|\| .Mentor.\}/g, rw: "${escapeHtml(mentor.name || `Mentor`)}" },
  { rx: /\$\{mentor\.displayLabel\}/g, rw: "${escapeHtml(mentor.displayLabel)}" },
  { rx: /\$\{org\.name\}/g, rw: "${escapeHtml(org.name)}" },
  { rx: /\$\{org\.desc\}/g, rw: "${escapeHtml(org.desc)}" },
  { rx: /\$\{m\.label\}/g, rw: "${escapeHtml(m.label)}" },
  { rx: /\$\{entry\.tip\}/g, rw: "${escapeHtml(entry.tip)}" },
  { rx: /\$\{record\.label \|\| record\.type\}/g, rw: "${escapeHtml(record.label || record.type)}" },
  { rx: /\$\{issue\.title(.*)\}/g, rw: "${escapeHtml(issue.title$1)}" },
  { rx: /\$\{issue\.repo(.*)\}/g, rw: "${escapeHtml(issue.repo$1)}" },
  { rx: /\$\{t\}/g, rw: "${escapeHtml(t)}" },
  { rx: /\$\{topTags\}/g, rw: "${escapeHtml(topTags)}" },
  { rx: /\$\{advice\.tools\}/g, rw: "${escapeHtml(advice.tools)}" },
  { rx: /\$\{advice\.action\}/g, rw: "${escapeHtml(advice.action)}" }
];

for (let r of replacements) {
  html = html.replace(r.rx, r.rw);
}

// Fix updateCountdown bug:
html = html.replace("<!-- Countdown logic moved to app.js -->", "setInterval(updateCountdown, 60000);\nupdateCountdown();\n<!-- Countdown logic moved to app.js -->");
html = html.replace(/<script>\s*setInterval\(updateCountdown/g, "<script>\nsetInterval(updateCountdown");

// Fix onerror="handleImgError(...)" to onerror="globalThis.handleImgError(...)"
html = html.replace(/onerror="handleImgError\(/g, `onerror="globalThis.handleImgError(`);

fs.writeFileSync("index.html", html);
console.log("Fixed index.html");

// Fix app.js
let app = fs.readFileSync("src/js/app.js", "utf8");
for (let r of replacements) {
  app = app.replace(r.rx, r.rw);
}
// Specific app.js compare modal org.name
app = app.replace(/\$\{getValue\(org\)\}/g, "${escapeHtml(String(getValue(org)))}");

fs.writeFileSync("src/js/app.js", app);
console.log("Fixed app.js");

