# GSSoC'26 Contributor Guide

---

## 🌐 Navigation
[🏠 Home (README)](../README.md) • [🤝 Contributing Guide](../CONTRIBUTING.md) • [📜 Code of Conduct](../CODE_OF_CONDUCT.md) • [🛡️ Security Policy](../SECURITY.md)

---

Welcome to the **GirlScript Summer of Code 2026** contributor guide!

GirlScript Summer of Code (GSSoC) is a 3-month open-source program conducted by the GirlScript Foundation. This guide will help you understand our program-specific timelines, point systems, assignment mechanisms, and the review guidelines to ensure high-quality contributions.

---

## 📅 Timeline & Assignment Limits

### Assignment Milestones
*   **Before 15 May 2026:** GSSoC assignments are blocked (pre-program phase).
*   **15 May 2026 Onwards:** GSSoC assignment queue is officially open.

### 🛑 Maximum Active Assignments Limit
To maintain program fairness, GSSoC contributors are restricted to a maximum of **3 active assigned issues** at any single time.

---

## 🏆 Contribution Levels & Program Points

When your PR is successfully merged, points are automatically added to the GSSoC leaderboard according to the issue level:

| Issue Level | Difficulty Label | Program Points | Typical Examples |
| :--- | :--- | :--- | :--- |
| **Beginner** | `level:beginner` | **10 Points** | Documentation typos, basic CSS tweaks, accessibility improvements, small UI updates. |
| **Intermediate**| `level:intermediate`| **25 Points** | Filter algorithm improvements, local cache systems, search optimization, API validations. |
| **Advanced** | `level:advanced` | **45 Points** | Performance tune-ups, core architecture refactoring, security fixes. |

---

## 📋 The Automated Assignment Process

We use an automated assignment queue. Please do not ask maintainers to assign issues manually.

### Step 1 — Comment on the Issue
Request the issue by commenting:
```text
/assign gssoc
```
> [!IMPORTANT]
> You **must** include the `gssoc` tag in your command, or the bot will not register your request.

### Step 2 — Bot Verification & Eligibility
The assignment bot checks the following criteria:
*   The issue is currently unassigned.
*   Your current active issues count is under the limit of **3**.
*   Difficulty level requirements are satisfied:
    *   **Beginner:** No restrictions.
    *   **Intermediate:** Account must be at least **30 days old**.
    *   **Advanced:** You must have at least **1 previously merged PR** in this repository.

### Step 3 — Mentor Approval Queue
Once criteria are verified, two active mentors are randomly selected and requested to review your request.
*   Mentors approve assignments via the `/approve-assignment @username` command.
*   Mentors have **24 hours** to respond, after which they are automatically rotated to keep the queue moving.

> [!WARNING]
> Do **NOT** start coding or submit a PR before the bot confirms your assignment on the issue.

---

## 🛠️ Step-by-Step PR Submission

1.  **Fork & Clone:** Clone your fork locally and create a branch:
    ```bash
    git clone https://github.com/your-username/GSoC-Org-Finder-.git
    cd GSoC-Org-Finder-
    git checkout -b feat/your-feature-name
    ```
2.  **Commit with Sign-Off (DCO):** All commits must be signed off to pass Stage 1 check:
    ```bash
    git commit -s -m "feat: your conventional commit message"
    ```
3.  **Submit PR:** Use the **GSSoC PR Template** when opening your pull request. Link the issue in your PR description:
    ```text
    Closes #issue-number
    ```

---

## 💤 Inactivity & Reclaiming Policy

*   If an assigned issue shows no progress (linked PR, draft PR, or descriptive updates) for **7 days**, you will be automatically unassigned by the stale bot.
*   If you are unassigned due to inactivity, you must wait **24 hours** before re-requesting assignment on that same issue.
*   To manually release an issue you are unable to complete, comment `/unassign`.

---

## 🔗 Program Resources
*   [GSSoC Official Website](https://gssoc.girlscript.tech)
*   [GSSoC Contributor Guidelines](https://gssoc.girlscript.tech/guidelines)

