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

# Contribution Workflow

1. Fork the repository
2. Create a branch from `main`
3. Make your changes
4. Commit your work
5. Push to your fork
6. Open a Pull Request

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

| Type | Description |
|-----|-------------|
| docs | Documentation updates |
| fix | Bug fixes |
| feat | New features |
| refactor | Internal improvements |

---

# Pull Request Guidelines

- Reference the issue number (`Closes #issue`)
- Keep changes minimal
- Follow project style
- Do **not introduce build tools or dependencies**

Small PRs are **easier to review and merge**.

---

# Testing and Verification

Before submitting a PR:

Run the project locally:

```bash
vercel dev
```

Verify:

- Edge functions run correctly
- No build step is introduced
- No dependencies added
- Existing behavior remains unchanged

---

# Need Help?

If unsure:

- Open an issue
- Ask in the discussion thread

- #  Contributing Guide

Thank you for your interest in contributing! 🎉  
This guide will help you get started quickly.

---

##  Setup Instructions

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/repo-name.git
cd repo-name
