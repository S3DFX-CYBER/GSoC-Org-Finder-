# ⚙️ GitHub Actions Workflows — FindMyGSoC

This document describes all **37 GitHub Actions workflows** in `.github/workflows/`. They automate assignment management, PR validation, spam detection, leaderboards, and code quality checks.

---

## 📋 Workflow Categories

| Category | Count | Purpose |
|----------|-------|---------|
| [Assignment & Issue Management](#assignment--issue-management) | 7 | Issue assignment, eligibility, timeout handling |
| [PR Validation & Review](#pr-validation--review) | 10 | DCO, format, stage gating, review pipeline |
| [Spam & Quality Detection](#spam--quality-detection) | 4 | AI slop, duplicate, ping spam, low-effort detection |
| [Mentor System](#mentor-system) | 5 | Mentor review, rotation, quality scoring, leaderboard |
| [Leaderboard & Gamification](#leaderboard--gamification) | 3 | Contributor/mentor rankings |
| [Code Quality](#code-quality) | 2 | Lint, format checks |
| [Project Management](#project-management) | 4 | Labels, triage, project board automation |
| [Notifications & Bots](#notifications--bots) | 2 | Welcome bots for issues and PRs |

---

## Assignment & Issue Management

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `issue-context-assignment.yml` | Issue comment (`/assign`) | Processes contributor assignment requests. Validates eligibility (account age, active assignments, difficulty level), queues for mentor approval, handles GSSoC/NSoC/General tracks separately |
| `unassign-issues.yml` | Schedule (daily) + manual | Auto-unassigns contributors after 7 days of inactivity. Exempts maintainers and collaborators with write access |
| `assignment-timeout-escalation.yml` | Schedule | Escalates stuck assignments to Project Admin when mentor approval times out (>24h) |
| `mentor-assignment-expiry.yml` | Schedule | Rotates mentor selection if a pinged mentor doesn't respond within 24 hours |
| `issue-validate.yml` | Issue opened/edited | Validates new issues against templates. Flags missing sections, applies `needs-more-info` label |
| `issue-label-enforce.yml` | Issue labeled | Ensures all open issues have the required difficulty and type labels |
| `refresh-good-first-issues.yml` | Schedule (weekly) | Re-fetches Good First Issues from GitHub API and updates `data/issues.json` |

---

## PR Validation & Review

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `pr-validator.yml` | PR opened/edited | Validates PR body: checks for linked issue (`Closes #N`), correct template usage, completeness of required sections |
| `dco-helper.yml` | PR opened/synced | Enforces Developer Certificate of Origin sign-off on all commits (`git commit -s`). Posts guidance if sign-off is missing |
| `pr-stage-manage.yml` | PR events, reviews | Central 3-stage pipeline manager. Moves PRs through Stage 1 → Stage 2 → Stage 3 by applying labels and triggering reviewer assignment |
| `stage2-review-approval.yml` | PR review submitted | Handles mentor approval commands (`/approve-pr`, `/lgtm`). Applies `mentor-approved` and `pa-review-required` labels on valid approval |
| `pr-pa-gate.yml` | PR labeled | Enforces Project Admin gate — blocks merge until `pa-approved` label is present |
| `pr-size-label.yml` | PR opened/synced | Labels PR size: `size/XS`, `size/S`, `size/M`, `size/L`, `size/XL` based on lines changed |
| `request-review.yml` | PR labeled (`stage-1-approved`) | Auto-requests review from active mentors when Stage 1 passes |
| `dismiss-change-requests-on-commit.yml` | PR synchronized | Dismisses stale "Request Changes" reviews when new commits are pushed |
| `stale-pr.yml` | Schedule (daily) | Marks and closes PRs with no activity after 14 days. Posts warning before closing |
| `tenet-pr-review.yml` | PR opened/synced | Triggers the Python `tenet_agent` AI reviewer for automated PR analysis |

---

## Spam & Quality Detection

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `detect-ai-slop.yml` | PR opened/synced | LLM-assisted detection of AI-generated low-effort code. Analyzes diff for generic patterns, unexplained complexity, and inconsistent style |
| `duplicate-issue.yml` | Issue opened | AI-assisted duplicate issue detection using title normalization, keyword overlap, and semantic similarity scoring |
| `duplicate-pr.yml` | PR opened | Detects duplicate pull requests targeting the same issue or containing overlapping changes |
| `detect-ping-spam.yml` | Issue/PR comment | Detects and handles repeated maintainer pings. Applies `spam` label and may hide comments on repeated violations |
| `spam-escalation.yml` | Issue/PR labeled | Escalates repeated spam or abuse patterns to Project Admin for manual review |

---

## Mentor System

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `mentor-review-timeout.yml` | Schedule | Replaces unresponsive mentors with new active mentors from the pool after 24h |
| `mentor-review-tracker.yml` | PR review events | Tracks mentor review activity for leaderboard calculation |
| `mentor-review-quality.yml` | PR merged | Scores mentor review quality: low-effort vs. detailed feedback vs. merge-quality approvals |
| `mentors-leaderboard.yml` | PR merged, schedule | Generates and posts the mentor activity leaderboard with avatars, scores, and rankings |
| `update-mentor-leaderboard.yml` | PR merged | Triggers leaderboard data update after each merged PR |

---

## Leaderboard & Gamification

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `leaderboard.yml` | PR merged | Updates the contributor leaderboard (avatars, merged PR counts, rankings) |
| `add-contributor.yml` | PR merged | Adds newly merged contributors to the Contributors section in `README.md` |
| `program-classification-validator.yml` | PR opened | Validates that PRs correctly declare their program track (GSSoC/NSoC/General) |

---

## Code Quality

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `code-quality.yml` | PR opened/synced | Runs `npm run lint` — ESLint (JS), Stylelint (CSS), HTMLHint (HTML). Fails if any lint rule is violated |
| `priority-label-manager.yml` | Issue events | Automatically manages `priority:high`, `priority:medium`, `priority:low` labels based on issue keywords and type |

---

## Project Management

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `project-management.yml` | Issue/PR events | Adds issues and PRs to the GitHub Project board, moves cards through columns automatically |
| `label-sync.yml` | Push to `labels/` config | Syncs label definitions from `.github/labels/` config to the repository's GitHub labels |
| `issue-context-assignment.yml` | Issue comment | *(Also listed above)* — Includes full context-aware issue triage and assignment |
| `remind-unresolved-conversations.yml` | Schedule | Pings contributors about PRs with unresolved review conversations older than 48h |

---

## Notifications & Bots

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `welcome-issue-bot.yml` | Issue opened (first-time) | Posts a welcome message on first-time contributor issues with contribution guidelines |
| `pr-welcome-bot.yml` | PR opened (first-time) | Posts a welcome message on first-time contributor PRs with review process information |

---

## 🔁 The 3-Stage PR Pipeline (Key Flow)

```
PR Opened
    │
    ▼
Stage 1 — Automated (pr-validator, dco-helper, detect-ai-slop, duplicate-pr)
    │
    ├─ FAIL → labels: needs-stage-1-fixes
    │
    └─ PASS → label: stage-1-approved
                  │
                  ▼
           Stage 2 — Mentor Review (request-review, stage2-review-approval)
                  │
                  ├─ Mentor rotates every 24h if no response (mentor-review-timeout)
                  │
                  └─ APPROVED → labels: mentor-approved, pa-review-required
                                     │
                                     ▼
                            Stage 3 — Project Admin (pr-pa-gate)
                                     │
                                     └─ APPROVED → label: pa-approved → MERGE ✅
```

---

## 🔗 Related Docs

- [docs/AGENTS.md](AGENTS.md) — The `tenet_agent` AI reviewer used by `tenet-pr-review.yml`
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Full contributor workflow reference
- [docs/index.md](index.md) — Documentation navigation hub
