const fs = require('fs');

const ORGS = [
  'llvm', 'gcc-mirror', 'haskell', 'rust-lang', 'apple',
  'python', 'django', 'drupal', 'wagtail', 'wikimedia',
  'metasploit-framework', 'OWASP', 'rizinorg',
  'kubeflow', 'kubevirt', 'qemu', 'cncf',
  'tensorflow', 'opencv', 'arduino', 'freebsd',
  'kubernetes', 'apache', 'mozilla', 'gnome',
  'kde', 'ubuntu', 'debian', 'gentoo', 'fedora'
];

async function fetchIssues() {
  const results = [];

  for (const org of ORGS) {
    try {
      const res = await fetch(
        `https://api.github.com/search/issues?q=label:"good first issue"+org:${org}+state:open&per_page=10&sort=created`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`,
            Accept: 'application/vnd.github+json'
          }
        }
      );

      const data = await res.json();

      if (Array.isArray(data.items)) {
        results.push(...data.items.map((issue) => ({
          org,
          title: issue.title,
          url: issue.html_url,
          repo: issue.repository_url.split('/').slice(-2).join('/'),
          labels: issue.labels.map((l) => l.name),
          comments: issue.comments,
          created_at: issue.created_at,
          language: null
        })));
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(`Failed for ${org}:`, e.message);
    }
  }

  if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });

  fs.writeFileSync(
    './data/issues.json',
    JSON.stringify({ updated_at: new Date().toISOString(), issues: results }, null, 2)
  );

  console.log(`✅ Saved ${results.length} issues`);
}

fetchIssues();
