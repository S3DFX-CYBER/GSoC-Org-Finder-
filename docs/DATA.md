# 🗄️ Data Files — FindMyGSoC

This document describes all files in the `data/` directory — their schemas, purpose, and how they are refreshed.

---

## 📁 Overview

```
data/
├── issues.json        # Cached Good First Issues from all 184 orgs
├── mentors.json       # Mentor profiles and metadata
├── last-updated.json  # Timestamp of the last data refresh
├── org-stats.json     # Cached organization statistics
└── ui-summary.json    # Pre-computed UI summary for fast rendering
```

These files are **static JSON** — they are pre-populated by agent scripts and served directly by Vercel as static assets. They are **not** generated at request time.

---

## 📄 `issues.json`

**Purpose:** Caches Good First Issues fetched from GitHub for all organizations. Used by the Good First Issues page to avoid hitting the GitHub API on every load.

**Populated by:** `agent/scripts/fetch-issues.js`

**Refreshed by:** `refresh-good-first-issues.yml` GitHub Actions workflow (weekly schedule).

**Schema:**
```json
[
  {
    "org": "django/django",
    "title": "Fix pagination edge case",
    "html_url": "https://github.com/django/django/issues/123",
    "created_at": "2026-04-15T10:30:00Z",
    "comments": 3,
    "labels": [
      { "name": "good first issue", "color": "7057ff" },
      { "name": "bug", "color": "d73a4a" }
    ]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `org` | `string` | Repository in `owner/repo` format |
| `title` | `string` | Issue title |
| `html_url` | `string` | Direct link to the GitHub issue |
| `created_at` | `string` | ISO 8601 creation timestamp |
| `comments` | `number` | Comment count |
| `labels` | `array` | Array of label objects with `name` and `color` (hex without `#`) |

---

## 📄 `mentors.json`

**Purpose:** Stores mentor profile data for the mentor leaderboard, review rotation system, and README mentor section.

**Populated by:** `agent/scripts/extract-mentors.js`

**Refreshed by:** Manual run or triggered via GitHub Actions when mentor roster changes.

**Schema:**
```json
[
  {
    "login": "mentorgithubusername",
    "avatar_url": "https://github.com/mentorgithubusername.png",
    "html_url": "https://github.com/mentorgithubusername",
    "program": "gssoc",
    "active": true
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `login` | `string` | GitHub username |
| `avatar_url` | `string` | GitHub avatar URL |
| `html_url` | `string` | GitHub profile URL |
| `program` | `string` | Program track: `gssoc`, `nsoc`, or `general` |
| `active` | `boolean` | Whether the mentor is currently active in the rotation pool |

---

## 📄 `last-updated.json`

**Purpose:** Records the timestamp of the last successful data refresh so the UI can show users how fresh the data is.

**Populated by:** `agent/scripts/fetch-issues.js` (updates on each run).

**Schema:**
```json
{
  "timestamp": "2026-05-20T08:00:00.000Z",
  "formatted": "May 20, 2026"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `string` | ISO 8601 UTC timestamp of the last refresh |
| `formatted` | `string` | Human-readable date string for display in the UI |

---

## 📄 `org-stats.json`

**Purpose:** Caches aggregate organization statistics (total org count, category breakdown) to avoid recomputing on every page load.

**Populated by:** `agent/scripts/generate-ui-cache.js`

**Schema:**
```json
{
  "total": 184,
  "byCategory": {
    "science": 22,
    "web": 18,
    "os": 15
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` | Total number of organizations |
| `byCategory` | `object` | Map of category slug → count |

---

## 📄 `ui-summary.json`

**Purpose:** Pre-computed UI summary data for fast initial render of stats, filters, and category counts without client-side computation.

**Populated by:** `agent/scripts/generate-ui-cache.js`

**Schema:**
```json
{
  "generatedAt": "2026-05-20T08:00:00.000Z",
  "totalOrgs": 184,
  "categories": ["science", "web", "os", "security"],
  "languages": ["python", "c++", "javascript", "rust"],
  "newcomerCount": 12,
  "veteranCount": 52
}
```

| Field | Type | Description |
|-------|------|-------------|
| `generatedAt` | `string` | ISO 8601 timestamp when cache was generated |
| `totalOrgs` | `number` | Total org count |
| `categories` | `array` | Sorted list of all available category slugs |
| `languages` | `array` | Sorted list of all available language tags |
| `newcomerCount` | `number` | Number of first-time GSoC organizations |
| `veteranCount` | `number` | Number of organizations with 5+ years of GSoC participation |

---

## 🔄 Refresh Schedule

| File | Refresh Method | Frequency |
|------|---------------|-----------|
| `issues.json` | `refresh-good-first-issues.yml` workflow | Weekly (automated) |
| `last-updated.json` | Updated alongside `issues.json` | Weekly (automated) |
| `mentors.json` | `agent/scripts/extract-mentors.js` | Manual or on roster change |
| `org-stats.json` | `agent/scripts/generate-ui-cache.js` | Manual or after org list changes |
| `ui-summary.json` | `agent/scripts/generate-ui-cache.js` | Manual or after org list changes |

---

## 🔗 Related Docs

- [docs/AGENTS.md](AGENTS.md) — Scripts that populate these files
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — Full project structure
- [docs/index.md](index.md) — Documentation navigation hub
