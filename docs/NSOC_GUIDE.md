# NSoC'26 (Nexus Spring of Code) Guide

Welcome to the **Nexus Spring of Code 2026** contribution track for FindMyGSoC!

NSoC (Nexus Spring of Code) is an open-source program by Nirmaan Organization that connects contributors with real-world projects. It provides mentorship, community support, and recognition for meaningful open-source contributions.

**Official Website:** [https://www.nsoc.in/](https://www.nsoc.in/)

---

## What is NSoC?

Nexus Spring of Code is a program designed to:

- Introduce contributors to open-source development
- Provide structured mentorship and project guidance
- Recognize contributions through certificates and rewards
- Build a supportive community of developers

---

## Getting Started

### Prerequisites

- A GitHub account
- Basic understanding of Git (fork, clone, branch, commit, push)
- Familiarity with HTML/CSS/JavaScript (our core stack)

### Step 1 — Find an Issue

Browse the [Issues tab](https://github.com/S3DFX-CYBER/GSoC-Org-Finder-/issues) and filter by:

- `nsoc26` label for NSoC-specific issues
- `level:beginner` (or `level1`) for beginner-friendly tasks
- `level:intermediate` (or `level2`) for intermediate tasks
- `level:advanced` (or `level3`) for advanced tasks
- `type:bug`, `type:ui`, `type:api`, `type:docs`, `type:enhancement` for specific types

New issues are **automatically triaged by our AI bot** which applies difficulty and type labels. You can filter by these labels to find issues that match your skill level.

### Step 2 — Request Assignment

Comment on the issue with:

```bash
/assign nsoc
```

You **must** include `nsoc` in your assignment command.

### Step 3 — Assignment Processing

The automated system validates:

- Your GitHub account is at least **7 days old**
- The issue is available (not already assigned)
- Your active assignment count is under the maximum (**3 issues**)
- No recent spam/AI-slop flags on your account

**Auto-assignment rules by difficulty (on verified issues):**

| Issue Level | Requirement |
|-------------|-------------|
| `level1` (Beginner) | Anyone can self-assign immediately (no restrictions) |
| `level2` (Intermediate) | Account must be at least **30 days old** for auto-assignment |
| `level3` (Advanced) | Must have at least **1 merged PR** in this repository |

- If the issue is not yet verified, a maintainer approves via `/approve-assignment`
- If you don't meet the requirements for a level, you can still request assignment and a maintainer can manually approve

Do **NOT** start working until the bot confirms your assignment.

---

## NSoC Timeline

NSoC contributors can request assignments immediately — there is no date restriction like GSSoC. Start contributing as soon as you join the program!

---

## Contribution Levels

| Level | Label | Examples |
|-------|-------|----------|
| Level 1 | `level1` | UI tweaks, docs, small bug fixes, accessibility |
| Level 2 | `level2` | Filter logic, caching, API improvements, search |
| Level 3 | `level3` | Architecture changes, performance, security |

**Level 3 issues** require at least 1 previously merged PR in this repository. **Level 2 issues** require an account at least 30 days old for auto-assignment. **Level 1 issues** have no restrictions — anyone can start here.

---

## PR Submission Process

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-
```

### 2. Create a Branch

```bash
git checkout -b feat/your-feature-name
```

### 3. Make Your Changes

Follow the project's zero-build, zero-dependency philosophy. Do not add frameworks or build tools.

### 4. Commit with Sign-Off

```bash
git commit -s -m "feat: your descriptive message"
```

Use [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for UI/styling
- `refactor:` for code cleanup
- `perf:` for performance improvements

### 5. Push and Open a PR

```bash
git push origin feat/your-feature-name
```

When opening your PR, select the **NSoC PR Template** and fill in all sections.

### 6. Link Your Issue

Your PR body **must** include:

```
Closes #issue-number
```

---

## NSoC PR Template

When creating a PR, use the NSoC template located at `.github/PULL_REQUEST_TEMPLATE/nsoc.md`. It requires:

- Program declaration (NSOC)
- Description of changes
- Related issue link
- Type of change
- Testing steps
- Screenshots (for UI changes)
- Checklist confirmation

---

## Rules & Guidelines

### Do

- Write clean, readable code
- Test changes locally before submitting
- Keep PRs focused and minimal
- Follow the existing code style
- Respond to review feedback promptly
- Be respectful to mentors and other contributors
- Ask questions if you're stuck

### Don't

- Self-assign issues via GitHub UI (use the bot)
- Start working before assignment is confirmed
- Submit AI-generated code without understanding it
- Open multiple tiny PRs for contribution farming
- Copy contributions from other PRs
- Ping maintainers repeatedly for reviews
- Add unnecessary dependencies or build tools

---

## Review Process (3-Stage Pipeline)

Your PR goes through an automated 3-stage pipeline:

| Stage | What Happens | Labels Applied |
|-------|-------------|----------------|
| **Stage 1** — Automated Checks | DCO sign-off, format validation, AI/slop detection, duplicate check, **LLM context analysis** | `stage-1-approved` on pass |
| **Stage 2** — Reviewer/Maintainer Review | A reviewer checks code quality | `mentor-approved` + `pa-review-required` |
| **Stage 3** — Maintainer Gate | Final approval and merge | `pa-approved` |

The **LLM PR Analysis** bot will automatically verify that your PR:
- Links to a valid issue
- Actually addresses the linked issue
- Does not include out-of-scope changes

### Expected Review Times

- PR review: 24–72 hours
- Please do not ping for faster reviews

---

## Inactivity Policy

- Assigned issues with no progress for **7 days** will be auto-unassigned
- "Progress" means posting a comment OR opening a non-draft PR linked to the issue
- Maintainers and collaborators with write access are exempt
- After being unassigned, you must wait **24 hours** before re-requesting
- If you cannot complete an issue, comment `/unassign` to release it for others

---

## Code of Conduct

All NSoC participants must follow the project's [Code of Conduct](../CODE_OF_CONDUCT.md) and the NSoC program guidelines. Violations may result in removal from the program.

---

## Resources

- [NSoC Official Website](https://www.nsoc.in/)
- [Project Discord](https://discord.gg/mgWV3xSV7)
- [Project Contributing Guide](../CONTRIBUTING.md)

---

## Need Help?

- Ask questions on GitHub Issues or Discussions
- Join our [Discord server](https://discord.gg/mgWV3xSV7)
- Tag your question with `nsoc` for program-specific queries

Happy contributing!
