# 🤖 Agents & Automation Scripts — FindMyGSoC

This document describes the `agent/` directory — the Node.js automation scripts and Python AI review agent that power repository maintenance and PR quality control.

---

## 📁 Directory Overview

```
agent/
├── scripts/                    # Node.js maintenance & data scripts
│   ├── extract-mentors.js      # Fetches mentor data from GitHub org
│   ├── fetch-issues.js         # Populates data/issues.json via GitHub API
│   ├── generate-ui-cache.js    # Generates data/ui-summary.json
│   ├── validate-ideas-urls.js  # Validates all org ideas page URLs
│   ├── validate-mentors.js     # Validates mentor list integrity
│   ├── orgs.js                 # Shared org data reference for scripts
│   ├── speed-insights.js       # Speed insights integration helper
│   └── speed-insights-lib.mjs  # Speed insights library module (ESM)
└── tenet_agent/                # Python AI PR review agent
    ├── tenet_review.py         # Main review entrypoint
    ├── prompts.py              # LLM prompt templates
    ├── utils.py                # Utility functions
    └── requirements.txt        # Python dependencies
```

---

## 🛠️ Node.js Scripts (`agent/scripts/`)

These scripts are run manually or via GitHub Actions to refresh data files or validate content.

---

### `validate-ideas-urls.js`

**Purpose:** Validates that all organization ideas page URLs in `src/js/org.js` are properly formatted and safe.

**Run:**
```bash
node agent/scripts/validate-ideas-urls.js
```

**What it checks:**
- ✅ URL format validity (must be parseable)
- ✅ Protocol restrictions (`http://` or `https://` only)
- ⚠️ Placeholder/generic URLs that need updating
- 📊 Summary statistics and protocol distribution

**When to run:** Before committing changes to `src/js/org.js`. The `code-quality.yml` workflow may also trigger this.

---

### `validate-mentors.js`

**Purpose:** Validates the mentor list for completeness and integrity.

**Run:**
```bash
node agent/scripts/validate-mentors.js
```

**What it checks:**
- Required fields present for each mentor entry
- No duplicate GitHub usernames
- Consistent data format

---

### `extract-mentors.js`

**Purpose:** Fetches mentor profile data from GitHub and populates `data/mentors.json`.

**Run:**
```bash
GITHUB_TOKEN=your_token node agent/scripts/extract-mentors.js
```

**Requires:** `GITHUB_TOKEN` environment variable with `public_repo` scope.

**Output:** Updates `data/mentors.json` with current mentor profiles, avatars, and activity metadata.

---

### `fetch-issues.js`

**Purpose:** Fetches Good First Issues from GitHub for all 184 organizations and populates `data/issues.json`.

**Run:**
```bash
GITHUB_TOKEN=your_token node agent/scripts/fetch-issues.js
```

**Requires:** `GITHUB_TOKEN` environment variable (authenticated requests respect higher rate limits).

**Output:** Updates `data/issues.json` and `data/last-updated.json`.

**Rate limits:** With a token, GitHub allows 5,000 requests/hour. Without a token, only 60 requests/hour. Always use a token when running this script.

---

### `generate-ui-cache.js`

**Purpose:** Pre-computes UI summary data for faster initial render and populates `data/ui-summary.json`.

**Run:**
```bash
node agent/scripts/generate-ui-cache.js
```

**Output:** Updates `data/ui-summary.json` with pre-aggregated statistics (category counts, language counts, etc.).

---

### `orgs.js`

**Purpose:** A copy of the organization data used by agent scripts for data processing without loading the full browser-side `src/js/org.js` module. Not intended to be run directly.

---

### `speed-insights.js` / `speed-insights-lib.mjs`

**Purpose:** Vercel Speed Insights integration helpers. Used internally by the deployment pipeline. Not intended to be run manually.

---

## 🐍 Python AI Review Agent (`agent/tenet_agent/`)

The TENET agent is an LLM-powered PR review system triggered by the `tenet-pr-review.yml` GitHub Actions workflow. It performs automated code review and context validation on every incoming pull request.

---

### Setup

**Requirements:** Python 3.8+

**Install dependencies:**
```bash
pip install -r agent/tenet_agent/requirements.txt
```

**Contents of `requirements.txt`:**
```
openai
requests
PyGithub
```

---

### `tenet_review.py` — Main Entrypoint

The main review script. It is invoked by the GitHub Actions workflow with the PR number and repository context.

**What it does:**
1. Fetches the PR diff and metadata from GitHub
2. Fetches the linked issue context
3. Sends the diff + issue to an LLM for analysis
4. Posts a structured review comment on the PR
5. Applies labels based on the review outcome

**Environment variables required:**
```
GITHUB_TOKEN        — GitHub token for API access
OPENAI_API_KEY      — OpenAI API key for LLM calls
REPO                — Repository in owner/repo format
PR_NUMBER           — Pull request number to review
```

---

### `prompts.py` — LLM Prompt Templates

Contains the structured prompt templates used by `tenet_review.py` to instruct the LLM. Prompts are designed to evaluate:

- Whether the PR addresses the linked issue
- Code quality and architecture consistency
- Out-of-scope changes
- Low-effort or AI-generated patterns

---

### `utils.py` — Utility Functions

Helper functions used across the agent:
- GitHub API wrappers (fetch PR, fetch issue, post comment)
- Diff parsing utilities
- Response formatting helpers

---

## 🔗 Related Docs

- [docs/DATA.md](DATA.md) — Schemas for the JSON files these scripts populate
- [docs/WORKFLOWS.md](WORKFLOWS.md) — GitHub Actions workflows that trigger these scripts
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — Full project structure
- [docs/index.md](index.md) — Documentation navigation hub
