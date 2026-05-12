#!/usr/bin/env sh
set -e

usage() {
  cat <<'EOF'
Usage: ./scripts/dco.sh <command>

Commands:
  sign        Create a new commit and add a DCO sign-off.
  amend       Amend the latest commit and add a DCO sign-off.
  push        Push the current branch with --force-with-lease.
  help        Show this message.

Examples:
  ./scripts/dco.sh sign
  ./scripts/dco.sh amend
  ./scripts/dco.sh push
EOF
}

case "$1" in
  sign)
    git commit --signoff
    ;;
  amend)
    git commit --amend --no-edit --signoff
    ;;
  push)
    git push --force-with-lease
    ;;
  help|--help|-h|"")
    usage
    ;;
  *)
    echo "Unknown command: $1" >&2
    usage
    exit 1
    ;;
esac
