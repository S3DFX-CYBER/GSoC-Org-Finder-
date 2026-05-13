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
- `level-1` for beginner-friendly tasks
- `level-2` for intermediate tasks
- `level-3` for advanced tasks

### Step 2 — Request Assignment

Comment on the issue with:

```
/assign
```

**You MUST mention GSSoC in your comment.** Example:

> I would like to work on this issue under GSSoC.

### Step 3 — Wait for Bot Validation

The automated system will validate:

- Your eligibility as a GSSoC contributor
- Whether the issue is available
- Your current active assignment count (max 3)
- Whether GSSoC assignments are open (opens **15 May 2026, 12:00 AM IST**)

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

| Level | Difficulty | Points | Examples |
|-------|-----------|--------|----------|
| Level 1 | Beginner | 10 pts | UI tweaks, docs, small bug fixes |
| Level 2 | Intermediate | 25 pts | Filter logic, caching, API improvements |
| Level 3 | Advanced | 45 pts | Architecture changes, performance, security |

Points are tracked on the GSSoC leaderboard throughout the program.

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

## Review Process — 3-Stage Pipeline

Every GSSoC PR goes through a structured 3-stage review pipeline. You can track your PR's progress via the automated **PR Review Pipeline** status comment that appears on your PR.

### Stage 1 — Automated Validation

A bot performs the following checks immediately after you open your PR:

| Check | What it verifies |
|-------|-----------------|
| DCO Sign-off | Every commit has `Signed-off-by` line |
| PR Format | Conventional title, linked issue, template sections |
| AI/Slop Detection | Flags AI-generated or low-effort content |
| Duplicate Detection | Checks for duplicate PRs |

If Stage 1 fails, the pipeline status comment will show the specific issues. Fix them and push new commits — the checks re-run automatically.

### Stage 2 — GSSoC Mentor Review

Once Stage 1 passes, your PR is assigned to GSSoC mentors from the mentor pool.

- Mentors review code quality, functionality, and adherence to project standards
- They may **approve** or **request changes**
- If changes are requested, address the feedback and push new commits
- The mentor re-reviews until satisfied

Your PR cannot proceed to Stage 3 until a mentor approves it.

### Stage 3 — Maintainer / PA Review

After mentor approval, the project admin (@S3DFX-CYBER) performs the final review:

- Verifies the contribution aligns with project direction
- Confirms no architectural or security concerns
- Merges the PR when satisfied

Points are awarded based on the issue level after merge.

### Pipeline Status Labels

| Label | Meaning |
|-------|---------|
| `stage-1-approved` | Automated checks passed |
| `gssoc-mentor-approved` | Mentor has approved |
| `pa-approved` / `merge-ready` | Maintainer approved, ready to merge |
| `needs-stage-1-fixes` | Automated checks failed — fix required |

### Expected Review Times

- Stage 1: Immediate (automated)
- Stage 2 (mentor review): 24–72 hours
- Stage 3 (maintainer review): 24–48 hours after mentor approval

Do not ping maintainers or mentors for faster reviews. Excessive pinging may trigger spam warnings.

---

## Inactivity Policy

- Assigned issues with no progress for **2–3 days** may be unassigned
- If you cannot complete an issue, comment `/unassign` to release it

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
