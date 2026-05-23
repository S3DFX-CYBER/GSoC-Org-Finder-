import http.server
import socketserver
import json
import os
import subprocess
from urllib.parse import urlparse, parse_qs

PORT = 8000
REPO_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PENDING_PATH = os.path.join(REPO_DIR, ".github", "reviewers", "pending-assignments.json")
STATS_PATH = os.path.join(REPO_DIR, ".github", "reviewers", "mentor-stats.json")
LEADERBOARD_PATH = os.path.join(REPO_DIR, ".github", "reviewers", "mentor-leaderboard.md")
MENTORS_PATH = os.path.join(REPO_DIR, ".github", "reviewers", "gssoc-mentors.json")

# Backups to restore after tests run
BACKUPS = {}

def backup_files():
    for path in [PENDING_PATH, STATS_PATH, LEADERBOARD_PATH]:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                BACKUPS[path] = f.read()
        else:
            BACKUPS[path] = None

def restore_files():
    for path, content in BACKUPS.items():
        if content is None:
            if os.path.exists(path):
                os.remove(path)
        else:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)

backup_files()

class TestServerHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Always serve relative to the repo root
        parsed = urlparse(path)
        path = parsed.path
        if path.startswith("/"):
            path = path[1:]
        return os.path.join(REPO_DIR, path)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/data":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()

            # Read files
            pending = {}
            if os.path.exists(PENDING_PATH):
                try:
                    with open(PENDING_PATH, "r", encoding="utf-8") as f:
                        pending = json.load(f)
                except Exception:
                    pass

            stats = {}
            if os.path.exists(STATS_PATH):
                try:
                    with open(STATS_PATH, "r", encoding="utf-8") as f:
                        stats = json.load(f)
                except Exception:
                    pass

            leaderboard = ""
            if os.path.exists(LEADERBOARD_PATH):
                try:
                    with open(LEADERBOARD_PATH, "r", encoding="utf-8") as f:
                        leaderboard = f.read()
                except Exception:
                    pass

            mentors = []
            if os.path.exists(MENTORS_PATH):
                try:
                    with open(MENTORS_PATH, "r", encoding="utf-8") as f:
                        mentors = json.load(f).get("reviewers", [])
                except Exception:
                    pass

            response = {
                "pending": pending,
                "stats": stats,
                "leaderboard": leaderboard,
                "mentors": mentors
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/action":
            content_length = int(self.headers["Content-Length"])
            body = self.rfile.read(content_length).decode("utf-8")
            params = json.loads(body)

            action_type = params.get("action_type")
            logs = []
            result_data = {}

            # Execute action
            if action_type == "assign":
                # Flow 1: Issue assignment request (/assign)
                claimant = params.get("comment_user", "test-user")
                
                # 1. Run select-issue-mentors.js
                env = os.environ.copy()
                env["ISSUE_CLAIMANT"] = claimant
                env["EXCLUDED_MENTORS"] = "[]"
                env["MAX_MENTORS"] = "2"
                
                p1 = subprocess.run(
                    ["node", ".github/scripts/select-issue-mentors.js"],
                    cwd=REPO_DIR,
                    env=env,
                    capture_output=True,
                    text=True
                )
                logs.append(f"select-issue-mentors.js stdout:\n{p1.stdout}")
                if p1.stderr:
                    logs.append(f"select-issue-mentors.js stderr:\n{p1.stderr}")

                selected_result = {}
                try:
                    selected_result = json.loads(p1.stdout)
                except Exception as e:
                    logs.append(f"Failed to parse selected mentors output: {str(e)}")

                selected_mentors = selected_result.get("selected", [])
                
                # 2. Run update-pending-assignments.js
                env2 = os.environ.copy()
                env2["OPERATION"] = "queue"
                env2["ISSUE_NUMBER"] = "1"
                env2["CLAIMANT"] = claimant
                env2["SELECTED_MENTORS"] = json.dumps(selected_mentors)

                p2 = subprocess.run(
                    ["node", ".github/scripts/update-pending-assignments.js"],
                    cwd=REPO_DIR,
                    env=env2,
                    capture_output=True,
                    text=True
                )
                logs.append(f"update-pending-assignments.js stdout:\n{p2.stdout}")
                if p2.stderr:
                    logs.append(f"update-pending-assignments.js stderr:\n{p2.stderr}")

                result_data = {
                    "claimant": claimant,
                    "selected_mentors": selected_mentors,
                    "comment_body": f"## ⏳ Assignment Queued — Awaiting Mentor Approval\n\n@{claimant} your request has been **queued**.\n\nThe following active mentor(s) have been notified:\n\n> " + " and ".join([f"@{m}" for m in selected_mentors])
                }

            elif action_type == "approve":
                # Flow 2: Mentor approval (/approve-assignment @user)
                approver = params.get("comment_user", "srinadhtadikonda")
                
                env = os.environ.copy()
                env["OPERATION"] = "approve"
                env["ISSUE_NUMBER"] = "1"
                env["APPROVER"] = approver

                p = subprocess.run(
                    ["node", ".github/scripts/update-pending-assignments.js"],
                    cwd=REPO_DIR,
                    env=env,
                    capture_output=True,
                    text=True
                )
                logs.append(f"update-pending-assignments.js stdout:\n{p.stdout}")
                if p.stderr:
                    logs.append(f"update-pending-assignments.js stderr:\n{p.stderr}")

                approved_result = {}
                try:
                    approved_result = json.loads(p.stdout)
                except Exception as e:
                    logs.append(f"Failed to parse approve output: {str(e)}")

                if approved_result.get("ok"):
                    claimant = approved_result.get("claimant", "test-user")
                    result_data = {
                        "ok": True,
                        "claimant": claimant,
                        "approver": approver,
                        "comment_body": f"## ✅ Issue Assigned\n\nAssigned to @{claimant} — approved by @{approver}."
                    }
                else:
                    result_data = {
                        "ok": False,
                        "error": approved_result.get("error"),
                        "authorized": approved_result.get("authorized", [])
                    }

            elif action_type == "pr_review":
                # Flow 4: Submit a review
                reviewer = params.get("comment_user", "ritika")
                body = params.get("comment_body", "LGTM")
                state = params.get("review_state", "APPROVED")
                pr_merged = params.get("pr_merged", "true") == "true"
                review_id = params.get("review_id", "99999")

                # 1. Run detect-low-effort-review.js
                env1 = os.environ.copy()
                env1["REVIEW_BODY"] = body
                env1["REVIEW_STATE"] = state

                p1 = subprocess.run(
                    ["node", ".github/scripts/detect-low-effort-review.js"],
                    cwd=REPO_DIR,
                    env=env1,
                    capture_output=True,
                    text=True
                )
                logs.append(f"detect-low-effort-review.js stdout:\n{p1.stdout}")
                
                low_effort_res = {}
                try:
                    low_effort_res = json.loads(p1.stdout)
                except Exception as e:
                    logs.append(f"Failed to parse low-effort output: {str(e)}")

                is_low_effort = low_effort_res.get("lowEffort", False)

                # 2. Run update-mentor-stats.js
                env2 = os.environ.copy()
                env2["REVIEWER"] = reviewer
                env2["REVIEW_STATE"] = state.lower()
                env2["REVIEW_ID"] = review_id
                env2["REVIEWED_AT"] = "2026-05-22T04:14:32Z"
                env2["PR_MERGED"] = "true" if pr_merged else "false"
                env2["IS_PRIORITY"] = "false"
                env2["IS_ASSIGNMENT_APPROVAL"] = "false"
                env2["IS_LOW_EFFORT"] = "true" if is_low_effort else "false"

                p2 = subprocess.run(
                    ["node", ".github/scripts/update-mentor-stats.js"],
                    cwd=REPO_DIR,
                    env=env2,
                    capture_output=True,
                    text=True
                )
                logs.append(f"update-mentor-stats.js stdout:\n{p2.stdout}")
                if p2.stderr:
                    logs.append(f"update-mentor-stats.js stderr:\n{p2.stderr}")

                # 3. Regenerate leaderboard
                p3 = subprocess.run(
                    ["node", ".github/scripts/generate-mentor-leaderboard.js"],
                    cwd=REPO_DIR,
                    capture_output=True,
                    text=True
                )
                logs.append(f"generate-mentor-leaderboard.js stdout:\n{p3.stdout}")

                result_data = {
                    "reviewer": reviewer,
                    "is_low_effort": is_low_effort,
                    "warning_comment": "⚠️ Low-effort mentor review detected. Please provide actionable feedback." if is_low_effort else None
                }

            elif action_type == "generate_leaderboard":
                # Regenerate leaderboard explicitly
                p = subprocess.run(
                    ["node", ".github/scripts/generate-mentor-leaderboard.js"],
                    cwd=REPO_DIR,
                    capture_output=True,
                    text=True
                )
                logs.append(f"generate-mentor-leaderboard.js stdout:\n{p.stdout}")
                result_data = {"ok": True}

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {
                "logs": "\n".join(logs),
                "data": result_data
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        elif parsed.path == "/api/reset":
            # Reset files to clean states
            with open(PENDING_PATH, "w", encoding="utf-8") as f:
                f.write(json.dumps({"assignments": []}, indent=2) + "\n")
            with open(STATS_PATH, "w", encoding="utf-8") as f:
                f.write(json.dumps({"mentors": {}}, indent=2) + "\n")
            if os.path.exists(LEADERBOARD_PATH):
                os.remove(LEADERBOARD_PATH)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        elif parsed.path == "/api/restore":
            restore_files()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        self.send_error(404, "Not Found")

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), TestServerHandler) as httpd:
        print(f"Test server running on port {PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            restore_files()
