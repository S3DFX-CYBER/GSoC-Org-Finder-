# Contributing Guide

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

- `level-1`
- `level-2`
- `level-3`
- `gssoc26`
- `nsoc26`

---

### Step 2 — Request Assignment

Comment **ONE** of the following:

```
/assign
```

or

```
assign me
```

---

### Step 3 — Wait for Bot Validation

The assignment bot automatically validates:

- Issue quality
- Duplicate/spam detection
- Contributor eligibility
- Active issue count
- Contribution program
- Level restrictions

> **Do NOT start work before assignment.**

---

## 🤖 Smart Assignment System

This repository uses automated contributor management workflows.

### Supported Commands

| Command      | Action              |
|--------------|---------------------|
| `/assign`    | Request assignment  |
| `assign me`  | Request assignment  |
| `/unassign`  | Remove assignment   |
| `unassign me`| Remove assignment   |

---

## 📌 Mandatory Program Declaration

Contributors **MUST** clearly mention whether they are contributing under:

- **GSSoC**
- **NSoC**

**Example:**

> I want to work on this issue under GSSoC.

or

> I would like to contribute under NSOC.

If not mentioned, the assignment bot will reject the assignment request.

---

## ⏳ GSSoC Assignment Restriction

> **Important**

GSSoC issue assignments are only allowed after:

**15 May 2026 — 12:00 AM IST**

Before that time:

- GSSoC contributors cannot claim issues
- The bot will automatically reject assignment attempts
- Contributors will receive an automated reminder message

NSoC contributors are unaffected.

---

## 🧠 Automatic Issue Validation

The repository automatically detects and blocks:

- Duplicate issues
- AI-slop issues
- Spam reports
- Copied template spam
- Prompt leakage
- Meaningless low-quality issues
- Bot-generated issue spam

Issues may be automatically:

- Labeled
- Closed
- Redirected to original issues

---

## 🚫 Self-Assignment Restriction

Do **NOT** self-assign issues using the GitHub UI.

Assignments are handled **ONLY** through the automation workflow.

Manual self-assignment may be removed automatically.

---

## 📌 Maximum Active Assignments

To maintain fairness, contributors may only hold:

> **Maximum 3 assigned issues at once**

The assignment bot automatically checks this. If you already have 3 active issues, new assignments will be rejected until progress is made.

---

## 🔄 PR Consolidation Rule

Contributors are encouraged to combine:

- 1–2 related fixes
- Small connected improvements

into a **single focused PR** instead of opening many tiny PRs.

Low-effort PR spam may be rejected.

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
- Issue assignment: 12–24 hours
- PR review: 24–72 hours

----

## Contribution Levels

### 🟢 Level 1 — Beginner Friendly

Open to everyone.

**Examples:**

- UI improvements
- Small bug fixes
- Accessibility improvements
- Documentation improvements
- Responsive tweaks

---

### 🟡 Level 2 — Intermediate

Requires repository understanding.

**Examples:**

- Filtering logic
- Analytics improvements
- Caching improvements
- Sorting/search enhancements
- API improvements

---

### 🔴 Level 3 — Advanced

Restricted to experienced contributors.

**Requirements:**

- Minimum 1 merged PR in this repository
- Strong understanding of architecture
- Understanding of Edge Functions

**Examples:**

- Architecture changes
- Performance optimization
- Security-sensitive logic
- Major backend improvements

The assignment bot automatically validates eligibility.

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

Contributors **MUST** use the proper template:

- GSSoC PR Template
- NSoC PR Template

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

## 🔍 Review Process

PRs are reviewed based on:

- Code quality
- Maintainability
- Simplicity
- Architectural consistency
- Real project impact

Maintainers may:

- Request changes
- Relabel issues/PRs
- Reject low-quality submissions
- Close spam/AI-slop PRs

---

## 🤖 Automation Features

The repository includes automated workflows for:

- Smart issue assignment
- Duplicate issue detection
- AI-slop filtering
- PR validation
- Unresolved review tracking
- Automatic labeling
- Contribution program validation
- Project board automation
- Cache/data refresh workflows

---

## 📌 Inactivity Policy

Assigned issues with no meaningful progress for **2–3 days** may be automatically unassigned.

This helps keep issues available for active contributors.

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
