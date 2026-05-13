#!/usr/bin/env bash
# .github/scripts/create-pipeline-labels.sh
#
# Creates only the NEW pipeline labels needed by the stage manager.
# Does NOT touch existing labels (dco-missing, dco-verified, ai-slop,
# low-quality-pr, possible-duplicate-pr, gssoc26, nsoc26, etc.).
#
# Usage:
#   bash .github/scripts/create-pipeline-labels.sh
#   bash .github/scripts/create-pipeline-labels.sh S3DFX-CYBER/GSoC-Org-Finder-
#
# Requires: gh CLI authenticated with write access.

set -euo pipefail

REPO="${1:-}"
REPO_ARG=""
[[ -n "$REPO" ]] && REPO_ARG="--repo $REPO"

upsert_label() {
  local name="$1" color="$2" desc="$3"
  if gh label list $REPO_ARG --search "$name" --json name -q '.[].name' \
       2>/dev/null | grep -qx "$name"; then
    printf '  ↩  exists  %s\n' "$name"
    gh label edit "$name" --color "$color" --description "$desc" $REPO_ARG 2>/dev/null || true
  else
    printf '  +  create  %s\n' "$name"
    gh label create "$name" --color "$color" --description "$desc" $REPO_ARG
  fi
}

echo "=== 🚦 PR Pipeline — Label Bootstrap ==="
echo ""

# ── Stage 1 pipeline labels ────────────────────────────────────────────────
echo "Stage 1:"
upsert_label "stage-1-approved"  "0e8a16"  "All automated validation checks passed"
upsert_label "needs-fixes"       "d93f0b"  "Automated checks failed — contributor action required"

# ── Stage 2 pipeline labels ────────────────────────────────────────────────
echo ""
echo "Stage 2:"
upsert_label "gssoc-review"          "1d76db"  "GSSOC PR — awaiting approved GSSOC mentor review"
upsert_label "gssoc-mentor-approved" "0075ca"  "Approved by a verified GSSOC mentor"
upsert_label "nsoc-reviewed"         "5319e7"  "NSOC PR — approved by qualified reviewer"

# ── Stage 3 pipeline labels ────────────────────────────────────────────────
echo ""
echo "Stage 3:"
upsert_label "pa-review"   "e4e669"  "Under PA/maintainer final review"
upsert_label "merge-ready" "0e8a16"  "All pipeline stages passed — safe to merge"

echo ""
echo "✅ Done. Existing labels (dco-*, ai-slop, gssoc26, nsoc26, etc.) were not modified."
