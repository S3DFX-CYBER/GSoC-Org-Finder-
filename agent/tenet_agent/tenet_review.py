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
from dataclasses import dataclass
from typing import NoReturn

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


def fail_workflow(msg: str, critical: bool = False, fail_closed: bool = False) -> NoReturn:
    if critical or fail_closed:
        logger.error(msg)
        sys.exit(1)
    else:
        logger.warning(msg)
        logger.warning("⚠️  Fail-open enabled: Exiting with code 0 despite the error.")
        sys.exit(0)


@dataclass
class EnvConfig:
    token: str
    repo_name: str
    pr_number: int
    pr_title: str
    pr_body: str
    pr_author: str
    fail_closed: bool


def get_env_config() -> EnvConfig:
    fail_closed = os.environ.get("TENET_FAIL_CLOSED", "false").lower() == "true"

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        fail_workflow("❌ GITHUB_TOKEN is not set.", critical=True, fail_closed=fail_closed)

    repo_name = os.environ.get("REPO")
    if not repo_name:
        fail_workflow("❌ REPO environment variable is not set.", critical=True, fail_closed=fail_closed)

    pr_number_str = os.environ.get("PR_NUMBER")
    if not pr_number_str:
        fail_workflow("❌ PR_NUMBER environment variable is not set.", critical=True, fail_closed=fail_closed)
    try:
        pr_number = int(pr_number_str)
    except ValueError:
        fail_workflow(f"❌ PR_NUMBER is not a valid integer: {pr_number_str!r}", critical=True, fail_closed=fail_closed)

    return EnvConfig(
        token=token,
        repo_name=repo_name,
        pr_number=pr_number,
        pr_title=os.environ.get("PR_TITLE", ""),
        pr_body=os.environ.get("PR_BODY", "") or "*No description provided.*",
        pr_author=os.environ.get("PR_AUTHOR", "unknown"),
        fail_closed=fail_closed,
    )


def review_pr(config: EnvConfig):
    logger.info(f"📋 Reviewing PR #{config.pr_number}: {config.pr_title}")
    logger.info(f"📦 Repository: {config.repo_name}")

    logger.info("📥 Fetching PR diff...")
    try:
        diff = get_pr_diff(config.repo_name, config.pr_number, config.token)
    except Exception as e:
        # Non-critical, as fetching diff might fail due to transient GitHub API issues
        fail_workflow(f"❌ Failed to fetch PR diff: {e}", critical=False, fail_closed=config.fail_closed)

    if not diff.strip():
        logger.info("ℹ️  PR has no diff (empty). Skipping review.")
        sys.exit(0)

    diff = truncate_diff(diff, max_chars=80_000)
    logger.info(f"📏 Diff size: {len(diff)} chars")

    user_prompt = PR_REVIEW_TEMPLATE.format(
        pr_title=config.pr_title,
        pr_author=config.pr_author,
        pr_body=config.pr_body,
        diff=diff,
        pr_number=config.pr_number,
    )
    prompt = f"{PR_REVIEW_SYSTEM}\n\n{user_prompt}"

    logger.info("🤖 Calling Gemini for security review...")
    model = get_llm_client()
    review_text = call_llm(model, prompt, fail_closed=config.fail_closed)

    if not review_text:
        fail_workflow("❌ LLM returned an empty or error response.", critical=False, fail_closed=config.fail_closed)

    logger.info("✍️  Review generated. Posting to PR...")
    g = get_github_client()
    repo = get_repo(g)
    post_pr_comment(repo, config.pr_number, review_text)

    if re.search(r"\[SEVERITY:\s*(CRITICAL|HIGH)\]", review_text, flags=re.IGNORECASE):
        try:
            pr = repo.get_pull(config.pr_number)
            existing_labels = [lbl.name for lbl in pr.get_labels()]
            if "🚨 security" not in existing_labels:
                pr.add_to_labels("🚨 security")
                logger.info("🔴 Added '🚨 security' label due to critical/high findings.")
        except Exception as e:
            logger.warning(f"⚠️  Could not add security label: {e}")

    logger.info("✅ TENET PR Review complete.")


def main():
    """Run the TENET Agent PR review workflow."""
    try:
        logger.info("🛡️  TENET Agent - PR Reviewer starting...")
        config = get_env_config()
        review_pr(config)
    except SystemExit:
        raise
    except Exception as e:
        # Unexpected errors trigger fail-open behavior
        fail_closed = os.environ.get("TENET_FAIL_CLOSED", "false").lower() == "true"
        fail_workflow(f"❌ Unexpected error in TENET PR Review workflow: {e}", critical=False, fail_closed=fail_closed)


if __name__ == "__main__":
    main()
