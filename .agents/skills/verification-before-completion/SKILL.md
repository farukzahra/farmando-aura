---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

## The Gate Function

```
BEFORE claiming any status:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim
```

## Library — verification commands

| Claim | Command |
|-------|---------|
| Story project valid | `node "%USERPROFILE%\.cursor\skills\story-skills\skills\story-maintenance\scripts\story.js" validate {slug}` |
| Site synced | `node site/scripts/build-all.js` (exit 0) |
| Downloads exist | `site/downloads/{slug}.{pdf,epub,docx}` for each book in `site/books.json` |
| Reader serves | `python -m http.server 8080` in `site/` → http://localhost:8080 and http://localhost:8080/{slug}/ |
| Push auth | PAT from `C:\repo\secrets\github\pat.txt` (line `ghp_...`); fallback `C:\repo\faruk\.env` `GITHUB_TOKEN` |
| Actions green | GitHub API `GET /repos/farukzahra/farmando-aura/actions/runs` with Bearer PAT; deploy job `completed` + `success` |
| Production live | `curl -I https://livros.faruk.dev.br` → 200 |

## When To Apply

**ALWAYS before:**
- Claiming chapters/site/downloads are ready
- `/commit-push`
- Moving to next task

Run the command. Read the output. THEN claim the result.
