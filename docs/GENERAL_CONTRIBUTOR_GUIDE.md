# General Contributor Guide

---

### 🌐 Navigation
[🏠 Home (README)](../README.md) • [🤝 Contributing Guide](../CONTRIBUTING.md) • [📜 Code of Conduct](../CODE_OF_CONDUCT.md) • [🛡️ Security Policy](../SECURITY.md)

---

Welcome! This guide is tailored for open-source contributors wishing to improve FindMyGSoC **outside** of any structured program (such as GirlScript Summer of Code or Nexus Spring of Code). 

Whether you found a bug, want to add a feature, or want to enhance accessibility, we are excited to review your contributions.

---

## 🚀 Getting Started

### Step 1 — Find an Open Issue
Visit the [GitHub Issues tab](https://github.com/S3DFX-CYBER/GSoC-Org-Finder-/issues) and filter using search parameters. Focus on:
*   Issues **without** program-specific tags like `gssoc26` or `nsoc26`.
*   Issues labeled `good first issue` for beginner tasks.
*   Issues labeled `help wanted` for tasks seeking active help.

> [!NOTE]
> Check assignment eligibility constraints:
> *   **Beginner (`level:beginner`):** Available to anyone.
> *   **Intermediate (`level:intermediate`):** Account must be ≥ 30 days old.
> *   **Advanced (`level:advanced`):** Requires at least 1 previously merged PR.

### Step 2 — Request Assignment
Comment on the target issue with:
```
/assign
```
Include a note stating: *"I would like to work on this issue as a general contributor."*

### Step 3 — Start Development
Once the automated bot registers your request and confirms assignment, you are clear to begin.

---

## 🛠️ The Pull Request Workflow

### 1. Fork & Branch
Fork the repository and checkout a descriptive branch:
```bash
git clone https://github.com/your-username/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-
git checkout -b feat/your-feature-name
```
Branch prefix rules:
*   `feat/` — for new features (e.g. `feat/search-filter`)
*   `fix/` — for bug fixes (e.g. `fix/modal-overflow`)
*   `docs/` — for documentation improvements (e.g. `docs/update-setup`)

### 2. Implementation Style
*   **Vanilla First:** Follow our zero-build and vanilla frontend philosophy. No client framework integrations or extra npm dependencies are allowed.
*   **Style Cleanliness:** Ensure your edits pass all local style rule checks.

### 3. Signed-Off Commits (Mandatory)
Every commit **MUST** be signed off using the `-s` flag to verify the Developer Certificate of Origin (DCO):
```bash
git commit -s -m "feat: descriptive message here"
```
Adhere to the [Conventional Commits](https://www.conventionalcommits.org/) standards.

### 4. Push & Open PR
```bash
git push origin feat/your-feature-name
```
Select the **General PR Template** when opening your PR on GitHub, and ensure you link the target issue explicitly:
```
Closes #issue-number
```

---

## 🚦 PR Review Pipeline (3-Stage Workflow)

All pull requests pass through an automated 3-stage validation pipeline:

| Stage | Process | Label |
| :--- | :--- | :--- |
| **Stage 1: Automated Checks** | DCO signature, format validation, duplicate scan, AI slop analysis, and a security audit via the **TENET AI Agent** using Gemini. | `stage-1-approved` |
| **Stage 2: Code Review** | Active community mentors verify code execution, performance, responsive spacing, and styling standards. | `mentor-approved` |
| **Stage 3: Project Admin Gate** | Final checks, administrative merging, and update to the public leaderboards by the Project Admin. | `pa-approved` |

---

## ⚖️ Dos and Don'ts

### ✅ Do:
*   Test all visual styling responsiveness locally across mobile, tablet, and desktop viewports.
*   Write clear, semantic HTML and keep JavaScript modules organized.
*   Sign off all commits (`git commit -s`).
*   Be helpful and constructive in discussion comments.

### ❌ Do NOT:
*   Self-assign using the GitHub interface (always comment `/assign` for the bot).
*   Add arbitrary npm libraries or bundlers.
*   Ping mentors or the project admin repeatedly for reviews.
*   Submit unverified or blind AI-generated code.
