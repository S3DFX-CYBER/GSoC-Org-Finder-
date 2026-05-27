# NSoC'26 (Nexus Spring of Code) Guide

---

## 🌐 Navigation
[🏠 Home (README)](../README.md) • [🤝 Contributing Guide](../CONTRIBUTING.md) • [📜 Code of Conduct](../CODE_OF_CONDUCT.md) • [🛡️ Security Policy](../SECURITY.md)

---

Welcome to the **Nexus Spring of Code 2026** contributor guide!

NSoC is an open-source program by the Nirmaan Organization that connects contributors with real-world projects. This guide outlines program timeline rules, assignment workflows, points logic, and standard guidelines for your NSoC contributions.

**Official Website:** [https://www.nsoc.in/](https://www.nsoc.in/)

---

## 📅 NSoC Timeline & Limits

### Timeline Advantage
Unlike other structured programs, NSoC contributors can request assignments **immediately**. There are no pre-program date restrictions on issue claiming!

### 🛑 Maximum Active Assignments Limit
To ensure balanced issue distribution, NSoC contributors are limited to a maximum of **3 active assigned issues** at any single time.

---

## 🏆 Contribution Levels & Difficulty Labels

Issues are classified under three levels:

| NSoC Level | Difficulty Label | Typical Examples |
| :--- | :--- | :--- |
| **Level 1** | `level1` / `level:beginner` | Small HTML alterations, typography, styling tweaks, minor bugs, and documentation fixes. |
| **Level 2** | `level2` / `level:intermediate` | Feature filters, recommendation matching logic, caching adjustments, and Vercel proxy updates. |
| **Level 3** | `level3` / `level:advanced` | Core performance profiling, security patches, and structural modules. |

---

## 📋 The Automated Assignment Workflow

Issue assignments are handled through automated workflows to ensure transparency. Do not ask mentors for manual assignments.

### Step 1 — Request Assignment
Find an open issue containing the `nsoc26` label. Comment on it with:
```bash
/assign nsoc
```
> [!IMPORTANT]
> You **must** include the `nsoc` parameter in the command, or the bot will ignore your request.

### Step 2 — Automatic Eligibility Checks
The bot evaluates your request against the following constraints:
*   The issue is unassigned.
*   Your active assigned issue count is under the limit of **3**.
*   Your GitHub account is at least **7 days old**.
*   Difficulty prerequisites are satisfied:
    *   **Level 1:** Open to everyone.
    *   **Level 2:** Your GitHub account must be at least **30 days old** to auto-assign.
    *   **Level 3:** Requires at least **1 previously merged PR** in this repository.

### Step 3 — Bot Confirmation
Once verified, the bot will post a confirmation comment. Do **NOT** start working or open a PR until this confirmation is posted.

---

## 🛠️ Step-by-Step PR Submission

1.  **Fork & Clone:** Clone your fork and create a clean development branch:
    ```bash
    git clone https://github.com/your-username/GSoC-Org-Finder-.git
    cd GSoC-Org-Finder-
    git checkout -b feat/your-feature-name
    ```
2.  **Commit with Sign-Off:** Verify that all commits are signed off to pass the DCO checks:
    ```bash
    git commit -s -m "feat: descriptive commit message"
    ```
3.  **Open PR:** Select the **NSoC PR Template** when opening your PR. Link the assigned issue in the PR description:
    ```text
Closes #issue-number
```

---

## 💤 Inactivity Expiry (7-Day Rule)

*   Assigned issues with no progress (linked PR, draft PR, or descriptive status updates) for **7 days** are automatically unassigned.
*   If you are unassigned due to inactivity, you must wait **24 hours** before re-requesting assignment on that same issue.
*   To manually release an issue you are unable to complete, comment `/unassign`.
