# 🚀 GSoC 2026 Org Finder

> **Find your perfect Google Summer of Code 2026 organization — filtered by tech stack, domain, competition level, and live GitHub activity.**
<img width="1896" height="800" alt="image" src="https://github.com/user-attachments/assets/414e4b55-ec50-4290-97a6-678f23e7c96e" />

**Live site → [https://findmygsoc.vercel.app/](https://findmygsoc.vercel.app/)**
---
Join our Channel for community related questions and feedbacks 
**Discord → [https://discord.gg/mgWV3xSV7](https://discord.gg/mgWV3xSV7)**



## ✨ What is this?

A fast, beautiful, single-page tool that helps GSoC 2026 applicants cut through all **185 selected organizations** and instantly find the ones that match *their* skills and interests.

No sign-up. No install. No build step. Just open and explore.

---

## 🎯 Features

### 🔍 Discovery & Filtering
- **Full-text search** by org name, technology, or topic
- **Domain filter** — Science, Web, Security, AI, OS, Media, Infrastructure, and more
- **Language filter** — Python, Rust, Go, C++, Java, JavaScript, Haskell, Julia, and more
- **Multi-select language pills** — stack multiple languages for combined matching
- **Quick chips** — one-tap filters for Veterans only, Newcomers, High/Low competition, Actively Maintained
- **Sort by** — Alphabetical, Most Experienced, Newcomers First, Least Competitive, Most Stars, Good First Issues

### 📊 Live GitHub Data
- **Live GitHub stats** — Stars, Forks, Open Issues, Last Commit — fetched via a serverless proxy
- **Good First Issues count** — shown on every card and sortable, perfect for finding beginner-friendly orgs
- **Activity badge** — Active / Moderate / Low based on last commit date
- **Smart repo links** — single-project orgs link directly to their repo; umbrella orgs (Apache, OWASP, KDE…) link to their GitHub org page

### 📋 Organization Detail Modal
- Full description, tech stack tags, "Best Fit For" profiles
- GSoC participation timeline (every year the org has participated)
- Key metrics: years in GSoC, competition level, first year, Good First Issues count
- **Project Ideas Link** — direct link to organization's ideas page (with security-hardened URL validation)
- Fallback message when no ideas link is available
- One-click add to comparison

### ⚖️ Comparison Mode
- Select up to **3 organizations** side-by-side
- Compares: category, GSoC years, competition, stars, forks, open issues, last commit, Good First Issues, languages
- Green/red highlighting for best and worst values across each metric

### 🟢 Good First Issues Page
- Dedicated full-screen page listing **Good First Issues from all 185 orgs**
- Fetched live via the GitHub API proxy (uses your token, respects rate limits)
- Filter by category, language, or free-text search
- Each issue links directly to GitHub — sorted newest first
- Shows org logo, issue title, labels, comment count, and relative date

### ⏱ Deadline Countdown
- Live countdown banner to application open date (March 16, 2026)
- Automatically switches to "Applications Closing In" during the open window (Mar 16 – Apr 8)

### 🔥 Trending Section
- Shows the most-viewed organizations based on your own browsing history
- Powered by localStorage analytics — zero data sent to any server

### ⌨️ Keyboard Navigation
- `↑ ↓ ← →` — move focus between cards
- `Enter` — open focused card's modal
- `C` — toggle compare for focused card
- `Esc` — close any open panel

### 📊 Usage Analytics Panel
- Tracks your own session: visits, searches, org views, filters used, session time
- Top categories browsed, most-viewed orgs, popular search terms
- All stored locally in your browser — nothing leaves your device

### 🌙 Dark / Light Mode
- Fully themed dark mode with warm ink/cream palette
- Preference persisted across sessions

### 📱 Fully Responsive
- Works on mobile, tablet, and desktop
- Three breakpoints: 900px (tablet), 640px (phone), 380px (small phone)
- Stats bar scrolls horizontally on mobile instead of stacking

---

## 🗂️ All 185 GSoC 2026 Organizations

| Domain | Examples |
|---|---|
| Science & Medicine | OpenAstronomy, DeepChem, MDAnalysis, ArduPilot, CERN-HSF |
| Programming Languages | LLVM, GCC, Haskell.org, The Rust Foundation, Swift, Python SF |
| Data | MariaDB, PostgreSQL, DBpedia, OpenStreetMap, MetaBrainz |
| Web | Django, Drupal, Wagtail, Wikimedia, webpack |
| Security | Metasploit, OWASP, Rizin, AFLplusplus, The Honeynet Project |
| Operating Systems | Debian, FreeBSD, GNOME, NetBSD, Haiku, KDE |
| Media | FFmpeg, Blender, Synfig, Jitsi, VideoLAN |
| Infrastructure | Kubeflow, KubeVirt, QEMU, Meshery, CNCF |
| Dev Tools | MIT App Inventor, OpenVINO, Gemini CLI, API Dash |
| Other | AnkiDroid, Joplin, Zulip, CCExtractor, Neovim |

---

## 🛠️ Tech Stack

| Layer | What |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — zero frameworks, zero build step |
| Hosting | Vercel (static) |
| API | Vercel Edge Function (`/api/github.js`) |
| Data source | Manually curated from [summerofcode.withgoogle.com](https://summerofcode.withgoogle.com/programs/2026/organizations) |
| Analytics | Browser `localStorage` only — no external tracking |

---

## 📁 Project Structure

```
gsoc-2026-org-finder/
├── index.html                    # Main frontend HTML
├── api/github.js                 # Vercel Edge Function — GitHub API proxy
├── src/
│   ├── assets/og-image.jpeg      # Social preview image
│   ├── js/app.js                 # Application logic
│   ├── js/org.js                 # Organization data source
│   └── styles.css                # Styling
├── agent/
│   ├── scripts/                  # Automation and helper scripts
│   └── tenet_agent/              # TENET PR review agent
├── data/issues.json
└── README.md
```

No `node_modules`. No build step. No bundler. Just deploy.

---

## 🔍 URL Validation

The project includes a validation script to ensure all organization ideas URLs are safe and properly formatted:

```bash
node agent/scripts/validate-ideas-urls.js
```

This script checks:
- ✅ URL format validity
- ✅ Protocol restrictions (http/https only)
- ⚠️ Placeholder/generic URLs that need updating
- 📊 Summary statistics and protocol distribution

Run this before committing changes to `src/js/org.js` to catch invalid URLs early.

---

## 🚀 Deploy Your Own

### 1. Fork & Clone
```bash
git clone https://github.com/your-username/gsoc-2026-org-finder.git
cd gsoc-2026-org-finder
```

### 2. Add GitHub Token (for live stats + Good First Issues)
In your Vercel dashboard → Project Settings → Environment Variables:
```
GITHUB_TOKEN = ghp_your_token_here
```
Generate a token at [github.com/settings/tokens](https://github.com/settings/tokens) — only `public_repo` scope needed.

### 3. Deploy
```bash
vercel --prod
```
Or connect the repo to Vercel and it deploys automatically on every push.

### 4. Run Locally
```bash
open index.html   # macOS — works without API (GitHub stats won't load)
```
For full functionality locally, run `vercel dev` to start the Edge Function.

---

## 🤝 Contributing

Found a missing org, wrong category, or incorrect tags? PRs are very welcome!

1. Fork the repo
2. Edit the `ORGS` array in `index.html`
3. Open a pull request

Each org entry looks like this:

```js
{
  name: "Organization Name",
  cat: "science",           // science | programming | data | web | os | security | media | infra | dev | other
  years: 5,                 // number of GSoC years participated
  firstYear: 2021,          // first year they participated
  competition: "moderate",  // hot | moderate | chill
  github: "owner/repo",     // main repo (or just "owner" for umbrella orgs)
  ideas: "https://github.com/org/repo/wiki/Ideas",  // project ideas page URL (optional)
  tags: ["python", "c++", "machine learning"],
  desc: "Short description of what the org does.",
  fit: ["Python devs", "ML researchers"]
}
```

**Ideas URL Requirements**:
- Must use `http://` or `https://` protocol (or protocol will be added automatically)
- Should link to the organization's specific project ideas page
- Generic GSoC organization pages are acceptable as placeholders but should be updated when possible
- Run `node agent/scripts/validate-ideas-urls.js` to check all URLs before submitting

**Competition levels** (subjective, based on org popularity + slot count):
- `hot` — high applicant volume, very competitive (Django, LLVM, Git, KDE…)
- `moderate` — good balance of applicants and slots
- `chill` — fewer applicants, easier to stand out

---

## 📅 GSoC 2026 Key Dates

| Date | Milestone |
|---|---|
| February 2026 | Organizations announced |
| **March 16, 2026** | **Student applications open** |
| **March 31, 2026** | **Application deadline** |
| April 30 2026 | Accepted students announced |
| May – November 2026 | Coding period |

---

## 🔌 API Reference (`/api/github.js`)

The Edge Function proxies GitHub API calls so your token never hits the client.

| Endpoint | Description |
|---|---|
| `GET /api/github?repo=owner/repo` | Repo stats: stars, forks, issues, last commit, activity, GFI count |
| `GET /api/github?repo=owner/repo&gfi=1` | Good First Issue count only (faster, cached separately) |
| `GET /api/github?repo=owner/repo&gfi=1&issues=1` | Full list of up to 30 open Good First Issues |

All responses are cached in-memory for **1 hour** on the Edge runtime.

---
## We thank all our Contributors for improving this project
## Contributors ✨
<a href="https://github.com/S3DFX-CYBER/GSoC-Org-Finder-/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=S3DFX-CYBER/GSoC-Org-Finder-" />
</a>

## 📄 License

Apache 2.0 — made for GSoC beginners, by people who've been there.

Share it with anyone applying! Applications open **March 16, 2026**. 🙌
