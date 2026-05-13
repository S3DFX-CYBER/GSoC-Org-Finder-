# GSSoC'26 Mentor Guide

Welcome to the **GirlScript Summer of Code 2026** mentor guide for FindMyGSoC!

As a GSSoC mentor, you play a critical role in guiding contributors, reviewing PRs, and maintaining code quality throughout the program.

---

## Mentor Responsibilities

### Core Duties

- Review PRs from GSSoC contributors within 24–72 hours
- Provide constructive, actionable feedback on submissions
- Ensure contributions meet project quality standards
- Help contributors understand the codebase and architecture
- Label and triage GSSoC-related issues
- Identify and flag spam, AI-slop, or low-quality submissions

### Communication

- Be respectful and encouraging in all interactions
- Provide clear explanations when requesting changes
- Guide contributors toward better solutions rather than just rejecting work
- Respond to questions on issues and PRs in a timely manner

---

## Getting Started as a Mentor

### Access & Setup

1. You will be added to the `gssoc-mentors.json` file in `.github/reviewers/`
2. The automated reviewer rotation system will assign PRs to you
3. You will receive GitHub notifications for assigned reviews

### Repository Familiarity

Before reviewing contributions, ensure you understand:

- The zero-build, zero-dependency architecture
- The Vercel Edge Function API (`/api/github.js`)
- The frontend structure (vanilla HTML/CSS/JS)
- The automated workflow system (PR validation, assignment bot, etc.)
- The level system (Level 1/2/3) and what each entails

---

## PR Review Process — 3-Stage Pipeline

As a GSSoC mentor, you are the key reviewer in Stage 2. Here is how the full pipeline works and where you fit in.

### Stage 1 — Automated Validation (Bot)

Before a PR reaches you, bots automatically verify:

| Check | What it verifies |
|-------|-----------------|
| DCO Sign-off | Every commit has `Signed-off-by` line |
| PR Format | Conventional title, linked issue, template sections filled |
| AI/Slop Detection | Flags AI-generated or low-effort submissions |
| Duplicate Detection | Checks for duplicate PRs against open PRs |

PRs that fail Stage 1 are blocked from reaching you. The contributor must fix the issues first.

### Stage 2 — Mentor Review (You)

Once Stage 1 passes, the PR is routed to you via the automated reviewer assignment system.

**Your workflow:**

1. You receive a GitHub review request notification
2. Review the code for quality, correctness, and project fit (see checklist below)
3. Either **Approve** (adds `gssoc-mentor-approved` label automatically) or **Request Changes**
4. If you request changes, wait for the contributor to push fixes, then re-review
5. Once you approve, the PR advances to Stage 3

**Labels you'll see:**

| Label | Meaning |
|-------|---------|
| `mentor-review-requested` | PR assigned to you for review |
| `gssoc-mentor-approved` | You (or another mentor) approved — advances to Stage 3 |
| `needs-stage-1-fixes` | Stage 1 checks failed — not ready for your review yet |

### Stage 3 — Maintainer / PA Review

After your approval, the project admin (@S3DFX-CYBER) performs the final merge decision:

- Confirms the PR aligns with project direction and architecture
- Checks for security or performance concerns you may have flagged
- Merges the PR and awards points

You do not need to take action during Stage 3, but the maintainer may ask you for additional context.

### Pipeline Status Comment

Every PR has an auto-updating **PR Review Pipeline** status comment showing the current stage. You can use this to quickly see where a PR stands.

### What to Check

| Area | What to Verify |
|------|---------------|
| Functionality | Does it work as described? |
| Code Quality | Is it clean, readable, maintainable? |
| Architecture | Does it follow the zero-build philosophy? |
| Dependencies | Are any unnecessary libraries added? |
| Security | Are there XSS, injection, or other vulnerabilities? |
| Performance | Does it maintain fast page load? |
| Accessibility | Are a11y standards maintained? |
| Responsiveness | Does it work across device sizes? |

### Review Actions

- **Approve** — Code meets all standards, ready to merge
- **Request Changes** — Specific issues need fixing (provide clear instructions)
- **Comment** — Questions or suggestions that don't block merging

---

## Handling Common Issues

### AI-Generated Submissions

Watch for:
- Generic, overly-commented code
- Code that doesn't match the contributor's past skill level
- Submissions that don't follow the project's existing patterns
- Responses that seem copy-pasted from AI tools

Action: Request the contributor to explain their implementation. If confirmed AI-slop, close the PR.

### Point Farming

Watch for:
- Multiple tiny PRs that could be one
- Trivial changes dressed up as meaningful contributions
- Unnecessary refactors that add no value
- Documentation spam

Action: Close low-value PRs and explain why. Label as appropriate.

### Duplicate Work

Watch for:
- PRs that solve the same issue as another open PR
- Contributors working on unassigned issues

Action: Close the duplicate, direct to the original.

---

## Level Guidelines for Review

### Level 1 (10 pts) — Beginner

- Be more lenient with code style
- Provide educational feedback
- Focus on whether the change works correctly
- Guide contributors toward improvement

### Level 2 (25 pts) — Intermediate

- Expect clean code and proper patterns
- Verify logic correctness
- Check edge cases
- Ensure proper error handling where appropriate

### Level 3 (45 pts) — Advanced

- Apply strict code review standards
- Verify performance implications
- Check security considerations
- Ensure architectural consistency
- Require thorough testing evidence

---

## Mentor Best Practices

### Do

- Review PRs within 24–72 hours
- Provide specific line-by-line feedback
- Suggest improvements with code examples when possible
- Acknowledge good work and effort
- Escalate security concerns to maintainers immediately
- Keep the GSSoC leaderboard in mind when approving level-appropriate issues

### Don't

- Ignore PRs for extended periods
- Provide vague or unhelpful feedback
- Approve low-quality work just to clear your queue
- Be harsh or discouraging to beginners
- Merge PRs that introduce dependencies or build tools
- Override the automated validation system

---

## Escalation

Escalate to the project maintainer (@S3DFX-CYBER) when:

- A security vulnerability is found
- A contributor is being disrespectful or abusive
- You encounter systematic spam or abuse
- Architectural decisions need maintainer input
- You are unsure about a complex merge

---

## Tools & Automation

The following automated systems support your work:

| System | Purpose |
|--------|---------|
| PR Validator | Checks PR structure and template compliance |
| Duplicate Detection | Flags potential duplicate PRs |
| AI-Slop Detector | Identifies AI-generated spam |
| Reviewer Rotation | Distributes PRs across mentors fairly |
| Label Sync | Maintains consistent labeling |
| Stage Manager | Moves PRs through the review pipeline |

---

## Resources

- [GSSoC Official Website](https://gssoc.girlscript.org/)
- [GSSoC Mentor Guidelines](https://gssoc.girlscript.org/guidelines/mentor)
- [Project Contributing Guide](../CONTRIBUTING.md)
- [Project Discord](https://discord.gg/mgWV3xSV7)

---

## Contact

- Project Maintainer: [@S3DFX-CYBER](https://github.com/S3DFX-CYBER)
- Discord: [https://discord.gg/mgWV3xSV7](https://discord.gg/mgWV3xSV7)

Thank you for mentoring with GSSoC!
