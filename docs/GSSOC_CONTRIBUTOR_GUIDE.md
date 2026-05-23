# GSSoC'26 Contributor Guide

Welcome to the **GirlScript Summer of Code 2026** contribution track for FindMyGSoC!

GirlScript Summer of Code (GSSoC) is a 3-month open-source program conducted by the GirlScript Foundation. It helps beginners get started with open-source development while gaining real-world experience.

---

## Getting Started

### Prerequisites

- A GitHub account
- Basic understanding of Git (fork, clone, branch, commit, push)
- Familiarity with HTML/CSS/JavaScript (our core stack)

### Step 1 — Find an Issue

Browse the [Issues tab](https://github.com/S3DFX-CYBER/GSoC-Org-Finder-/issues) and filter by:

- `gssoc26` label for GSSoC-specific issues
- `level:beginner` for beginner-friendly tasks
- `level:intermediate` for intermediate tasks
- `level:advanced` for advanced tasks
- `type:bug`, `type:ui`, `type:api`, `type:docs`, `type:enhancement` for specific types

New issues are **automatically triaged by our AI bot** which applies difficulty and type labels. You can filter by these labels to find issues that match your skill level.

### Step 2 — Request Assignment

Comment on the issue with:

```bash
/assign gssoc
```

You **must** include `gssoc` in your assignment command.

### Step 3 — Assignment Processing

The automated system validates:

- The issue is available (not already assigned)
- Your active assignment count is under the maximum (**3 issues** for GSSoC)
- No recent spam/AI-slop flags on your account
- GSSoC assignments are open (opened **15 May 2026, 12:00 AM IST**)
- Level-specific eligibility (see table below)

**Auto-assignment rules by difficulty (on verified issues):**

| Issue Level | Requirement |
|-------------|-------------|
| `level:beginner` | Anyone can self-assign immediately (no restrictions) |
| `level:intermediate` | Account must be at least **30 days old** for auto-assignment |
| `level:advanced` | Must have at least **1 merged PR** in this repository |

- If the issue is not yet verified, a maintainer approves via `/approve-assignment`
- If you don't meet the requirements for a level, you can still request assignment and a maintainer can manually approve

Do **NOT** start working until the bot confirms your assignment.

---

## GSSoC Assignment Timeline

| Date | Status |
|------|--------|
| Before 15 May 2026 | GSSoC assignments **blocked** |
| 15 May 2026 onwards | GSSoC assignments **open** |

NSoC contributors are unaffected by this restriction.

---

## Contribution Levels & Points

GSSoC uses a level-based points system:

| Level | Label | Points | Examples |
|-------|-------|--------|----------|
| Beginner | `level:beginner` | 10 pts | UI tweaks, docs, small bug fixes |
| Intermediate | `level:intermediate` | 25 pts | Filter logic, caching, API improvements |
| Advanced | `level:advanced` | 45 pts | Architecture changes, performance, security |

Points are tracked on the GSSoC leaderboard throughout the program. The leaderboard only updates when PRs are **merged**.

**Advanced issues** require at least 1 previously merged PR in this repository. **Intermediate issues** require an account at least 30 days old for auto-assignment. **Beginner issues** have no restrictions — anyone can start here.

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

When opening your PR, select the **GSSoC PR Template** and fill in all sections.

### 6. Link Your Issue

Your PR body **must** include:

```
Closes #issue-number
```

---

## GSSoC PR Template

When creating a PR, use the GSSoC template located at `.github/PULL_REQUEST_TEMPLATE/gssoc.md`. It requires:

- Program declaration (GSSoC)
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

### Don't

- Self-assign issues via GitHub UI (use the bot)
- Start working before assignment is confirmed
- Submit AI-generated code without understanding it
- Open multiple tiny PRs for point farming
- Copy contributions from other PRs
- Ping maintainers repeatedly for reviews
- Add unnecessary dependencies or build tools

---

## Review Process (3-Stage Pipeline)

Your PR goes through an automated 3-stage pipeline:

| Stage | What Happens | Labels Applied |
|-------|-------------|----------------|
| **Stage 1** — Automated Checks | DCO sign-off, format validation, AI/slop detection, duplicate check, **LLM context analysis** | `stage-1-approved` on pass |
| **Stage 2** — Mentor Review | A GSSoC mentor reviews code quality | `needs-mentor-review` → `mentor-approved` + `pa-review-required` |
| **Stage 3** — Maintainer Gate | Final approval and merge | `pa-approved` |

The **LLM PR Analysis** bot will automatically verify that your PR:
- Links to a valid issue
- Actually addresses the linked issue
- Does not include out-of-scope changes

### How Mentor Review Works

1. After Stage 1 passes, mentors are automatically assigned from our mentor pool
2. Labels `needs-mentor-review` and `mentor-review-requested` are applied
3. Mentors have **24 hours** to review — if they don't respond, they are automatically replaced with another active mentor
4. When a mentor approves (via GitHub review approval or commenting `/approve-pr` or `/lgtm`), the bot applies `mentor-approved` and `pa-review-required`
5. The maintainer is then notified for final review

### Expected Review Times

- Mentor review: **24 hours** (auto-rotation if no response)
- Maintainer review: 24–72 hours
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

All GSSoC participants must follow the project's [Code of Conduct](../CODE_OF_CONDUCT.md) and the GSSoC program guidelines. Violations may result in disqualification from the program.

---

## Resources

- [GSSoC Official Website](https://gssoc.girlscript.org/)
- [GSSoC Contributor Guidelines](https://gssoc.girlscript.org/guidelines/contributor)
- [Project Discord](https://discord.gg/mgWV3xSV7)
- [Project Contributing Guide](../CONTRIBUTING.md)

---

## Need Help?

- Ask questions on GitHub Issues or Discussions
- Join our [Discord server](https://discord.gg/mgWV3xSV7)
- Tag your question with `gssoc` for program-specific queries

Happy contributing!
