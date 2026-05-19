# Contributing Guide

## Program Classification (Required)
Every PR must declare exactly one program:
- GSSOC
- NSOC
- GENERAL

Use PR template checkboxes or `program: gssoc|nsoc|general`.

## Strict PR Requirements
- Link a valid issue (`Closes #123` etc.)
- Use template sections
- Keep changes scoped and relevant
- Use DCO sign-off (`git commit -s`)

## Strict Issue Requirements
- Include reproduction, expected, and actual behavior.
- Low-context issues get `needs-more-info` before closure.
- Spam issues may be auto-closed.

## Assignment Policy
- One contributor per issue.
- Assignment requires workflow approval.
- `/approve-assignment @user` fails for closed/locked/already-assigned issues.

## Recovery Paths
- PR closed by validator: fix message from sticky comment, then reopen.
- Issue flagged `needs-more-info`: edit issue; automation re-validates.

## Program-specific docs
- `docs/GSSOC_CONTRIBUTOR_GUIDE.md`
- `docs/GSSOC_MENTOR_GUIDE.md`
- `docs/NSOC_GUIDE.md`
- `docs/GENERAL_CONTRIBUTOR_GUIDE.md`
- `docs/PR_GUIDELINES.md`
- `docs/ISSUE_REPORTING_GUIDE.md`
- `docs/REVIEW_GUIDELINES.md`
