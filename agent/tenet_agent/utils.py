"""
TENET Agent - Shared utilities
Handles GitHub API interactions, permission checks, and LLM client setup.
"""

import os
import re
import sys
import time
import random
import logging
import requests
from google import genai
from google.genai import types, errors
from github import Github

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


# ─── GitHub client ────────────────────────────────────────────────────────────

def get_github_client() -> Github:
    """Create and return an authenticated GitHub client."""
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise ValueError("GITHUB_TOKEN is not set.")
    return Github(token)


def get_repo(g: Github):
    """Return the repository object for the current workflow context."""
    repo_name = os.environ.get("REPO")
    if not repo_name:
        raise ValueError("REPO environment variable is not set.")
    return g.get_repo(repo_name)


# ─── LLM client ───────────────────────────────────────────────────────────────

def get_llm_client():
    """Configure Gemini and return a Client instance."""
    api_key = os.environ.get("TENET_AI_KEY")
    if not api_key:
        raise ValueError("TENET_AI_KEY secret is not set. Please add it in repo Settings → Secrets → Actions.")
    return genai.Client(api_key=api_key)


MAX_RETRIES = 3
BASE_DELAY = 5

LLM_CONFIG = types.GenerateContentConfig(
    temperature=0.2,
    max_output_tokens=8192,
    safety_settings=[
        types.SafetySetting(
            category="HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold="BLOCK_MEDIUM_AND_ABOVE",
        )
    ]
)


def is_rate_limit_error(e: Exception) -> bool:
    """Check if an exception is a rate limit error (429)."""
    return getattr(e, 'code', None) == 429 or "429" in str(e)


def get_retry_delay_seconds(e: errors.APIError) -> float | None:
    """Extract server-requested retry delay from APIError if present."""
    if not hasattr(e, 'details') or not isinstance(e.details, dict):
        return None
    try:
        details_list = e.details.get("error", {}).get("details", [])
        for detail in details_list:
            if isinstance(detail, dict) and detail.get("@type") == "type.googleapis.com/google.rpc.RetryInfo":
                delay_str = detail.get("retryDelay", "")
                if isinstance(delay_str, str) and delay_str.endswith("s"):
                    return float(delay_str[:-1])
    except (KeyError, TypeError, AttributeError, ValueError) as parse_error:
        logger.warning(f"⚠️  Failed to parse retryDelay from APIError: {parse_error}")
    return None


def _sleep_for_retry(attempt: int, e: errors.APIError) -> None:
    """Calculate sleep time and wait before retrying."""
    server_delay = get_retry_delay_seconds(e)
    if server_delay is not None:
        sleep_time = server_delay
        logger.warning(f"⚠️  Rate limit (429) hit. Server requested retry in {sleep_time:.2f}s...")
    else:
        jitter = random.uniform(0, 1)
        sleep_time = BASE_DELAY * (2 ** attempt) + jitter
        logger.warning(f"⚠️  Rate limit (429) hit. Retrying in {sleep_time:.2f}s...")
    time.sleep(sleep_time)


def call_llm(client, prompt: str, fail_closed: bool = False) -> str | None:
    """
    Call Gemini and return the text response.

    Implements a retry mechanism for 429 Quota Exceeded errors and gracefully
    handles None text by returning a degraded mode warning for fail-open workflow,
    unless fail_closed is True.
    """
    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=LLM_CONFIG
            )
            if response.text is not None:
                return response.text.strip()
            else:
                logger.warning("⚠️  LLM response.text is None (likely blocked by safety settings).")
                return None if fail_closed else "⚠️ TENET Security Review skipped due to safety filters."
        except errors.APIError as e:
            if is_rate_limit_error(e):
                if attempt < MAX_RETRIES - 1:
                    _sleep_for_retry(attempt, e)
                    continue
                else:
                    logger.exception(f"⚠️  LLM call failed after {MAX_RETRIES} retries due to rate limit.")
                    return None if fail_closed else "⚠️ TENET Security Review skipped due to API rate limits."
            logger.exception(f"⚠️  LLM API error: {e}")
            return None if fail_closed else "⚠️ TENET Security Review skipped due to API error."
        except Exception as e:
            logger.exception(f"⚠️  LLM call failed: {e}")
            return None if fail_closed else "⚠️ TENET Security Review skipped due to an internal error."


# ─── PR utilities ─────────────────────────────────────────────────────────────

def get_pr_diff(repo_name: str, pr_number: int, token: str) -> str:
    """Fetch the unified diff for a PR via GitHub API."""
    url = f"https://api.github.com/repos/{repo_name}/pulls/{pr_number}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3.diff",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.text


def truncate_diff(diff: str, max_chars: int = 80_000) -> str:
    """Truncate a diff to fit within token limits."""
    if len(diff) <= max_chars:
        return diff
    truncated = diff[:max_chars]
    return truncated + f"\n\n... [diff truncated to {max_chars} chars for context window] ..."


def post_pr_comment(repo, pr_number: int, body: str) -> None:
    """Post a comment on a PR."""
    pr = repo.get_pull(pr_number)
    pr.create_issue_comment(body)
    logger.info(f"✅ Posted review comment on PR #{pr_number}")


# ─── Issue utilities ──────────────────────────────────────────────────────────

def post_issue_comment(repo, issue_number: int, body: str) -> None:
    """Post a comment on an issue."""
    issue = repo.get_issue(issue_number)
    issue.create_comment(body)
    logger.info(f"✅ Posted comment on issue #{issue_number}")


def get_repo_structure(base_path: str = ".", max_files: int = 120) -> str:
    """Walk the repo and return a file tree string (excludes hidden dirs and common noise)."""
    skip_dirs = {
        ".git", "__pycache__", "node_modules", ".venv",
        "venv", "dist", "build", ".mypy_cache",
    }
    skip_exts = {
        ".pyc", ".pyo", ".so", ".egg-info", ".lock", ".log",
        ".png", ".jpg", ".jpeg", ".svg", ".ico",
    }
    lines = []
    count = 0
    for root, dirs, files in os.walk(base_path):
        dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith(".")]
        rel_root = os.path.relpath(root, base_path)
        indent = "  " * (rel_root.count(os.sep)) if rel_root != "." else ""
        if rel_root != ".":
            lines.append(f"{indent}📁 {os.path.basename(root)}/")
        for f in files:
            if any(f.endswith(ext) for ext in skip_exts):
                continue
            file_indent = "  " * (rel_root.count(os.sep) + 1) if rel_root != "." else "  "
            lines.append(f"{file_indent}📄 {f}")
            count += 1
            if count >= max_files:
                lines.append("  ... (truncated)")
                return "\n".join(lines)
    return "\n".join(lines)


def read_relevant_files(issue_title: str, issue_body: str, max_total_chars: int = 40_000) -> str:
    """
    Heuristically find and read source files relevant to the issue.
    Searches for keyword matches in filenames and content.
    """
    keywords = extract_keywords(issue_title + " " + (issue_body or ""))
    candidate_files = []

    search_dirs = ["services", "scripts", "dashboard", "tests", "data", "models"]
    for search_dir in search_dirs:
        if not os.path.isdir(search_dir):
            continue
        for root, dirs, files in os.walk(search_dir):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d != "__pycache__"]
            for fname in files:
                if fname.endswith((".py", ".ts", ".tsx", ".js", ".json", ".yaml", ".yml", ".md")):
                    fpath = os.path.join(root, fname)
                    score = sum(1 for kw in keywords if kw.lower() in fname.lower())
                    candidate_files.append((score, fpath))

    candidate_files.sort(key=lambda x: (-x[0], x[1]))

    collected = []
    total_chars = 0
    for _, fpath in candidate_files[:30]:
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if total_chars + len(content) > max_total_chars:
                remaining = max_total_chars - total_chars
                if remaining < 500:
                    break
                content = content[:remaining] + "\n... [truncated]"
            collected.append(f"### File: `{fpath}`\n```\n{content}\n```")
            total_chars += len(content)
        except OSError:
            continue

    if not collected:
        return "*No relevant source files found automatically.*"
    return "\n\n".join(collected)


def extract_keywords(text: str) -> list[str]:
    """Extract meaningful keywords from issue text."""
    text = re.sub(r"[`*#\[\]()>]+", " ", text)
    stop_words = {
        "the", "a", "an", "is", "in", "on", "at", "to", "for", "of",
        "and", "or", "but", "not", "with", "as", "it", "its", "this",
        "that", "be", "was", "are", "have", "has", "do", "does", "i",
        "we", "you", "should", "would", "could", "when", "how", "what",
        "need", "want", "make", "add", "remove", "fix", "update", "change",
    }
    words = re.findall(r"[a-zA-Z_]\w+", text)
    return [w for w in words if w.lower() not in stop_words and len(w) > 2]


# ─── Git helpers ──────────────────────────────────────────────────────────────

def _validate_branch_name(name: str) -> bool:
    """Ensure branch name contains only safe characters."""
    return bool(re.match(r'^[a-zA-Z0-9._/-]+$', name)) and '..' not in name


def _validate_filepath(filepath: str, base_path: str = ".") -> bool:
    """Ensure filepath does not escape the repository root."""
    abs_base = os.path.abspath(base_path)
    abs_target = os.path.abspath(os.path.join(base_path, filepath))
    return abs_target.startswith(abs_base + os.sep) or abs_target == abs_base


def create_branch_and_commit(
    branch_name: str,
    file_changes: dict[str, str],
    commit_message: str,
) -> bool:
    """
    Apply file_changes {filepath: new_content} and commit them to branch_name.

    Uses the git CLI, which is available on all GitHub Actions runners.
    Returns True on success, False on any git or I/O error.
    """
    import subprocess

    if not _validate_branch_name(branch_name):
        logger.error(f"❌ Invalid branch name: {branch_name!r}")
        return False

    for filepath in file_changes:
        if not _validate_filepath(filepath):
            logger.error(f"❌ Invalid filepath (potential path traversal): {filepath!r}")
            return False

    def run(cmd: list[str]) -> subprocess.CompletedProcess:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(
                f"Git command failed: {' '.join(cmd)}\n"
                f"Stdout: {result.stdout}\nStderr: {result.stderr}"
            )
            raise RuntimeError(f"git command failed: {result.stderr}")
        return result

    try:
        run(["git", "checkout", "-b", branch_name])

        for filepath, content in file_changes.items():
            parent = os.path.dirname(filepath)
            os.makedirs(parent if parent else ".", exist_ok=True)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            run(["git", "add", filepath])

        run(["git", "commit", "-m", commit_message])
        run(["git", "push", "origin", branch_name])
        logger.info(f"✅ Branch '{branch_name}' pushed.")
        return True
    except Exception as e:
        logger.exception(f"❌ Git error: {e}")
        return False
