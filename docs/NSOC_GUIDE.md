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
- `level-1` for beginner-friendly tasks
- `level-2` for intermediate tasks
- `level-3` for advanced tasks

### Step 2 — Request Assignment

Comment on the issue with:

```
/assign
```

**You MUST mention NSoC in your comment.** Example:

> I would like to work on this issue under NSOC.

### Step 3 — Wait for Bot Validation

The automated system will validate:

- Your eligibility as an NSoC contributor
- Whether the issue is available
- Your current active assignment count (max 3)

Do **NOT** start working until the bot confirms your assignment.

---

## NSoC Timeline

NSoC contributors can request assignments immediately — there is no date restriction like GSSoC. Start contributing as soon as you join the program!

---

## Contribution Levels

| Level | Difficulty | Examples |
|-------|-----------|----------|
| Level 1 | Beginner | UI tweaks, docs, small bug fixes, accessibility |
| Level 2 | Intermediate | Filter logic, caching, API improvements, search |
| Level 3 | Advanced | Architecture changes, performance, security |

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

## Review Process

1. Your PR enters the automated validation pipeline (Stage 1)
2. Once Stage 1 passes, the maintainer reviews your PR directly
3. The maintainer may request changes — address them promptly
4. Once approved, the maintainer merges the PR
5. Your contribution is recorded

### Expected Review Times

- PR review: 24–72 hours
- Please do not ping for faster reviews

---

## Inactivity Policy

- Assigned issues with no progress for **2–3 days** may be unassigned
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
