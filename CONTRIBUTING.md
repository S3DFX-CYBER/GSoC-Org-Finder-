Contributing Guide

Program-Specific Guides

If you are contributing under a specific program, refer to the dedicated guide for your track:

Track	Guide

GSSoC'26 Contributors	GSSoC Contributor Guide
GSSoC'26 Mentors	GSSoC Mentor Guide
NSoC'26 Contributors	NSoC Guide
General Contributors	General Contributor Guide


The rest of this document covers the shared rules, architecture, workflows, automation systems, and contribution policies that apply to all contributors.


---

Project Philosophy

This repository follows a:

Zero-build philosophy

Minimal dependency philosophy

Static-first architecture

Edge-runtime compatible workflow


Core Principles

No unnecessary dependencies

No heavy frameworks

No bundlers unless absolutely required

Simple and maintainable code

Fast runtime performance

Lightweight APIs

Edge-compatible architecture

Human-reviewed contributions over AI-generated spam


Contributors should avoid introducing:

unnecessary npm packages

client-side frameworks

large runtime abstractions

unnecessary build pipelines

dependency-heavy tooling


unless clearly justified.


---

Architecture

The project is built using:

Layer	Technology

Frontend	Vanilla HTML/CSS/JS
Backend	Vercel Edge Functions
Hosting	Vercel
Data	Static JSON + GitHub API
Analytics	localStorage


Architecture Goals

Fully static-first deployment

Fast initial page load

Minimal API overhead

Edge-compatible runtime

No hydration complexity

Maintainable repository structure



---

Local Development

Install Vercel CLI

npm install -g vercel

Clone Repository

git clone https://github.com/S3DFX-CYBER/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-

Start Local Development

vercel dev

This simulates the Vercel Edge runtime locally.


---

Repository Structure

GSoC-Org-Finder-
├── .github/
│   ├── workflows/
│   ├── reviewers/
│   ├── scripts/
│   └── ISSUE_TEMPLATE/
├── api/
├── data/
├── docs/
├── src/
│   ├── js/
│   ├── assets/
│   └── styles.css
├── index.html
├── sw.js
└── README.md


---

How To Start Contributing

Step 1 — Find an Issue

Go to the Issues tab and filter by labels:

level:beginner

level:intermediate

level:advanced

type:bug

type:docs

type:ui

type:enhancement

type:api

gssoc26

nsoc26


Issues are automatically analyzed using repository automation.

The triage system:

categorizes difficulty

detects duplicates

identifies spam

labels issue type

flags low-quality reports



---

Assignment Workflow

This repository uses a mentor-assisted assignment pipeline.

Assignments are NOT handled manually through GitHub UI.

All issue assignment requests are processed through repository automation.


---

Requesting Assignment

To request an issue:

/assign

Do NOT self-assign using the GitHub interface.


---

Mentor-Based Assignment Queue

When a contributor requests assignment:

1. The request is queued automatically


2. Two active mentors are randomly selected from the mentor activity pool


3. The mentors are notified on the issue


4. Mentors have 24 hours to approve the assignment


5. If mentors do not respond within 24 hours:

mentors are rotated automatically

new active mentors are selected



6. If no mentor approves after timeout:

the Project Admin (PA) is notified automatically

manual assignment review begins




Mentor Selection System

Mentor selection is:

randomized

activity-aware

weighted toward active mentors

dynamically rotated

workload balanced


The system avoids repeatedly selecting the same mentors for every issue.

Mentors are selected from the active mentor leaderboard and review activity data.

Inactive mentors are deprioritized automatically.


---

Assignment Approval Commands

Contributors

/assign

Request issue assignment.

/unassign

Remove your current assignment.


---

Mentors

/approve-assignment @username

Approve and assign a contributor.

Only currently pinged mentors may approve.


---

Assignment Eligibility

Beginner Issues

Anyone may request assignment.

Examples:

documentation fixes

UI tweaks

accessibility fixes

simple bug fixes



---

Intermediate Issues

Requirements:

GitHub account at least 30 days old


Examples:

filtering improvements

caching changes

API improvements

search improvements



---

Advanced Issues

Requirements:

at least 1 merged PR in this repository


Examples:

architecture changes

security-sensitive logic

performance optimization

workflow redesign



---

Maximum Active Assignments

To ensure fairness:

Program	Maximum Active Issues

GSSoC	3
NSoC	3
General Contributors	3


Requests above the limit are automatically rejected.


---

Duplicate Issue Detection

The repository includes an AI-assisted duplicate detection system.

How Duplicate Detection Works

The detector compares:

normalized issue titles

semantic keyword overlap

important technical keywords

issue intent similarity

token overlap scoring


The system intentionally avoids:

aggressive exact-title matching

weak substring matching

low-confidence duplicate flags


The duplicate detector now uses:

weighted similarity scoring

keyword extraction

overlap thresholds

confidence filtering

technical term matching


This significantly reduces false positives.

Issues are NOT auto-closed solely because they are flagged as possible duplicates.


---

Smart Review Pipeline

Pull requests go through a 3-stage review pipeline.

Stage	Reviewer	Purpose

Stage 1	Automation	Validation + anti-spam
Stage 2	Mentors	Code review
Stage 3	Project Admin	Final merge gate



---

Stage 1 — Automated Validation

Automation checks:

DCO sign-off

PR formatting

issue linking

duplicate PR detection

AI slop detection

context validation

diff quality

repository policy compliance


The repository also uses:

LLM-assisted PR analysis

spam heuristics

low-effort detection

context validation against linked issues



---

Stage 2 — Mentor Review

Once Stage 1 passes:

1. Active mentors are selected automatically


2. Mentors are requested dynamically


3. Review activity is tracked in the mentor leaderboard


4. Review quality scoring is calculated


5. Mentors have 24 hours to respond


6. Inactive mentors are replaced automatically



Mentor Review Quality System

Mentor reviews are weighted by quality.

Examples:

Review Type	Score

Low-effort approval	Low points
Detailed review with feedback	Higher points
Helpful requested changes	Higher points
Merge-quality approval	Highest points


The mentor leaderboard tracks:

reviews completed

review quality

approvals

merged-review count

assignment approvals

priority review activity



---

Mentor Review Leaderboard

The mentor leaderboard:

updates automatically

tracks all-time review activity

includes mentor profile avatars

generates visual leaderboard comments

updates after PR merges

powers mentor assignment weighting


The leaderboard prioritizes:

active mentors

high-quality reviewers

consistent participation



---

Contributor Leaderboard

The contributor leaderboard updates automatically after PR merges.

It includes:

GitHub avatars

contributor rankings

merged PR counts

contribution scores

contextual leaderboard comments


Leaderboard comments are posted automatically on merged PRs.


---

Pull Request Workflow

Before Opening a PR

Ensure:

the issue is assigned to you

the work is complete

changes are tested locally

your PR follows repository conventions



---

Linking Issues is Mandatory

Every PR MUST contain:

Closes #issue-number

PRs without linked issues may be closed automatically.


---

Required PR Standards

Your PR should:

remain focused

avoid unnecessary files

avoid unrelated changes

avoid dependency bloat

preserve architecture consistency

follow conventional commits



---

Conventional Commit Format

Format

type: short description

Examples

feat: improve issue filtering
fix: resolve assignment queue race condition
ci: improve mentor rotation workflow
docs: update contribution guide


---

Common Commit Types

Type	Description

feat	New feature
fix	Bug fix
docs	Documentation
style	UI/styling
refactor	Internal cleanup
perf	Performance
ci	Workflow/configuration
chore	Maintenance



---

PR Checklist

Before submitting:

[ ] Issue is assigned to me

[ ] PR links an issue

[ ] Changes are focused and minimal

[ ] No unnecessary dependencies added

[ ] Code follows repository architecture

[ ] I tested changes locally

[ ] I understand the code submitted


For UI changes:

[ ] Screenshots attached



---

AI-Generated Contributions Policy

AI assistance is allowed.

However:

blindly generated PRs are prohibited

contributors must understand submitted code

low-quality AI spam is rejected

fake complexity is prohibited

meaningless documentation spam is prohibited


All PRs are reviewed for:

code quality

context accuracy

implementation understanding

contribution relevance



---

Strictly Prohibited

The following may result in rejection:

fake complexity

spam PRs

duplicate PRs

copied code without attribution

low-effort documentation spam

meaningless formatting-only PRs

unnecessary dependency additions

claiming issues without intent to work

excessive maintainer pinging



---

Maintainer Ping Policy

Avoid repeatedly pinging maintainers for:

issue assignment

mentor review

merge requests

labels

review escalation


Recommended waiting periods:

Action	Recommended Wait

Mentor approval	24 hours
Maintainer review	24–72 hours
Assignment review	up to 24 hours


Mentor review rotation is automated.

Repeated spam pings may result in:

comment cleanup

assignment removal

spam labeling



---

Inactivity Policy

Assigned issues with no meaningful progress for 7 days may be automatically unassigned.

Meaningful progress includes:

issue updates

linked PR creation

implementation discussion

active development progress


Contributors may need to wait before reclaiming inactive issues.


---

Automation Features

The repository includes:

AI issue triage

duplicate issue detection

mentor auto-rotation

smart assignment queueing

weighted mentor selection

contributor leaderboard automation

mentor leaderboard automation

review quality scoring

stale PR cleanup

DCO enforcement

PR size labeling

AI-slop detection

LLM PR validation

workflow-based review gates



---

Testing

Before submitting:

vercel dev

Verify:

edge functions work correctly

no build tooling was introduced

no existing functionality breaks

responsive layout remains functional

APIs behave correctly



---

Need Help?

If you need help:

open a GitHub Issue

use GitHub Discussions

ask in the community server



---

Final Notes

This repository prioritizes:

quality over quantity

maintainable contributions

fair contributor practices

meaningful improvements

human-reviewed code quality


Not all PRs are guaranteed to be merged.

Thank you for contributing to FindMyGSoC 🚀