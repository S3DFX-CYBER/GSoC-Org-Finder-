# Contributing Guide

## Program-Specific Guides

If you are contributing under a specific program, refer to the dedicated guide for your track:

| Track | Guide |
|-------|-------|
| GSSoC'26 Contributors | [GSSoC Contributor Guide](docs/GSSOC_CONTRIBUTOR_GUIDE.md) |
| GSSoC'26 Mentors | [GSSoC Mentor Guide](docs/GSSOC_MENTOR_GUIDE.md) |
| NSoC'26 Contributors | [NSoC Guide](docs/NSOC_GUIDE.md) |
| General Contributors | [General Contributor Guide](docs/GENERAL_CONTRIBUTOR_GUIDE.md) |

The rest of this document covers the shared rules, architecture, and workflow that apply to **all** contributors regardless of program.

---

## Project Philosophy

This repository follows a **zero-build, zero-dependency** philosophy.

### Principles

- No build tools
- No unnecessary dependencies
- Minimal runtime overhead
- Simple, readable, maintainable code
- Fast client-side performance
- Minimal API usage wherever possible

When contributing, avoid introducing libraries, frameworks, bundlers, or unnecessary abstractions unless they are clearly justified.

---

## Architecture

The project is built using **Vanilla HTML/CSS/JavaScript + Vercel Edge Functions**.

### Core Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Frontend  | Vanilla HTML/CSS/JS         |
| Hosting   | Vercel                      |
| Backend   | Vercel Edge Functions       |
| Data      | Static JSON + GitHub API    |
| Analytics | localStorage only           |

### Architecture Goals

- Lightweight runtime
- No build process
- Edge-compatible APIs
- Fast initial page load
- Fully static-first deployment

All contributions should remain compatible with the existing architecture.

---

## Local Development

### Install Vercel CLI

```bash
npm install -g vercel
```

### Clone Repository

```bash
git clone https://github.com/S3DFX-CYBER/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-
```

### Run Local Development Server

```bash
vercel dev
```

This simulates the Vercel Edge runtime locally.

---

## Repository Structure

```
GSoC-Org-Finder-
├── api/
│   └── github.js
├── agent/
│   ├── scripts/
│   └── tenet_agent/
├── data/
├── src/
│   ├── js/
│   ├── assets/
│   └── styles.css
├── index.html
├── sw.js
└── README.md
```

---

## How to Start Contributing

### Step 1 — Find an Issue

Go to the repository **Issues** tab and filter using labels:

- `level:beginner`
- `level:intermediate`
- `level:advanced`
- `gssoc26`
- `nsoc26`
- `type:bug`, `type:ui`, `type:api`, `type:docs`, `type:enhancement`

New issues are **automatically triaged by our AI bot** which applies difficulty, type, and program labels. You can filter by these to find issues matching your skill level.

---

### Step 2 — Request Assignment

Comment with your program:

```
/assign gssoc
```

or

```
/assign nsoc
```

Your request will be processed by the assignment bot.

---

### Step 3 — Assignment Processing

This repository uses a **tiered auto-assignment system** on verified issues:

| Issue Level | Labels | Auto-Assignment Rule |
|-------------|--------|---------------------|
| **Beginner** | `level:beginner` | Anyone can self-assign immediately — no restrictions |
| **Intermediate** | `level:intermediate` | Account must be at least **30 days old** |
| **Advanced** | `level:advanced` | Must have at least **1 merged PR** in this repo |

- **Verified issues**: If you meet the level requirement, you are assigned instantly
- **Unverified issues**: A maintainer approves via `/approve-assignment`
- **If you don't meet the requirement**: Your request is queued for maintainer approval

> **Do NOT start work before assignment is confirmed.**

---

## 🤖 Smart Assignment System

This repository uses a **tiered auto-assignment system** with maintainer fallback for unverified issues.

### Supported Commands

| Command | Who | Action |
|---------|-----|--------|
| `/assign gssoc` | Contributors | Request assignment under GSSoC |
| `/assign nsoc` | Contributors | Request assignment under NSoC |
| `/unassign` | Contributors | Remove your assignment |
| `unassign me` | Contributors | Remove your assignment |
| `/approve-assignment` | Maintainers | Auto-select assignee by timestamp + workload |
| `/approve-assignment @user` | Maintainers | Manually approve a specific user |

### How Auto-Assignment Works

On **verified issues** (labeled `verified` or `ready-for-assignment`):

- If you meet the level eligibility requirement, you are assigned instantly
- If you don't meet the requirement, your request is queued for maintainer approval

On **unverified issues**, all requests go through maintainer approval.

### How Smart Selection Works (Maintainer Approval)

When a maintainer uses `/approve-assignment` without specifying a user, the system:

1. Finds all assignment requests on the issue (sorted by timestamp)
2. Checks each requester's current workload
3. Assigns the first eligible user (fewest active issues, earliest request)

---

## 📌 Program Declaration

Contributors should mention their contribution track when requesting assignment:

- **GSSoC** — GirlScript Summer of Code participants
- **NSoC** — Nexus Spring of Code participants
- **General** — Independent contributors (no program affiliation)

**Examples:**

> I want to work on this issue under GSSoC.

> I would like to contribute under NSOC.

> I would like to work on this issue as a general contributor.

General contributors do not need to declare a program but must still follow the assignment process.

---

## ⏳ GSSoC Assignment Timeline

GSSoC issue assignments opened **15 May 2026, 12:00 AM IST**.

NSoC contributors are unaffected by this restriction.

---

## 🧠 AI-Powered Issue Triage

Every new issue is automatically analyzed by the **LLM Issue Triage Bot** which:

- Classifies difficulty: `level:beginner`, `level:intermediate`, `level:advanced`
- Assigns type: `type:bug`, `type:enhancement`, `type:ui`, `type:docs`, `type:api`
- Detects program context: `program:gssoc`, `program:nsoc`
- Checks for **duplicates** against all open issues
- Flags spam and low-quality issues

Existing untriaged issues are processed weekly (up to 20 per run).

Issues flagged as spam or duplicates may be automatically labeled and closed.

---

## 🚫 Self-Assignment Restriction

Do **NOT** self-assign issues using the GitHub UI.

Assignments are handled **ONLY** through the automation workflow.

Manual self-assignment may be removed automatically.

---

## 📌 Maximum Active Assignments

To maintain fairness, contributors may only hold a limited number of issues:

| Program | Max Active Issues |
|---------|-------------------|
| GSSoC | 3 |
| NSoC | 3 |

The assignment bot automatically checks this. If you've reached your limit, new assignments will be rejected until you complete or unassign existing issues.

---

## 🔄 PR Consolidation Rule

Contributors are encouraged to combine:

- 1–2 related fixes
- Small connected improvements

into a **single focused PR** instead of opening many tiny PRs.

Low-effort PR spam may be rejected.

---

## ✍️ Developer Certificate of Origin (DCO)

This repository enforces the Developer Certificate of Origin (DCO).

By submitting a contribution, you certify that:

- You wrote the code/content yourself, or
- You have the legal right to contribute it

Every commit must be signed off.

### How to sign commits

Use:

```bash
git commit -s -m "feat: add search improvements"
```
---
## 🔕 Maintainer Ping Policy

Please avoid repeatedly pinging maintainers for:
- issue assignment
- PR reviews
- label updates
- merge requests
- priority escalation

Maintainers review contributions in queue order whenever possible.

Excessive pinging, spam comments, or DM requests may result in:
- comment deletion
- temporary assignment removal
- spam labeling for repeated abuse

Please allow reasonable review time before following up.

Recommended wait times:
- Issue assignment: Instant (auto-assign) to 24 hours (manual approval)
- Mentor review: **24 hours** (mentors auto-rotate if inactive)
- Maintainer review: 24–72 hours

----

## Contribution Levels

### 🟢 Beginner (`level:beginner`)

Open to everyone — no restrictions.

**Examples:**

- UI improvements
- Small bug fixes
- Accessibility improvements
- Documentation improvements
- Responsive tweaks

---

### 🟡 Intermediate (`level:intermediate`)

Requires a GitHub account at least **30 days old** for auto-assignment.

**Examples:**

- Filtering logic
- Analytics improvements
- Caching improvements
- Sorting/search enhancements
- API improvements

---

### 🔴 Advanced (`level:advanced`)

Requires at least **1 merged PR** in this repository.

**Examples:**

- Architecture changes
- Performance optimization
- Security-sensitive logic
- Major backend improvements

The assignment bot automatically validates eligibility based on these rules.

---

## ⚠️ NSoC'26 & GSSoC'26 Contribution Standards

This project officially participates in:

- **NSoC'26**
- **GSSoC'26**

All contributors must maintain contribution quality and fairness.

---

## Assignment Priority Policy

Issue assignments are granted only when the contributor is currently eligible under repository rules.

Commenting first does not reserve or guarantee assignment ownership.

If another eligible contributor claims the issue earlier, the assignment may be granted to them instead.

---

## ❌ Strictly Prohibited

The following may result in rejection or disqualification:

- AI-generated PRs without understanding
- Fake complexity
- Meaningless documentation spam
- Multiple tiny PRs
- Copied contributions
- Template spam
- Low-quality PR farming
- Claiming issues without intention to work
- Opening duplicate PRs/issues
- Unnecessary dependency additions

---

## ✅ What Makes a Good Contribution

Strong contributions usually include:

- Meaningful bug fixes
- Useful features
- Performance improvements
- Accessibility improvements
- Maintainable refactors
- High-quality documentation improvements
- Responsive/mobile improvements
- Testing improvements

Before opening a PR ask:

> Does this meaningfully improve the project?

---

## Pull Request Workflow

### Before Opening a PR

Ensure:

- Issue is assigned to you
- Work is complete
- Changes are tested
- PR follows the template

---

## 🔗 Linking Issues is Mandatory

Your PR **MUST** include:

```
Closes #issue-number
```

PRs without linked issues may be automatically closed.

---

## 🧾 Required PR Templates

Contributors **MUST** use the proper template for their track:

- GSSoC PR Template — for GSSoC participants
- NSoC PR Template — for NSoC participants
- General PR Template — for independent contributors

The validation bot checks for:

- Related issue section
- Testing section
- Checklist
- Program declaration
- Conventional commit title format

Missing sections may trigger warnings.

---

## Conventional Commit Format

### Format

```
type: short description
```

### Examples

```
feat: improve mobile responsiveness
fix: resolve issue modal overflow
docs: update contribution guide
refactor: simplify issue filtering
```

---

### Common Commit Types

| Type       | Description             |
|------------|-------------------------|
| `feat`     | New feature             |
| `fix`      | Bug fix                 |
| `docs`     | Documentation           |
| `style`    | Styling/UI              |
| `refactor` | Internal cleanup        |
| `perf`     | Performance             |
| `ci`       | Workflow/configuration  |
| `chore`    | Maintenance             |

---

## 📋 PR Checklist

Before submitting:

- [ ] Issue is assigned to me
- [ ] PR links an issue using `Closes #N`
- [ ] I mentioned my contribution program
- [ ] No unnecessary dependencies added
- [ ] Changes are minimal and focused
- [ ] Code follows repository architecture
- [ ] I tested the changes locally
- [ ] I understand the code I submitted

For UI changes:

- [ ] Screenshots attached

---

## 🧪 Testing

Before submitting:

```bash
vercel dev
```

Verify:

- Edge functions work
- No build step introduced
- No broken UI
- Responsive layout works
- Existing functionality remains stable

---

## 🔍 Review Process (3-Stage Pipeline)

PRs go through a **3-stage pipeline**:

| Stage | Reviewer | Checks | Labels |
|-------|----------|--------|--------|
| **Stage 1** — Automated | Bot | DCO sign-off, format, AI/slop detection, duplicate, **LLM context analysis** | `stage-1-approved` on pass |
| **Stage 2** — Mentor Review | Mentor | Code quality, relevance, correctness | `needs-mentor-review` → `mentor-approved` + `pa-review-required` |
| **Stage 3** — Maintainer Gate | Project Admin | Final merge decision | `pa-approved` |

Stage 2 is blocked until Stage 1 passes. Stage 3 is blocked until Stage 2 passes.

### LLM PR Analysis (Stage 1)

The **LLM PR Analysis** bot automatically verifies that your PR:
- Links to a valid issue
- Actually addresses the linked issue
- Does not include out-of-scope changes
- Is not AI-generated spam (cross-checked with LLM verification)

### Mentor Review (Stage 2)

1. After Stage 1 passes, mentors are automatically assigned from the mentor pool
2. Labels `needs-mentor-review` and `mentor-review-requested` are applied
3. Mentors have **24 hours** to review — if they don't respond, they are automatically replaced with another active mentor
4. Mentors approve via GitHub review approval or by commenting `/approve-pr` or `/lgtm`
5. The bot then applies `mentor-approved` and `pa-review-required`, notifying the maintainer

### Maintainer Gate (Stage 3)

The maintainer reviews PRs labeled `pa-review-required` and merges when satisfied.

Maintainers may:

- Request changes
- Relabel issues/PRs
- Reject low-quality submissions
- Close spam/AI-slop PRs

---

## 🤖 Automation Features

The repository includes automated workflows for:

- **LLM Issue Triage** — AI-powered classification, duplicate detection, spam filtering
- **LLM PR Analysis** — Validates PR context, linked issue, scope
- **AI Slop Detection** — Flags low-quality/AI-generated PRs with LLM cross-verification before auto-closing
- **Tiered auto-assignment** — Level-based eligibility checks (beginner: open, intermediate: 30-day account, advanced: merged PR)
- **Mentor review with 24h timeout** — Auto-rotation of inactive reviewers
- **3-stage PR pipeline** — Automated → Mentor → Maintainer gate
- DCO sign-off verification
- PR format and diff size validation
- PR size labeling (XS/S/M/L/XL)
- Stale PR cleanup (auto-close after 14 days of inactivity with unresolved Stage 1 failures)
- GSSoC/NSoC leaderboard (updates on merge only)
- Contribution program validation

---

## 📌 Inactivity Policy

Assigned issues with no meaningful progress for **7 days** will be automatically unassigned.

"Progress" means:
- Posting a comment on the issue, OR
- Opening a non-draft PR linked to the issue (with `Closes #N` or `Fixes #N`)

Maintainers and collaborators with write access are **exempt** from auto-unassignment.

After being unassigned, you must wait **24 hours** before re-requesting the issue.

---

## Need Help?

If you need help:

- Open a **GitHub Issue**
- Use **GitHub Discussions**
- Join our **Discord community**

---

## Final Notes

This repository prioritizes:

- Quality over quantity
- Meaningful contributions
- Maintainable code
- Fair contributor practices

Not all PRs are guaranteed to be merged.

Thank you for contributing to FindMyGSoC 🚀
