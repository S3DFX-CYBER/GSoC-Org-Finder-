# Contributing Guide

## Project Philosophy

This repository follows a **zero-build, zero-dependency philosophy**.

### Principles

- No build tools
- No unnecessary dependencies
- Minimal runtime overhead
- Simple and readable code

When contributing, avoid adding libraries, bundlers, or complex tooling **unless clearly justified**.

---

## Architecture

The project is built using **Vercel Edge Functions**.

### Key Characteristics

- Serverless execution at the edge
- Fast global responses
- Minimal backend infrastructure
- Lightweight runtime environment

Changes should remain compatible with the **Edge Function architecture**.

---

## Local Development

### Install Vercel CLI
```bash
npm install -g vercel
```

### Clone Repository
```bash
git clone https://github.com/S3DFX-CYBER/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-
```

### Run Locally
```bash
vercel dev
```

This command simulates the Vercel environment locally.

---

## How to Start Contributing

1. Go to the **Issues** tab
2. Filter by issue labels (`level-1`, `level-2`, `level-3`)
3. Comment `"assign me"` on the issue
4. Wait for maintainer assignment
5. Start working **only after assignment**

---

## Contribution Workflow

1. Fork the repository
2. Create a branch from `main`
3. Make your changes
4. Commit your work
5. Push to your fork
6. Open a Pull Request

### Create Branch
```bash
git checkout -b feature/short-description
```

### Commit Message Convention

**Format**
```
type: short description
```

**Examples**
```
docs: add contributing guide
fix: correct edge function handler
feat: improve request validation
```

**Common Types**

| Type | Description |
|---|---|
| `docs` | Documentation updates |
| `fix` | Bug fixes |
| `feat` | New features |
| `refactor` | Internal improvements |

---

## Issue Assignment (Mandatory)

- You **must** comment `"assign me"` before starting work
- Wait for assignment from a maintainer
- PRs without assignment may be closed without review

### Inactive Policy

If no progress is made within 2–3 days, the issue may be unassigned and other contributors can claim it.

---

## Contribution Levels

### Level 1 — Beginner Friendly
Open to all contributors. Ideal for first-time contributors.

Includes:
- UI fixes
- Minor bugs
- Documentation updates (with meaningful new content)

### Level 2 — Intermediate
Requires understanding of the codebase.

Includes:
- Logic improvements
- Feature enhancements
- Performance tweaks

### Level 3 — Advanced *(Restricted)*
Only for experienced contributors. Requires **at least 1–2 merged PRs** in this repository.

Includes:
- Core features
- Architecture changes
- Complex optimizations

> Maintainers will not assign Level 3 issues to new contributors.

**Labels are assigned by maintainers, not contributors.** If you believe a label is incorrect on your PR, leave a comment explaining why — do not change it yourself.

---

## ⚠️ NSoC'26 Contribution Quality Standards

This project participates in **NSoC'26**. All contributors are required to maintain fairness, integrity, and quality in every submission. These standards are actively enforced.

### Strictly Prohibited

The following will result in PR rejection, label corrections, or point deductions per NSoC'26 policy:

- Assigning **high-level labels** (e.g. Level 3) to trivial tasks
- PRs with **2–3 line changes** submitted as major work
- Multiple **README-only or documentation-only** PRs without meaningful new content
- PRs with **0 code changes** counted as development contributions
- **Merging PRs without proper review** or quality checks

### What Makes a Valid Contribution

Before opening a PR, ask: *"Does this make the project meaningfully better for users or maintainers?"*

**Valid contributions include:**
- Fixing a bug with a clear reproduction case
- Implementing a scoped feature from the issue tracker
- Improving performance with an explainable impact
- Refactoring for readability with a clear before/after rationale
- Documentation that fills a genuine gap with substantial new content

### Disallowed Contributions

- AI-generated or agentic PRs submitted without understanding the code
- Copy-paste or low-effort submissions
- Spam PRs or repeated low-quality contributions

Such PRs may be closed without detailed review.

### Compliance Enforcement

Failure to comply may result in:

- PR closure or reversal of previously merged work
- Label corrections affecting NSoC'26 point totals
- Rejection of low-quality work
- Escalation to the NSoC'26 team for repeated violations

### For Project Admins

- Re-review recently merged PRs for incorrect labels or insufficient review
- Correct labels where difficulty was overstated
- Do not merge PRs without a review comment confirming the change was tested
- Reject low-quality submissions with a brief explanation so contributors can improve

---

## Pull Request Guidelines

- Issue must be **assigned to you** before opening a PR
- Reference the issue with `Closes #issue-number`
- Keep changes **minimal and focused** — one logical change per PR
- Follow project style and philosophy
- Do not introduce new dependencies

### PR Checklist *(Required)*

Before submitting:

- [ ] Issue is assigned to me
- [ ] PR is linked to an issue (`Closes #N`)
- [ ] No dependencies added
- [ ] Code follows zero-build, zero-dependency philosophy
- [ ] Changes are minimal and focused
- [ ] Clear explanation provided in the PR description
- [ ] Code is written and understood by me (no unreviewed AI-generated submissions)

For UI changes:

- [ ] Screenshots attached

---

## Testing and Verification

Before submitting a PR, run locally:

```bash
vercel dev
```

Verify:

- Edge functions run correctly
- No build step is introduced
- No new dependencies added
- Existing behavior remains unchanged

---

## Review Process

- PRs are reviewed within **24–48 hours**
- Changes may be requested before approval
- Approval depends on: code quality, simplicity, and adherence to project philosophy
- Not all PRs are guaranteed to be merged

---

## Need Help?

If unsure about anything:

- Open an issue
- Ask in Discussions

---

Thank you for contributing to FindMyGSoC! 🎉
