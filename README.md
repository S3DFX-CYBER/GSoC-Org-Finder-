# 🚀 GSoC 2026 Org Finder

---

## 🌐 Navigation
[🏠 Home (README)](README.md) • [🤝 Contributing Guide](CONTRIBUTING.md) • [📜 Code of Conduct](CODE_OF_CONDUCT.md) • [🛡️ Security Policy](SECURITY.md) • [📚 General Contributor Guide](docs/GENERAL_CONTRIBUTOR_GUIDE.md)

---

> **Find your perfect Google Summer of Code 2026 organization — filtered by tech stack, domain, competition level, and live GitHub activity.**

<img width="1896" height="800" alt="GSoC Org Finder Dashboard" src="https://github.com/user-attachments/assets/414e4b55-ec50-4290-97a6-678f23e7c96e" />

**Live site → [https://findmygsoc.vercel.app/](https://findmygsoc.vercel.app/)**  
Join our Channel for community-related questions and feedback:  
**Discord → [https://discord.gg/mgWV3xSV7](https://discord.gg/mgWV3xSV7)**

---

## ✨ What is this?

A fast, beautiful, single-page application that helps GSoC 2026 applicants search, filter, and compare all **184 selected organizations** to instantly find the ones that match *their* skills and interests.

No sign-up. No install. No build step. Just open and explore.

---

## 📖 Table of Contents

- [What is this?](#-what-is-this)
- [Interactive System Architecture](#-interactive-system-architecture)
- [Folder & Module Responsibilities](#-folder--module-responsibilities)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Local Development & Quick-Start](#-local-development--quick-start)
- [API Reference (`/api/github.js`)](#-api-reference-apigithubjs)
- [URL Validation](#-url-validation)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [Contributing & PR Review Pipeline](#-contributing--pr-review-pipeline)
- [Project Admin & GSSoC Mentors](#-project-admin--gssoc-mentors)
- [GSoC 2026 Key Dates](#-gsoc-2026-key-dates)
- [License](#-license)

---

## 📊 Interactive System Architecture

The following diagram illustrates how the frontend components, static assets, Vercel Edge Serverless Function proxy, automated scrapers, and the security AI code review agent (`tenet_agent`) interact within the ecosystem.

```mermaid
graph TD
    subgraph Client ["Client Side (Browser)"]
        UI["HTML5/CSS3 Interface"] <--> App["src/js/app.js (Main Controller)"]
        App <--> RecUI["src/js/recommendation-ui.js (Recommender UI)"]
        RecUI <--> Rec["src/js/recommender.js (Scoring Logic)"]
        App <--> Skill["src/js/skillExtractor.js (Resume Parsing)"]
        App <--> Github["src/js/githubAnalyzer.js (Profile Analysis)"]
        App <--> Badges["src/js/badges-mvp.js (Gamified Badges)"]
        Badges <--> Storage[("localStorage")]
        App <--> OrgData["src/js/org.js (Static Org Metadata)"]
    end

    subgraph ServerlessProxy ["Edge Runtime"]
        API["api/github.js (Serverless API Proxy)"]
    end

    subgraph ScrapingAutomation ["Offline/Online Agents & Scripts"]
        MentorScript["agent/scripts/extract-mentors.js"] --> MentorData["data/mentors.json"]
        IssueScript["agent/scripts/fetch-issues.js"] --> IssueData["data/issues.json"]
        UrlValidator["agent/scripts/validate-ideas-urls.js"]
        TenetAgent["agent/tenet_agent/tenet_review.py (AI Reviewer)"]
    end

    subgraph ExternalAPIs ["External APIs"]
        GH_API["GitHub REST API"]
        Gemini_API["Google Gemini API"]
    end

    %% Connections
    App <-->|Requests Stars/GFI Counts| API
    API <-->|Rate-limited Proxied Calls| GH_API
    MentorScript -.->|Scrapes GSoC Ideas URLs| ExternalAPIs
    IssueScript -.->|Fetches GFIs| GH_API
    OrgData -.->|Consumed by| App
    MentorData -.->|Consumed by| App
    IssueData -.->|Consumed by| App
    TenetAgent <-->|Submits review prompts| Gemini_API
    TenetAgent <-->|Gets diffs / Posts comments| GH_API
```

---

## 📁 Folder & Module Responsibilities

This repository operates on a **zero-build, static-first** architectural philosophy. Here is a breakdown of the key files and directories:

| Directory/File | Responsibility | Key Files / Logic |
| :--- | :--- | :--- |
| **`index.html`** | Main Single Page Application | Structures the entire dashboard, details modals, analytics view, and standard layouts. |
| **`src/styles.css`** | Application Stylesheet | Responsive styling across three breakpoints (phone, tablet, desktop). Includes the variables and dark/light color systems. |
| **`src/js/app.js`** | Main Application Controller | Coordinates search, filtering algorithms, countdown timer, detail modals, and dashboard event listener wiring. |
| **`src/js/org.js`** | Organization Data Layer | The static database containing 184 GSoC organizations, their domains, tags, competition metrics, and metadata. |
| **`src/js/recommender.js`** | AI Recommender Engine | Scores and recommends matching organizations based on user skills, topics, and GitHub profiles. |
| **`src/js/badges-mvp.js`** | Gamification Badge System | Tracks user explore/compare metrics in `localStorage` and rewards achievements via non-blocking toast animations. |
| **`api/github.js`** | Vercel Edge Serverless Function | Proxies all client-side calls to the GitHub API, handling rate-limiting and hiding token values. Caches outputs for 1 hour. |
| **`agent/scripts/`** | Automation & Maintenance Scripts | Helper scripts for scraping, cache updates, and ideas URL format verification. |
| **`agent/tenet_agent/`** | TENET Pull Request Security Reviewer | Python AI agent leveraging Google Gemini Flash (`gemini-2.5-flash`) to automatically review PR diffs and flag vulnerabilities. |
| **`data/`** | Cached JSON Data Store | Holds caches like `mentors.json` (extracted mentor handles) and `issues.json` (good first issues index). |
| **`.github/workflows/`** | CI/CD & Automation System | A suite of 37 workflows governing PR stage management, stale PR checks, mentor rotations, and assignment queues. |

---

## 🎯 Core Features

### 🔍 Discovery & Filtering
*   🔎 **Full-Text Search** — Instantly search across 184 organizations by name, technology stack, topics, or domains.
*   🏷️ **Domain Filtering** — Fast categorization under Web, Science, Operating Systems, Security, AI, Data, Infrastructure, Dev Tools, and more.
*   💻 **Multi-Select Tech Stack Pills** — Stack multiple languages (Rust, Python, Go, C++, etc.) for combined target matching.
*   ⚡ **Smart Filters** — Filter by Veterans (long-term GSoC participants), Newcomers, High/Low competition, and Actively Maintained.
*   📊 **Flexible Sorting** — Alphabetical, GSoC Experience, Newcomer-Friendly, Competition Level, Star Count, and Good First Issues availability.

### 📊 Live GitHub Metrics Integration
*   🌟 **Live GitHub Stats** — Stars, Forks, Open Issues, and Last Commit dates fetched on demand through `/api/github.js`.
*   🟢 **Good First Issues Tracker** — Sort and filter organizations by their beginner-friendly issue counts.
*   🎖️ **Activity Indicators** — Highlights repos as Active, Moderate, or Low based on commits to identify responsive organizations.
*   🔗 **Smart Repo Routing** — Detects single-project orgs (routing straight to the repo) vs umbrella orgs (routing to the GitHub organization portal).

### ⚖️ Comparison Mode
*   🏆 Select up to **3 organizations** to analyze side-by-side.
*   📊 Side-by-side review of domain category, GSoC history, competition pace, stars, forks, open issues, active commits, and language compatibility.
*   🟢 Green and 🔴 red highlights automatically flag best and worst values in each metric category.

### ⏱️ Deadline Countdown
*   ⏰ A dynamic navbar countdown alert showing days remaining until the GSoC student application window opens (March 16, 2026).
*   🔄 Automatically updates to display "Applications Closing In" during the open application window (March 16 - April 8).

### ⌨️ Keyboard Accessibility
*   `↑ ↓ ← →` — Seamlessly shift focus across card selections.
*   `Enter` — Open detail modal for the currently selected card.
*   `C` — Toggle comparison inclusion of the card.
*   `Esc` — Close modal panels.

---

## 🛠️ Tech Stack

| Component | Architecture & Technologies |
| :--- | :--- |
| **Frontend UI** | Vanilla HTML5 / Vanilla CSS3 / Modern ES Modules |
| **Hosting** | Vercel Static Hosting |
| **Serverless API** | Vercel Edge Serverless Function (`api/github.js`) |
| **Data Layers** | Static JSON, local storage analytics, and live GitHub REST proxies |
| **AI PR Agent** | Python / Google Gemini 2.5 Flash / GitHub Actions Runner |

---

## 🚀 Local Development & Quick-Start

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   A [GitHub Personal Access Token (PAT)](https://github.com/settings/tokens) (No scopes required except `public_repo` to prevent API rate limits).

### 1. Clone & Setup
```bash
git clone https://github.com/S3DFX-CYBER/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or set environment variables in your terminal) to allow live stats and Good First Issues page to load:
```env
GITHUB_TOKEN=ghp_your_personal_access_token_here
```

### 3. Running Locally

#### Option A: Lightweight Dev (No API proxy)
You can open `index.html` directly in your browser. Live GitHub stats will not load, but all static filters and organization comparisons will work fully:
```bash
# On macOS
open index.html
# On Windows (PowerShell)
Start-Process index.html
```

#### Option B: Full Edge Dev (Simulates live stats APIs)
To test Vercel Edge Serverless function features locally:
1. Install [Vercel CLI](https://vercel.com/cli) globally:
   ```bash
   npm install -g vercel
   ```
2. Link project and start dev server:
   ```bash
   vercel dev
   ```
This maps the client interface to `http://localhost:3000` and enables `/api/github` serverless proxy endpoints.

---

## 🔌 API Reference (`/api/github.js`)

The `/api/github.js` serverless function acts as a proxy to retrieve public data safely.

| Endpoint | Query Parameters | Description |
| :--- | :--- | :--- |
| `GET /api/github` | `?repo=owner/repo` | Returns stars, forks, open issues, last commit text, and commit activity speed. |
| `GET /api/github` | `?repo=owner/repo&gfi=1` | Fast endpoint to fetch Good First Issues count (cached separately). |
| `GET /api/github` | `?repo=owner/repo&gfi=1&issues=1` | Returns details on up to 30 active Good First Issues. |
| `GET /api/github` | `?user=username` | Parses public user profiles to feed recommendations in the Recommender tool. |

> [!NOTE]
> All external GitHub API outputs are cached on the Vercel Edge CDN for **1 hour** to keep page loads fast and comply with rate limit policies.

---

## 🔒 URL Validation

All ideas links must match strict security formatting before inclusion in `src/js/org.js`. Contributors should run the safety check prior to opening a PR:
```bash
node agent/scripts/validate-ideas-urls.js
```
The script runs checks to confirm:
*   ✅ Safe protocols only (`http` or `https`).
*   ✅ Formal URL construction.
*   ⚠️ Detection of placeholders or generic GSoC umbrella URLs.

---

## 🐛 Troubleshooting & FAQ

#### Live GitHub Stats (Stars, Forks, GFIs) display "—" or fail to load?
*   **Cause:** Your local dev server has exceeded the GitHub anonymous API rate limit (60 requests per hour).
*   **Fix:** Ensure you have created a Personal Access Token and successfully exposed `GITHUB_TOKEN` to your terminal environment or `.env` file before running `vercel dev`.

#### Local dev proxy function yields an internal server error?
*   **Cause:** Unlinked Vercel context or local port conflict.
*   **Fix:** Run `vercel link` followed by `vercel dev` again to synchronize configuration bindings.

#### My organization ideas URL is marked as placeholder?
*   **Cause:** The URL matches typical generic templates (e.g. `summerofcode.withgoogle.com`).
*   **Fix:** Replace it with the specific project ideas markdown file, wiki page, or dedicated site hosted by that organization.

---

## 🤝 Contributing & PR Review Pipeline

We welcome contributions! Please review our [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

### 🚦 The 3-Stage PR Pipeline

All pull requests pass through three review stages before merge:

| Stage | Evaluator | Focus |
| :--- | :--- | :--- |
| **Stage 1** | Automated Workflows | Validates Developer Certificate of Origin (DCO), verifies formatting, duplicate PR scans, and executes the **TENET AI Agent** security diff audit. |
| **Stage 2** | Program Mentors | Conducts human code reviews, validates functionality, checks vanilla alignment, and verifies responsive layouts. |
| **Stage 3** | Project Admin | Final administrative validation, code synchronization, and official merge decisions. |

> [!IMPORTANT]
> The automated Stage 1 checks must fully pass before mentors are assigned. Keep commits tidy, always sign off using `git commit -s`, and reference a valid issue (`Closes #123`).

---

## 👥 Project Admin & GSSoC Mentors

### 🔑 Project Admin
<a href="https://github.com/S3DFX-CYBER"><img src="https://github.com/S3DFX-CYBER.png" width="80px" alt="S3DFX-CYBER" style="border-radius: 50%;" /></a>  
**[@S3DFX-CYBER](https://github.com/S3DFX-CYBER)** — Project Admin for GSSoC'26 and NSoC'26. Responsible for final merge decisions, mentor coordination, and code quality.

### 👥 GSSoC Mentors
These mentors guide contributors and review code changes:

<!-- GSSOC_MENTORS_START -->
<a href="https://github.com/12fahed"><img src="https://github.com/12fahed.png" width="40px" alt="12fahed" /></a>
<a href="https://github.com/4f4d"><img src="https://github.com/4f4d.png" width="40px" alt="4f4d" /></a>
<a href="https://github.com/aanjalii01"><img src="https://github.com/aanjalii01.png" width="40px" alt="aanjalii01" /></a>
<a href="https://github.com/adithyan-css"><img src="https://github.com/adithyan-css.png" width="40px" alt="adithyan-css" /></a>
<a href="https://github.com/AditthyaSS"><img src="https://github.com/AditthyaSS.png" width="40px" alt="AditthyaSS" /></a>
<a href="https://github.com/AnirbansarkarS"><img src="https://github.com/AnirbansarkarS.png" width="40px" alt="AnirbansarkarS" /></a>
<a href="https://github.com/AnirudhPhophalia"><img src="https://github.com/AnirudhPhophalia.png" width="40px" alt="AnirudhPhophalia" /></a>
<a href="https://github.com/anubhavxdev"><img src="https://github.com/anubhavxdev.png" width="40px" alt="anubhavxdev" /></a>
<a href="https://github.com/Anushreebasics"><img src="https://github.com/Anushreebasics.png" width="40px" alt="Anushreebasics" /></a>
<a href="https://github.com/aryanbhutani26"><img src="https://github.com/aryanbhutani26.png" width="40px" alt="aryanbhutani26" /></a>
<a href="https://github.com/ayu-yishu13"><img src="https://github.com/ayu-yishu13.png" width="40px" alt="ayu-yishu13" /></a>
<a href="https://github.com/Ayush-Patel-56"><img src="https://github.com/Ayush-Patel-56.png" width="40px" alt="Ayush-Patel-56" /></a>
<a href="https://github.com/Ayushh-Sharmaa"><img src="https://github.com/Ayushh-Sharmaa.png" width="40px" alt="Ayushh-Sharmaa" /></a>
<a href="https://github.com/Balaji91221"><img src="https://github.com/Balaji91221.png" width="40px" alt="Balaji91221" /></a>
<a href="https://github.com/BandhiyaHardik"><img src="https://github.com/BandhiyaHardik.png" width="40px" alt="BandhiyaHardik" /></a>
<a href="https://github.com/coder-zs-cse"><img src="https://github.com/coder-zs-cse.png" width="40px" alt="coder-zs-cse" /></a>
<a href="https://github.com/CoderOggy78"><img src="https://github.com/CoderOggy78.png" width="40px" alt="CoderOggy78" /></a>
<a href="https://github.com/deepak0x"><img src="https://github.com/deepak0x.png" width="40px" alt="deepak0x" /></a>
<a href="https://github.com/deepaksinghh12"><img src="https://github.com/deepaksinghh12.png" width="40px" alt="deepaksinghh12" /></a>
<a href="https://github.com/DevROHIT11"><img src="https://github.com/DevROHIT11.png" width="40px" alt="DevROHIT11" /></a>
<a href="https://github.com/Haile-12"><img src="https://github.com/Haile-12.png" width="40px" alt="Haile-12" /></a>
<a href="https://github.com/itsdakshjain"><img src="https://github.com/itsdakshjain.png" width="40px" alt="itsdakshjain" /></a>
<a href="https://github.com/JoeCelaster"><img src="https://github.com/JoeCelaster.png" width="40px" alt="JoeCelaster" /></a>
<a href="https://github.com/kallal79"><img src="https://github.com/kallal79.png" width="40px" alt="kallal79" /></a>
<a href="https://github.com/KaranGupta2005"><img src="https://github.com/KaranGupta2005.png" width="40px" alt="KaranGupta2005" /></a>
<a href="https://github.com/knoxiboy"><img src="https://github.com/knoxiboy.png" width="40px" alt="knoxiboy" /></a>
<a href="https://github.com/Kota-Jagadeesh"><img src="https://github.com/Kota-Jagadeesh.png" width="40px" alt="Kota-Jagadeesh" /></a>
<a href="https://github.com/KUMARNiru007"><img src="https://github.com/KUMARNiru007.png" width="40px" alt="KUMARNiru007" /></a>
<a href="https://github.com/lourduradjou"><img src="https://github.com/lourduradjou.png" width="40px" alt="lourduradjou" /></a>
<a href="https://github.com/lovestaco"><img src="https://github.com/lovestaco.png" width="40px" alt="lovestaco" /></a>
<a href="https://github.com/magic-peach"><img src="https://github.com/magic-peach.png" width="40px" alt="magic-peach" /></a>
<a href="https://github.com/Manan-Chawla"><img src="https://github.com/Manan-Chawla.png" width="40px" alt="Manan-Chawla" /></a>
<a href="https://github.com/Maxd646"><img src="https://github.com/Maxd646.png" width="40px" alt="Maxd646" /></a>
<a href="https://github.com/MAYANKSHARMA01010"><img src="https://github.com/MAYANKSHARMA01010.png" width="40px" alt="MAYANKSHARMA01010" /></a>
<a href="https://github.com/Mohit-368"><img src="https://github.com/Mohit-368.png" width="40px" alt="Mohit-368" /></a>
<a href="https://github.com/morningstarxcdcode"><img src="https://github.com/morningstarxcdcode.png" width="40px" alt="morningstarxcdcode" /></a>
<a href="https://github.com/Mrigakshi-Rathore"><img src="https://github.com/Mrigakshi-Rathore.png" width="40px" alt="Mrigakshi-Rathore" /></a>
<a href="https://github.com/MUKUL-PRASAD-SIGH"><img src="https://github.com/MUKUL-PRASAD-SIGH.png" width="40px" alt="MUKUL-PRASAD-SIGH" /></a>
<a href="https://github.com/Neilblaze"><img src="https://github.com/Neilblaze.png" width="40px" alt="Neilblaze" /></a>
<a href="https://github.com/nihalawasthi"><img src="https://github.com/nihalawasthi.png" width="40px" alt="nihalawasthi" /></a>
<a href="https://github.com/oasis-parzival"><img src="https://github.com/oasis-parzival.png" width="40px" alt="oasis-parzival" /></a>
<a href="https://github.com/piyushdotcomm"><img src="https://github.com/piyushdotcomm.png" width="40px" alt="piyushdotcomm" /></a>
<a href="https://github.com/Precise-Goals"><img src="https://github.com/Precise-Goals.png" width="40px" alt="Precise-Goals" /></a>
<a href="https://github.com/preetbiswas12"><img src="https://github.com/preetbiswas12.png" width="40px" alt="preetbiswas12" /></a>
<a href="https://github.com/rounakkraaj-1744"><img src="https://github.com/rounakkraaj-1744.png" width="40px" alt="rounakkraaj-1744" /></a>
<a href="https://github.com/sabeenaviklar"><img src="https://github.com/sabeenaviklar.png" width="40px" alt="sabeenaviklar" /></a>
<a href="https://github.com/Sagar-Datkhile"><img src="https://github.com/Sagar-Datkhile.png" width="40px" alt="Sagar-Datkhile" /></a>
<a href="https://github.com/Satya900"><img src="https://github.com/Satya900.png" width="40px" alt="Satya900" /></a>
<a href="https://github.com/saurabh24thakur"><img src="https://github.com/saurabh24thakur.png" width="40px" alt="saurabh24thakur" /></a>
<a href="https://github.com/Shravanthi20"><img src="https://github.com/Shravanthi20.png" width="40px" alt="Shravanthi20" /></a>
<a href="https://github.com/sparshagarwal0411"><img src="https://github.com/sparshagarwal0411.png" width="40px" alt="sparshagarwal0411" /></a>
<a href="https://github.com/SparshM8"><img src="https://github.com/SparshM8.png" width="40px" alt="SparshM8" /></a>
<a href="https://github.com/stealthwhizz"><img src="https://github.com/stealthwhizz.png" width="40px" alt="stealthwhizz" /></a>
<a href="https://github.com/subratamondalnsec"><img src="https://github.com/subratamondalnsec.png" width="40px" alt="subratamondalnsec" /></a>
<a href="https://github.com/Suvanwita"><img src="https://github.com/Suvanwita.png" width="40px" alt="Suvanwita" /></a>
<a href="https://github.com/SyedImtiyaz-1"><img src="https://github.com/SyedImtiyaz-1.png" width="40px" alt="SyedImtiyaz-1" /></a>
<a href="https://github.com/TarunyaProgrammer"><img src="https://github.com/TarunyaProgrammer.png" width="40px" alt="TarunyaProgrammer" /></a>
<a href="https://github.com/thakurutkarsh22"><img src="https://github.com/thakurutkarsh22.png" width="40px" alt="thakurutkarsh22" /></a>
<a href="https://github.com/uddalak2005"><img src="https://github.com/uddalak2005.png" width="40px" alt="uddalak2005" /></a>
<a href="https://github.com/vanshaggarwal07"><img src="https://github.com/vanshaggarwal07.png" width="40px" alt="vanshaggarwal07" /></a>
<!-- GSSOC_MENTORS_END -->

---

## 📅 GSoC 2026 Key Dates

| Date | Milestone |
| :--- | :--- |
| **February 2026** | GSoC 2026 Accepted Organizations announced |
| **March 16, 2026** | **GSoC Student applications open** |
| **March 31, 2026** | **GSoC Application submission deadline** |
| **April 30, 2026** | Accepted GSoC student proposals announced |
| **May – November 2026**| Official coding and evaluation window |

---

## 📄 License

This project is licensed under the **Apache License 2.0**.
Share it with anyone preparing for GSoC! 🚀
