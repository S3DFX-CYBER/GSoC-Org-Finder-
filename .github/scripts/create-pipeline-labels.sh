#!/usr/bin/env bash
# .github/scripts/create-pipeline-labels.sh
#
# Bootstraps PR lifecycle labels used by:
# - pr-stage-manager.yml
# - request-reviewers.yml
# - review-approval-gate.yml
# - pa-final-gate.yml
#
# This script ONLY manages lifecycle pipeline labels.
#
# It intentionally does NOT modify existing labels like:
# - dco-missing
# - dco-verified
# - ai-slop
# - low-quality-pr
# - possible-duplicate-pr
# - gssoc26
# - nsoc26
#
# Usage:
#   bash .github/scripts/create-pipeline-labels.sh
#
#   bash .github/scripts/create-pipeline-labels.sh \
#     S3DFX-CYBER/GSoC-Org-Finder-
#
# Requirements:
# - GitHub CLI (gh)
# - Authenticated with repository write access

set -euo pipefail

REPO="${1:-}"

REPO_ARG=()

if [[ -n "$REPO" ]]; then
  REPO_ARG+=(--repo "$REPO")
fi

# ─────────────────────────────────────────────
# Upsert label
# ─────────────────────────────────────────────
upsert_label() {

  local name="$1"
  local color="$2"
  local description="$3"

  if gh label list "${REPO_ARG[@]}" \
      --search "$name" \
      --json name \
      --jq '.[].name' \
      2>/dev/null | grep -Fxq "$name"; then

    printf '  ↩  updated  %s\n' "$name"

    gh label edit "$name" \
      --color "$color" \
      --description "$description" \
      "${REPO_ARG[@]}" \
      >/dev/null 2>&1 || true

  else

    printf '  +  created  %s\n' "$name"

    gh label create "$name" \
      --color "$color" \
      --description "$description" \
      "${REPO_ARG[@]}" \
      >/dev/null
  fi
}

echo "=== 🚦 PR Pipeline Label Bootstrap ==="
echo ""

# ─────────────────────────────────────────────
# Stage 1
# ─────────────────────────────────────────────
echo "Stage 1 — Automated Validation"

upsert_label \
  "stage-1-approved" \
  "0e8a16" \
  "All automated validation checks passed"

upsert_label \
  "needs-fixes" \
  "d93f0b" \
  "Automated checks failed — contributor action required"

echo ""

# ─────────────────────────────────────────────
# Stage 2
# ─────────────────────────────────────────────
echo "Stage 2 — Human Review"

upsert_label \
  "mentor-review-requested" \
  "1d76db" \
  "Awaiting GSSOC mentor review"

upsert_label \
  "nsoc-review-requested" \
  "5319e7" \
  "Awaiting NSOC reviewer review"

upsert_label \
  "gssoc-mentor-approved" \
  "0052cc" \
  "Approved by verified GSSOC mentors"

upsert_label \
  "nsoc-reviewed" \
  "6f42c1" \
  "Approved by qualified NSOC reviewers"

upsert_label \
  "changes-requested" \
  "b60205" \
  "Changes requested during review"

echo ""

# ─────────────────────────────────────────────
# Stage 3
# ─────────────────────────────────────────────
echo "Stage 3 — Maintainer Review"

upsert_label \
  "pa-review" \
  "fbca04" \
  "Approved by PA or maintainer pending final merge gate"

upsert_label \
  "merge-ready" \
  "0e8a16" \
  "All review stages passed — safe to merge"

echo ""

# ─────────────────────────────────────────────
# GSSoC Difficulty Labels
# ─────────────────────────────────────────────
echo "GSSoC — Difficulty Labels"

upsert_label \
  "level:beginner" \
  "7057ff" \
  "GSSoC difficulty: beginner-friendly task"

upsert_label \
  "level:intermediate" \
  "fbca04" \
  "GSSoC difficulty: intermediate-level task"

upsert_label \
  "level:advanced" \
  "d93f0b" \
  "GSSoC difficulty: advanced-level task"

upsert_label \
  "level:critical" \
  "b60205" \
  "GSSoC difficulty: critical-level task"

echo ""

# ─────────────────────────────────────────────
# GSSoC Quality Labels
# ─────────────────────────────────────────────
echo "GSSoC — Quality Labels"

upsert_label \
  "quality:clean" \
  "0e8a16" \
  "GSSoC quality: clean, well-structured code"

upsert_label \
  "quality:exceptional" \
  "006b75" \
  "GSSoC quality: exceptional contribution (optional bonus)"

echo ""

# ─────────────────────────────────────────────
# GSSoC Type Bonus Labels
# ─────────────────────────────────────────────
echo "GSSoC — Type Bonus Labels"

upsert_label \
  "type:docs" \
  "0075ca" \
  "GSSoC bonus: documentation improvement"

upsert_label \
  "type:testing" \
  "bfd4f2" \
  "GSSoC bonus: test coverage improvement"

upsert_label \
  "type:accessibility" \
  "d4c5f9" \
  "GSSoC bonus: accessibility improvement"

upsert_label \
  "type:performance" \
  "f9d0c4" \
  "GSSoC bonus: performance optimization"

upsert_label \
  "type:security" \
  "b60205" \
  "GSSoC bonus: security fix or improvement"

upsert_label \
  "type:design" \
  "c5def5" \
  "GSSoC bonus: UI/UX design improvement"

upsert_label \
  "type:refactor" \
  "fef2c0" \
  "GSSoC bonus: code refactoring"

upsert_label \
  "type:devops" \
  "1d76db" \
  "GSSoC bonus: DevOps or CI/CD improvement"

upsert_label \
  "type:bug" \
  "d73a4a" \
  "GSSoC bonus: bug fix"

upsert_label \
  "type:feature" \
  "a2eeef" \
  "GSSoC bonus: new feature implementation"

echo ""

# ─────────────────────────────────────────────
# GSSoC Validation Labels
# ─────────────────────────────────────────────
echo "GSSoC — Validation Labels"

upsert_label \
  "gssoc:approved" \
  "0e8a16" \
  "GSSoC validation: approved by Project Admin"

upsert_label \
  "gssoc:invalid" \
  "e4e669" \
  "GSSoC validation: marked invalid by Project Admin"

upsert_label \
  "gssoc:spam" \
  "b60205" \
  "GSSoC validation: marked as spam"

upsert_label \
  "gssoc:ai-slop" \
  "d93f0b" \
  "GSSoC validation: AI-generated low-effort contribution"

echo ""
echo "✅ Pipeline lifecycle labels synchronized successfully."
echo ""
echo "Run .github/scripts/create-gssoc-labels.sh to also sync mentor attribution labels."
