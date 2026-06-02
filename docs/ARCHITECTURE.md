# 🏗️ Project Architecture — FindMyGSoC

This document describes the full project structure, module responsibilities, data flow, and configuration files for the FindMyGSoC codebase.

---

## 📁 Complete Folder Structure

```
GSoC-Org-Finder-/
│
├── index.html                          # Main single-page application (SPA) entry point
├── 404.html                            # Custom 404 error page
├── privacy.html                        # Privacy policy page
├── sw.js                               # Service Worker — PWA offline caching
├── manifest.json                       # PWA manifest (icons, theme, display mode)
├── robots.txt                          # Search engine crawler rules
├── sitemap.xml                         # XML sitemap for SEO
├── vercel.json                         # Vercel deployment config (rewrites, headers)
├── package.json                        # Dev tooling scripts (lint:js, lint:css, lint:html)
├── .eslintrc.json                      # ESLint rules for JavaScript
├── .stylelintrc.json                   # Stylelint rules for CSS
├── .htmlhintrc                         # HTMLHint rules for HTML
├── .gitignore                          # Git ignore rules
│
├── api/
│   └── github.js                       # Vercel Edge Function — GitHub API proxy
│
├── src/
│   ├── styles.css                      # All application CSS (49KB, monolithic)
│   ├── assets/
│   │   ├── icon-512.png                # PWA icon
│   │   └── og-image.jpeg               # Open Graph social preview image
│   └── js/
│       ├── app.js                      # Main application logic & UI orchestration
│       ├── org.js                      # Organization data — the 184-org ORGS array
│       ├── recommender.js              # AI-based org recommendation engine
│       ├── skillExtractor.js           # GitHub profile skill extraction
│       ├── githubAnalyzer.js           # GitHub repo analysis utilities
│       ├── recommendation-ui.js        # Recommendation panel UI rendering
│       └── badges-mvp.js               # Gamification badge system (Explorer, Comparator)
│
├── data/
│   ├── issues.json                     # Cached Good First Issues from GitHub
│   ├── mentors.json                    # Mentor profiles and metadata
│   ├── last-updated.json               # Timestamp of last data refresh
│   ├── org-stats.json                  # Cached organization statistics
│   └── ui-summary.json                 # Pre-computed UI summary for fast rendering
│
├── agent/
│   ├── scripts/                        # Node.js automation & maintenance scripts
│   │   ├── extract-mentors.js          # Fetches mentor data from GitHub
│   │   ├── fetch-issues.js             # Populates data/issues.json via GitHub API
│   │   ├── generate-ui-cache.js        # Generates data/ui-summary.json
│   │   ├── validate-ideas-urls.js      # Validates all org ideas page URLs
│   │   ├── validate-mentors.js         # Validates mentor list integrity
│   │   ├── orgs.js                     # Shared org data for scripts
│   │   ├── speed-insights.js           # Speed insights integration helper
│   │   └── speed-insights-lib.mjs      # Speed insights library module
│   └── tenet_agent/                    # Python AI PR review agent
│       ├── tenet_review.py             # Main review entrypoint
│       ├── prompts.py                  # LLM prompt templates
│       ├── utils.py                    # Utility functions
│       └── requirements.txt            # Python dependencies
│
├── docs/
│   ├── index.md                        # Documentation navigation hub ← YOU ARE HERE
│   ├── ARCHITECTURE.md                 # This file — project architecture reference
│   ├── WORKFLOWS.md                    # GitHub Actions workflow documentation
│   ├── AGENTS.md                       # Agent scripts and tenet AI agent docs
│   ├── DATA.md                         # Data file schemas and refresh process
│   ├── gamification.md                 # Badge system documentation
│   ├── GSSOC_CONTRIBUTOR_GUIDE.md      # GSSoC'26 contributor guide
│   ├── GSSOC_MENTOR_GUIDE.md           # GSSoC'26 mentor guide
│   ├── NSOC_GUIDE.md                   # NSoC'26 contributor guide
│   └── GENERAL_CONTRIBUTOR_GUIDE.md    # General contributor guide
│
└── .github/
    ├── CODEOWNERS                      # Code ownership assignments
    ├── workflows/                      # 37 GitHub Actions CI/CD workflows
    ├── ISSUE_TEMPLATE/                 # Issue templates (bug, feature — per program)
    ├── PULL_REQUEST_TEMPLATE/          # PR templates (GSSoC, NSoC, General)
    ├── labels/                         # Label definitions for GitHub
    ├── reviewers/                      # Reviewer/mentor pool configuration
    └── scripts/                        # GitHub Actions helper scripts
```

---

## 🧩 Module Responsibilities

### Frontend — `src/js/`

| Module | Responsibility |
|--------|---------------|
| `app.js` | Core application — search, filtering, sorting, pagination, modal rendering, keyboard navigation, dark mode, analytics, comparison mode, countdown timer |
| `org.js` | Single source of truth — the `ORGS` array containing all 184 GSoC 2026 organization entries |
| `recommender.js` | AI recommendation engine — scores organizations against a user's GitHub profile using skill matching and topic overlap |
| `skillExtractor.js` | Parses GitHub profile data (languages, topics, stars, activity) into a normalized skill set |
| `githubAnalyzer.js` | Utility functions for analyzing GitHub repository metadata |
| `recommendation-ui.js` | Renders the AI recommendation panel, displays matched orgs with confidence scores |
| `badges-mvp.js` | Gamification logic — tracks Explorer (org views) and Comparator (comparisons) badges using `localStorage`, fires toast notifications on badge unlock |

### API — `api/`

| File | Responsibility |
|------|---------------|
| `github.js` | Vercel Edge Function. Proxies all GitHub API requests so the token never reaches the client. Handles 4 modes: repo stats, GFI count, GFI issue list, and user profile analysis. In-memory caching with 1-hour TTL and 1000-entry LRU eviction. |

### Service Worker — `sw.js`

Provides PWA offline support through asset caching. Registered by `index.html` on page load.

### Data — `data/`

Static JSON files pre-populated by agent scripts. See [DATA.md](DATA.md) for schemas.

### Agent — `agent/`

Node.js scripts and a Python AI agent for repository maintenance. See [AGENTS.md](AGENTS.md) for usage.

---

## 🔄 Data Flow

```
User Opens Browser
       │
       ▼
  index.html loads
       │
       ├─► src/styles.css        (styling)
       ├─► src/js/org.js         (loads ORGS array — 184 orgs)
       ├─► src/js/app.js         (initializes UI, search, filters)
       ├─► src/js/badges-mvp.js  (loads badge progress from localStorage)
       └─► sw.js                 (registers service worker)
               │
               ▼
    User interacts (search / filter / click org)
               │
               ├─► app.js renders filtered org cards
               │
               └─► User clicks org card → modal opens
                           │
                           ▼
               app.js calls /api/github?repo=owner/repo
                           │
                           ▼
               api/github.js (Vercel Edge)
                           │
                           ├─ Check in-memory cache (1hr TTL)
                           │
                           └─ Fetch GitHub API (with GITHUB_TOKEN)
                                       │
                                       ▼
                           Returns: stars, forks, issues, lastCommit, activity

User triggers AI Recommender
       │
       ▼
  skillExtractor.js → calls /api/github?user=username
       │
       ▼
  githubAnalyzer.js → analyzes repo languages/topics
       │
       ▼
  recommender.js → scores each org in ORGS array
       │
       ▼
  recommendation-ui.js → renders ranked results panel
```

---

## ⚙️ Configuration Files

| File | Purpose | Key Settings |
|------|---------|-------------|
| `vercel.json` | Vercel deployment config | Rewrites `/api/github` → `/api/github.js`; Cache-Control headers for API and data routes |
| `manifest.json` | PWA manifest | App name, icons, theme color, display mode (`standalone`) |
| `package.json` | Dev tooling | Lint scripts: `lint:js`, `lint:css`, `lint:html`, `lint` (all three) |
| `.eslintrc.json` | JavaScript linting | ESLint rules for all JS files in `src/js/`, `api/`, `agent/scripts/` |
| `.stylelintrc.json` | CSS linting | Stylelint rules for `src/styles.css` |
| `.htmlhintrc` | HTML linting | HTMLHint rules for `index.html` |
| `robots.txt` | Crawler rules | Allows all crawlers on all paths |
| `sitemap.xml` | SEO sitemap | Lists main URLs for search indexing |

---

## 🏛️ Architecture Principles

This project is intentionally **zero-build** and **zero-dependency** on the frontend:

- ✅ Vanilla HTML/CSS/JS — no frameworks, no bundlers
- ✅ Vercel Edge Functions — lightweight serverless API
- ✅ Static-first — everything deployable as static files
- ✅ No `node_modules` shipped to the browser
- ✅ `localStorage` only for analytics/badges — no external tracking

---

## 🔗 Related Docs

- [docs/index.md](index.md) — Documentation navigation hub
- [docs/WORKFLOWS.md](WORKFLOWS.md) — GitHub Actions workflow reference
- [docs/AGENTS.md](AGENTS.md) — Agent scripts and AI review agent
- [docs/DATA.md](DATA.md) — Data file schemas
- [CONTRIBUTING.md](../CONTRIBUTING.md) — How to contribute
- [README.md](../README.md) — Project overview
