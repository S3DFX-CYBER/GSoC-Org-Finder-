# Contributing Guide

## Project Philosophy

This repository follows a **zero-build, zero-dependency philosophy**.

### Principles

* No build tools
* No unnecessary dependencies
* Minimal runtime overhead
* Simple and readable code

When contributing, avoid adding libraries, bundlers, or complex tooling **unless clearly justified**.

---

## Architecture

The project is built using **Vercel Edge Functions**.

### Key Characteristics

* Serverless execution at the edge
* Fast global responses
* Minimal backend infrastructure
* Lightweight runtime environment

Changes should remain compatible with the **Edge Function architecture**.

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

### Run Locally

```bash
vercel dev
```

This command simulates the Vercel environment locally.

---

## How to Start Contributing

1. Go to the **Issues** tab
2. Filter by issue labels (`level-1`, `level-2`, `level-3`)
3. Comment one of the following on the issue:

   * `/assign`
   * `assign me`
4. Wait for the assignment bot response
5. Start working **only after the issue is assigned to you**

---

## 🤖 Automated Assignment System

This repository uses an automated assignment workflow.

### Supported Commands

| Command       | Action                     |
| ------------- | -------------------------- |
| `/assign`     | Request assignment         |
| `assign me`   | Request assignment         |
| `/unassign`   | Remove yourself from issue |
| `unassign me` | Remove yourself from issue |

### Assignment Rules

Before assigning an issue, the bot automatically checks:

* Issue title quality
* Issue description quality
* Existing assignees
* Contribution level requirements
* Contributor PR history for advanced issues

### Level Restrictions

* `level-1` → Open to everyone
* `level-2` → Requires intermediate understanding
* `level-3` → Requires at least **1 merged PR** in this repository

If requirements are not met, the bot will explain why assignment was rejected.

### Inactive Policy

To keep issues active and fair for contributors:

* Assigned issues with **no progress for 2–3 days** may be automatically unassigned
* Other contributors may then claim the issue
* Maintainers may manually override assignments when necessary

### Important Notes

* Do **not** ping maintainers for assignment
* Do **not** self-assign issues through GitHub UI
* Assignment is handled only through the bot workflow

PRs opened without assignment may be closed without review.

---

## Contribution Workflow

1. Fork the repository
2. Create a branch from `main`
3. Make your changes
4. Commit your work
5. Push to your fork
6. Open a Pull Request

### Create Branch

```bash
git checkout -b feature/short-description
```

---

## Commit Message Convention

### Format

```text
type: short description
```

### Examples

```text
docs: add contributing guide
fix: correct edge function handler
feat: improve request validation
```

### Common Types

| Type       | Description           |
| ---------- | --------------------- |
| `docs`     | Documentation updates |
| `fix`      | Bug fixes             |
| `feat`     | New features          |
| `refactor` | Internal improvements |

---

## Contribution Levels

### Level 1 — Beginner Friendly

Open to all contributors. Ideal for first-time contributors.

Includes:

* UI fixes
* Minor bugs
* Documentation updates (with meaningful new content)

### Level 2 — Intermediate

Requires understanding of the codebase.

Includes:

* Logic improvements
* Feature enhancements
* Performance tweaks

### Level 3 — Advanced *(Restricted)*

Only for experienced contributors.

Requirements:

* At least **1 merged PR** in this repository
* Understanding of repository architecture
* Ability to work with Edge Functions and internal logic

Includes:

* Core features
* Architecture changes
* Complex optimizations
* Security-sensitive logic

> The assignment bot automatically validates Level 3 eligibility.

---

## ⚠️ NSoC'26 & GSSoC'26 Contribution Quality Standards

This project participates in **NSoC'26** and **GSSoC'26**. All contributors are required to maintain fairness, integrity, and quality in every submission.

These standards are actively enforced.

### Strictly Prohibited

The following may result in PR rejection, label correction, or contribution disqualification:

* Assigning high-level labels to trivial work
* PRs with tiny changes presented as major contributions
* Multiple low-effort documentation-only PRs
* PRs with no meaningful impact
* Merging without proper review/testing

### What Makes a Valid Contribution

Before opening a PR, ask:

> "Does this meaningfully improve the project for users or maintainers?"

Valid contributions include:

* Bug fixes with reproducible cases
* Scoped feature implementations
* Performance improvements
* Readability refactors with clear rationale
* Meaningful documentation improvements

### Disallowed Contributions

* AI-generated PRs submitted without understanding the code
* Spam submissions
* Copy-paste contributions
* Low-effort repeated PRs

Such PRs may be closed without detailed review.

---

## Compliance Enforcement

Failure to comply may result in:

* PR closure
* Label corrections
* Reverted merges
* Escalation to NSoC'26 moderators for repeated abuse

### For Project Admins

* Re-review merged PRs if labels appear incorrect
* Ensure changes were tested before merging
* Reject low-quality work with concise feedback
* Maintain fairness across contributors

---

## Pull Request Guidelines

* Issue must be assigned to you before opening a PR
* Reference the issue using:

```text
Closes #issue-number
```

* Keep changes minimal and focused
* Follow repository philosophy
* Do not introduce unnecessary dependencies

### PR Checklist *(Required)*

Before submitting:

* [ ] Issue is assigned to me
* [ ] PR is linked to an issue (`Closes #N`)
* [ ] No unnecessary dependencies added
* [ ] Code follows zero-build philosophy
* [ ] Changes are minimal and focused
* [ ] PR description clearly explains the change
* [ ] I understand the code I submitted

For UI changes:

* [ ] Screenshots attached

---

## Testing and Verification

Before submitting a PR, run locally:

```bash
vercel dev
```

Verify:

* Edge functions run correctly
* No build step is introduced
* No unnecessary dependencies added
* Existing functionality still works

---

## Review Process

* PRs are usually reviewed within **24–48 hours**
* Changes may be requested before approval
* Approval depends on:

  * code quality
  * simplicity
  * maintainability
  * adherence to repository philosophy

Not all PRs are guaranteed to be merged.

---

## Need Help?

If unsure about anything:

* Open an issue
* Use GitHub Discussions
* Or use our discord channel 
---

Thank you for contributing to FindMyGSoC! 🎉
