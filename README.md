# GSoC Org Finder

A contributor-friendly OSS project with enterprise-grade governance automation for GSSOC, NSOC, and general open-source workflows.

## Contribution Governance
We use strict-but-fair automation to keep reviews fast, reduce spam, and protect maintainers and contributors.

## PR Validation Rules
- PRs must link a valid issue (`Closes #123` / `Fixes #123` / `Resolves #123`).
- PRs must classify exactly one program: **GSSOC**, **NSOC**, or **GENERAL**.
- PRs with ownership mismatch, invalid issue state, or invalid structure may be auto-closed with recovery instructions.

## Issue Quality Rules
- Low-context issues are labeled `needs-more-info` with clear fix guidance.
- Clear spam issues are labeled `spam` and closed.
- Duplicate and low-signal reports are handled via sticky comments to avoid noise.

## Mentor Review System
- Mentor activity is tracked from real review events.
- Active mentor routing prioritizes responsive mentors.
- Review quality and priority usage are tracked for mentor accountability.

## Priority Labels
One and only one priority label is enforced per PR:
`priority-p0`, `priority-p1`, `priority-p2`, `priority-p3`, `priority-p4`.

## Assignment Policy
- One contributor per issue at a time.
- `/assign`, `/unassign`, `/approve-assignment @user` are governance-controlled.
- Race-safe checks prevent double-assignment.

## Contributor Expectations
- Follow templates and link valid issues.
- Keep changes scoped to issue intent.
- Use constructive communication and respond to review feedback.

## Automation Features
- Strict PR validator
- Strict issue validator
- Program classification validator
- Mentor intelligence routing
- Duplicate issue/PR detection
- AI-slop checks
- Sticky anti-spam comments

## Leaderboards
- Contributor leaderboard (program-aware)
- Mentor leaderboard (activity + quality aware)

## Fair Usage & Anti-Spam Policy
We prioritize fairness:
- warnings before hard actions where possible,
- actionable feedback on every failure,
- clear reopen paths for legitimate contributors.

<!-- mentor-leaderboard:start -->
## 🔎 Mentor Leaderboard

| Rank | Mentor | Reviews | Approvals | Last Active |
|------|------|------|------|------|
| - | - | 0 | 0 | Never |
<!-- mentor-leaderboard:end -->
