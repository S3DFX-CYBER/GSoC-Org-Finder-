# Task 4 — Environment Protection Gate Fix

**Related Issue:** #1066 Task 4  
**Affected Workflows:** Code Quality, TENET Agent - PR Review, PR Stage Manager, Stage 2 - Review Approval Handler, Stage 3 - Maintainer Final Gate, Mentor Review Quality, Mentor Review Tracker

---

## Root Cause Analysis

All 32 workflow files in `.github/workflows/` were audited for `environment:` keys — none were found. The `action_required` stall on these workflows is **not** caused by GitHub Environment protection rules configured in workflow YAML files.

The actual root cause is the **repository-level fork pull request approval setting**. When an outside contributor opens a PR from a fork, GitHub holds all workflow runs and marks them `action_required` until a maintainer manually approves them. This blocks automated checks from running at all.

---

## Fix Required (Maintainer Action)

Go to:

> **Repository Settings → Actions → General → Fork pull request workflows from outside collaborators**

Change the setting from:

> Require approval for all outside collaborators

To:

> Require approval for first-time contributors who are new to GitHub

This allows returning contributors' PRs to run workflows automatically while still protecting against spam from brand new GitHub accounts.

---

## Workflow Audit Results

| Workflow File | Has `environment:` key | Trigger |
|---|---|---|
| `code-quality.yml` | No | `pull_request` |
| `tenet-pr-review.yml` | No | `pull_request` |
| `pr-stage-manage.yml` | No | `pull_request_target` |
| `pr-pa-gate.yml` | No | `pull_request_target` |
| `mentor-review-quality.yml` | No | `pull_request_review` |
| `mentor-review-tracker.yml` | No | `pull_request_review` |
| `stage2-review-approval.yml` | No | `pull_request_review` |
| All other workflows (25 files) | No | Various |

No workflow file references a GitHub Environment. The stall is entirely caused by the repo-level setting described above.

---

## Summary

| Item | Status |
|---|---|
| Workflow YAML audit (all 32 files) | Done — no `environment:` keys found |
| Root cause identified | Yes — fork PR approval setting |
| YAML changes required | None |
| Maintainer settings change required | Yes — see fix above |
