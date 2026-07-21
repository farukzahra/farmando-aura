# Commit and push

Commit all staged/unstaged project changes and push to the tracked remote branch. Follow Farmando Aura git and versioning conventions.

## Preconditions

- User explicitly invoked `/commit-push` — you may commit and push.
- Never commit secrets (`.env`, credentials, keys).
- Never force-push to `main`/`master`.
- Never skip hooks unless the user explicitly asked.
- Never amend unless user rules allow it.

## Step 1 — Inspect (run in parallel)

```bash
git status
git diff
git diff --cached
git log -5 --oneline
git branch -vv
```

Read the diff. Decide if this is a user-visible deliverable that needs a version bump.

## Step 2 — Pre-commit build (when content changed)

If any file under `farmando-aura/chapters/` or `sinopse-capa.md` changed:

```bash
node site/scripts/build-all.js
```

Include updated `site/js/chapters.js` and `site/downloads/*` in the commit.

## Step 3 — Version bump (`semantic-version` skill)

**This is the only step where the agent may bump version.** Do not update `docs/release-history.json` during normal editing or commits outside `/commit-push`.

If the change is user-visible (new/revised chapters, reader site, downloads, sinopse, AGENTS/docs):

1. Read `docs/release-history.json` (create at `0.1.0` if missing).
2. Compute next `MAJOR.MINOR.PATCH` (feat → minor, fix → patch).
3. Prepend a new entry (newest first) with `title` and `summary` in **Portuguese**.
4. Update `currentVersion` and `updatedAt`.
5. Include `docs/release-history.json` in the commit.

Skip version bump for internal-only refactors with no reader impact.

## Step 4 — Commit message (`caveman-commit` skill)

- Conventional Commits, **English**
- Subject ≤50 chars when possible
- Body only when "why" is not obvious

## Step 5 — Commit

```bash
git add <relevant files>
git commit -m "<subject>" -m "<optional body>"
```

On Windows PowerShell, use a here-string for multi-line messages if needed.

If nothing to commit, say so and stop — do not push.

## Step 6 — Link release entry to commit

If `docs/release-history.json` was updated and the new entry has `"commit": null`:

1. Get short SHA: `git rev-parse --short HEAD`
2. Set `commit` on the new entry(ies) from this delivery
3. Commit that fix:

```bash
git add docs/release-history.json
git commit -m "chore: link release entry to commit <sha>"
```

## Step 7 — Push

```bash
git push origin HEAD
```

If upstream is not set:

```bash
git push -u origin HEAD
```

## Step 8 — Confirm

Report to the user:

- Commit SHA(s) and message(s)
- Branch pushed
- New version from `release-history.json` if bumped
- Remote URL if useful

## Failures

- Pre-commit hook failed → fix issues, **new commit** (never amend a failed hook commit unless user rules allow)
- Push rejected → report error; do not force-push
- No remote → tell user to add `origin` or run `git init` first
