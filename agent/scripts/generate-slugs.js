/* eslint-env node */

const fs = require('node:fs');
const path = require('node:path');

const TARGETS = [
  path.resolve(__dirname, 'orgs.js'),
  path.resolve(__dirname, '../../src/js/org.js')
];

const IDEAS_SLUG_REGEX = /summerofcode\.withgoogle\.com\/(?:programs|archive)\/\d+\/organizations\/([a-z0-9-]+)/i;

function slugFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugFromIdeas(ideas) {
  if (typeof ideas !== 'string') return null;
  const match = ideas.match(IDEAS_SLUG_REGEX);
  return match ? match[1].toLowerCase() : null;
}

function addSlugsToFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf-8');
  const stats = { fromUrl: 0, fromName: 0, skipped: 0, flagged: [] };

  const updated = original
    .split(/\r?\n/)
    .map((line) => {
      const nameMatch = line.match(/name:"([^"]+)"/);
      if (!nameMatch) return line;
      if (/\bslug:"/.test(line)) {
        stats.skipped += 1;
        return line;
      }

      const name = nameMatch[1];
      const ideasMatch = line.match(/ideas:"([^"]*)"/);
      const urlSlug = ideasMatch ? slugFromIdeas(ideasMatch[1]) : null;
      const slug = urlSlug || slugFromName(name);

      if (urlSlug) stats.fromUrl += 1;
      else stats.fromName += 1;

      if (/[()]/.test(name) && !urlSlug) stats.flagged.push(`${name} -> ${slug}`);

      return line.replace(/name:"[^"]+"/, () => `name:"${name}", slug:"${slug}"`);
    })
    .join('\n');

  fs.writeFileSync(filePath, updated, 'utf-8');
  return stats;
}

for (const target of TARGETS) {
  const stats = addSlugsToFile(target);
  console.log(`\n${path.relative(process.cwd(), target)}`);
  console.log(`  slug from GSoC url : ${stats.fromUrl}`);
  console.log(`  slug from name     : ${stats.fromName}`);
  console.log(`  already had slug   : ${stats.skipped}`);
  if (stats.flagged.length) {
    console.log(`  review (name has parentheses, no authoritative url):`);
    stats.flagged.forEach((entry) => console.log(`    - ${entry}`));
  }
}
