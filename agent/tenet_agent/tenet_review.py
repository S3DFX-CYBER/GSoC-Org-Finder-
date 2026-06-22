"""
TENET Agent - PR Reviewer
Triggered by: tenet-pr-review.yml on pull_request events.

Reads the PR diff, sends it to Gemini for a security-focused review,
and posts the result as a PR comment.
"""

import os
import re
import sys
import logging

from utils import (
    get_github_client,
    get_repo,
    get_llm_client,
    call_llm,
    get_pr_diff,
    truncate_diff,
    post_pr_comment,
)
from prompts import PR_REVIEW_SYSTEM, PR_REVIEW_TEMPLATE

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def main():
    """Run the TENET Agent PR review workflow."""
    fail_closed = os.environ.get("TENET_FAIL_CLOSED", "false").lower() == "true"

    def fail_workflow(msg: str, critical: bool = False):
        if critical:
            logger.error(msg)
            sys.exit(1)

        if fail_closed:
            logger.error(msg)
            sys.exit(1)
        else:
            logger.warning(msg)
            logger.warning("⚠️  Fail-open enabled: Exiting with code 0 despite the error.")
            sys.exit(0)

    try:
        logger.info("🛡️  TENET Agent - PR Reviewer starting...")

        # ── Gather context from environment variables ──────────────────────────────
        token = os.environ.get("GITHUB_TOKEN")
        if not token:
            fail_workflow("❌ GITHUB_TOKEN is not set.", critical=True)

        repo_name = os.environ.get("REPO")
        if not repo_name:
            fail_workflow("❌ REPO environment variable is not set.", critical=True)

        pr_number_str = os.environ.get("PR_NUMBER")
        if not pr_number_str:
            fail_workflow("❌ PR_NUMBER environment variable is not set.", critical=True)
        try:
            pr_number = int(pr_number_str)
        except ValueError:
            fail_workflow(f"❌ PR_NUMBER is not a valid integer: {pr_number_str!r}", critical=True)

        pr_title = os.environ.get("PR_TITLE", "")
        pr_body = os.environ.get("PR_BODY", "") or "*No description provided.*"
        pr_author = os.environ.get("PR_AUTHOR", "unknown")

        logger.info(f"📋 Reviewing PR #{pr_number}: {pr_title}")
        logger.info(f"📦 Repository: {repo_name}")

        # ── Fetch PR diff ──────────────────────────────────────────────────────────
        logger.info("📥 Fetching PR diff...")
        try:
            diff = get_pr_diff(repo_name, pr_number, token)
        except Exception as e:
            fail_workflow(f"❌ Failed to fetch PR diff: {e}", critical=True)

        if not diff.strip():
            logger.info("ℹ️  PR has no diff (empty). Skipping review.")
            sys.exit(0)

        diff = truncate_diff(diff, max_chars=80_000)
        logger.info(f"📏 Diff size: {len(diff)} chars")

        # ── Build the review prompt ────────────────────────────────────────────────
        user_prompt = PR_REVIEW_TEMPLATE.format(
            pr_title=pr_title,
            pr_author=pr_author,
            pr_body=pr_body,
            diff=diff,
            pr_number=pr_number,
        )
        # Prepend system prompt so reviewer behaviour is consistent
        prompt = f"{PR_REVIEW_SYSTEM}\n\n{user_prompt}"

        # ── Call Gemini ────────────────────────────────────────────────────────────
        logger.info("🤖 Calling Gemini for security review...")
        model = get_llm_client()
        review_text = call_llm(model, prompt)

        if not review_text:
            fail_workflow("❌ LLM returned an empty or error response.", critical=False)

        logger.info("✍️  Review generated. Posting to PR...")

        # ── Post the review comment ────────────────────────────────────────────────
        g = get_github_client()
        repo = get_repo(g)
        post_pr_comment(repo, pr_number, review_text)

        # ── Check for critical findings and add label ──────────────────────────────
        # Scoped regex avoids false positives where "HIGH" or "CRITICAL" appears
        # in the diff content rather than in an actual severity finding.
        if re.search(r"\[SEVERITY:\s*(CRITICAL|HIGH)\]", review_text, flags=re.IGNORECASE):
            try:
                pr = repo.get_pull(pr_number)
                existing_labels = [lbl.name for lbl in pr.get_labels()]
                if "🚨 security" not in existing_labels:
                    pr.add_to_labels("🚨 security")
                    logger.info("🔴 Added '🚨 security' label due to critical/high findings.")
            except Exception as e:
                # Label may not exist — not a fatal error
                logger.warning(f"⚠️  Could not add security label: {e}")

        logger.info("✅ TENET PR Review complete.")
    except SystemExit:
        raise
    except Exception as e:
        fail_workflow(f"❌ Unexpected error in TENET PR Review workflow: {e}", critical=True)


if __name__ == "__main__":
    main()
