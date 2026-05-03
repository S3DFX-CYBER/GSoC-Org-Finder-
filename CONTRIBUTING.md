# Contributing Guide

## Project Philosophy

This repository follows a **zero-build, zero-dependency philosophy**.

## Principles

- No build tools
- No unnecessary dependencies
- Minimal runtime overhead
- Simple and readable code

When contributing, avoid adding libraries, bundlers, or complex tooling **unless clearly justified**.

---

# Architecture

The project is built using **Vercel Edge Functions**.

## Key Characteristics

- Serverless execution at the edge
- Fast global responses
- Minimal backend infrastructure
- Lightweight runtime environment

Changes should remain compatible with the **Edge Function architecture**.

---

# Local Development

## Install Vercel CLI

```bash
npm install -g vercel
```

## Clone Repository

```bash
git clone https://github.com/<repo>.git
cd <repo>
```

## Run Locally

```bash
vercel dev
```

This command simulates the **Vercel environment locally**.

---

# How to Start Contributing

1. Go to the **Issues** tab
2. Filter by issue labels (`level-1`, `level-2`, `level-3`)
3. Comment **"assign me"** on the issue
4. Wait for maintainer assignment
5. Start working only after assignment

---

# Contribution Workflow

1. Fork the repository
2. Create a branch from `main`
3. Make your changes
4. Commit your work
5. Push to your fork
6. Open a Pull Request

---

# Issue Assignment (Mandatory)

- You must **comment "assign me"** before starting work
- Wait for assignment from a maintainer
- PRs without assignment may be **closed without review**

## Inactive Policy

- If no progress is made within **2–3 days**, the issue may be unassigned
- Other contributors can claim it afterward

---

# Contribution Levels

## Level 1 — Beginner Friendly
- Open to all contributors
- Ideal for first-time contributors
- Includes:
  - UI fixes
  - Minor bugs
  - Documentation updates

## Level 2 — Intermediate
- Requires understanding of the codebase
- Includes:
  - Logic improvements
  - Feature enhancements
  - Performance tweaks

## Level 3 — Advanced (Restricted)
- Only for experienced contributors
- Requires **at least 1–2 merged PRs in this repository**
- Includes:
  - Core features
  - Architecture changes
  - Complex optimizations

Maintainers will **not assign Level 3 issues** to new contributors.

---

# Create Branch

```bash
git checkout -b feature/short-description
```

---

# Commit Message Convention

## Format

```
type: short description
```

## Examples

```
docs: add contributing guide
fix: correct edge function handler
feat: improve request validation
```

## Common Types

| Type     | Description                     |
|----------|---------------------------------|
| docs     | Documentation updates           |
| fix      | Bug fixes                       |
| feat     | New features                    |
| refactor | Internal improvements           |

---

# Contribution Quality Standards

## Important Rules

- Contributions must be **written and understood by the contributor**
- Do not submit code you do not understand
- Keep changes minimal and focused

## Disallowed Contributions

- AI-generated or agentic PRs without proper understanding
- Copy-paste or low-effort submissions
- Spam PRs or repeated low-quality contributions

Such PRs may be **closed without detailed review**

---

# Pull Request Guidelines

- Issue must be assigned to you
- Reference the issue (`Closes #issue`)
- Keep changes minimal
- Follow project style
- Do **not introduce dependencies**

---

# PR Checklist (Required)

Before submitting:

- [ ] Issue is assigned to me
- [ ] PR is linked to an issue
- [ ] No dependencies added
- [ ] Code follows project philosophy
- [ ] Changes are minimal and focused
- [ ] Proper explanation is provided

For UI changes:

- [ ] Screenshots attached

---

# Testing and Verification

Before submitting a PR:

Run locally:

```bash
vercel dev
```

Verify:

- Edge functions run correctly
- No build step is introduced
- No dependencies added
- Existing behavior remains unchanged

---

# Review Process

- PRs are reviewed within **24–48 hours**
- Changes may be requested before approval
- Approval depends on:
  - Code quality
  - Simplicity
  - Adherence to project philosophy

Not all PRs are guaranteed to be merged

---

# Need Help?

If unsure:

- Open an issue
- Ask in discussions

---

# Getting Started

Thank you for your interest in contributing! 🎉

## Setup Instructions

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/repo-name.git
cd repo-name
```
