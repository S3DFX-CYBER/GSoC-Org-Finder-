import os
import sys
import subprocess
import time
from playwright.sync_api import sync_playwright

REPO_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SERVER_PATH = os.path.join(REPO_DIR, ".github", "tests", "test_server.py")
RECORDINGS_DIR = r"C:\Users\adith\.gemini\antigravity-ide\browser_recordings"

def run_tests():
    print("Starting simulator server...")
    # Launch the server in a subprocess
    server_proc = subprocess.Popen(
        [sys.executable, SERVER_PATH],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for server to start
    time.sleep(2)
    
    os.makedirs(RECORDINGS_DIR, exist_ok=True)
    
    success = False
    try:
        with sync_playwright() as p:
            print("Launching browser...")
            # We run headless=True to execute in background reliably, but still take full screenshots
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            
            print("Navigating to simulator page...")
            page.goto("http://localhost:8000/.github/tests/simulator.html")
            
            # Scenario 1: Initial load
            print("Running Scenario 1: Initial state validation...")
            page.wait_for_selector("text=Comment")
            page.screenshot(path=os.path.join(RECORDINGS_DIR, "01_initial_state.png"))
            print("Scenario 1 passed. Screenshot saved.")
            
            # Scenario 2: /assign command
            print("Running Scenario 2: Issue assignment request...")
            page.select_option("#comment-user", value="contrib1")
            page.fill("#comment-text", "/assign")
            page.click("#btn-submit-comment")
            
            # Wait for execution logs and comment to append
            page.wait_for_selector("#comment-assign-queued", timeout=10000)
            page.screenshot(path=os.path.join(RECORDINGS_DIR, "02_assign_queued.png"))
            print("Scenario 2 passed: comment-assign-queued found.")
            
            # Scenario 3: /approve-assignment @contrib1 by dynamically assigned mentor
            print("Running Scenario 3: Mentor approval...")
            
            # Read from disk directly to avoid Python single-thread HTTP server lockups
            import json
            try:
                with open(os.path.join(REPO_DIR, ".github", "reviewers", "pending-assignments.json"), "r") as f:
                    data = json.load(f)
                
                # Get the first pinged mentor
                assignments = data.get("assignments", [])
                if assignments and "pinged_mentors" in assignments[0]:
                    approver = assignments[0]["pinged_mentors"][0]
                else:
                    approver = "srinadhtadikonda"
            except Exception as e:
                print(f"Warning: Failed to fetch dynamic mentor from disk, falling back. Error: {e}")
                approver = "srinadhtadikonda"
            
            print(f"Selected dynamic approver: {approver}")
            page.select_option("#comment-user", value=approver)
            page.fill("#comment-text", "/approve-assignment @contrib1")
            page.click("#btn-submit-comment")
            
            page.wait_for_selector("#comment-assign-approved", timeout=10000)
            page.screenshot(path=os.path.join(RECORDINGS_DIR, "03_assign_approved.png"))
            print("Scenario 3 passed: comment-assign-approved found.")
            
            # Scenario 4: PR Simulator & Low-effort review
            print("Running Scenario 4: Low-effort review detection...")
            page.click("text=PR Simulator")
            page.screenshot(path=os.path.join(RECORDINGS_DIR, "04_pr_simulator_opened.png"))
            
            # Fetch valid mentors from disk
            try:
                with open(os.path.join(REPO_DIR, ".github", "reviewers", "gssoc-mentors.json"), "r") as f:
                    mentors_data = json.load(f)
                mentors_list = mentors_data.get("reviewers", [])
                reviewer1 = mentors_list[0] if len(mentors_list) > 0 else "ritika"
                reviewer2 = mentors_list[1] if len(mentors_list) > 1 else "srinadhtadikonda"
            except Exception:
                reviewer1 = "ritika"
                reviewer2 = "srinadhtadikonda"

            page.select_option("#review-user", value=reviewer1)
            page.select_option("#review-state", value="APPROVED")
            page.fill("#review-body", "LGTM")
            page.click("#btn-submit-review")
            
            # Wait for low-effort warning
            page.wait_for_selector("#comment-low-effort-warning", timeout=10000)
            page.screenshot(path=os.path.join(RECORDINGS_DIR, "05_low_effort_warning.png"))
            print("Scenario 4 passed: comment-low-effort-warning found.")
            
            # Scenario 5: High-effort review & Leaderboard update
            print("Running Scenario 5: High-effort review and leaderboard generation...")
            page.select_option("#review-user", value=reviewer2)
            page.select_option("#review-state", value="APPROVED")
            page.fill("#review-body", "Looks great! I verified the responsive grid layout on viewport resize and tested styling compliance. Code logic is flawless.")
            page.click("#btn-submit-review")
            
            # Wait for the status in pipeline card to update
            page.wait_for_selector("text=Mentor approved", timeout=10000)
            
            # View Stats
            page.click("text=mentor-stats.json")
            page.screenshot(path=os.path.join(RECORDINGS_DIR, "06_stats_json.png"))
            
            # View Leaderboard
            page.click("text=Leaderboard MD Render")
            page.screenshot(path=os.path.join(RECORDINGS_DIR, "07_leaderboard_rendered.png"))
            print("Scenario 5 passed: leaderboard update complete.")
            
            browser.close()
            success = True
            
    except Exception as e:
        print(f"Browser testing encountered an error: {str(e)}", file=sys.stderr)
    finally:
        print("Cleaning up local files...")
        # Post restore API call to clean up modified files in repo
        try:
            import urllib.request
            req = urllib.request.Request("http://localhost:8000/api/restore", method="POST")
            urllib.request.urlopen(req)
            print("Local files restored successfully.")
        except Exception as err:
            print(f"Failed to restore local files via API: {str(err)}", file=sys.stderr)
            
        print("Stopping test server...")
        server_proc.terminate()
        try:
            server_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server_proc.kill()
            
    if success:
        print("\nAll browser tests executed successfully!")
        sys.exit(0)
    else:
        print("\nBrowser testing failed.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
