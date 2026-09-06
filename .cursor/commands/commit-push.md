# Commit and push

Commit project changes, push to the remote branch, wait for GitHub Actions when configured, and verify production with a real page check (not a health endpoint alone).

## Preconditions

- User invoked **`/commit-push`** or explicitly asked to commit and push.
- Never commit secrets (`.env`, credentials, keys, PATs).
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

Read the diff. Decide whether a release-history bump is needed.

## Step 2 — Version bump (`semantic-version` skill)

**Only when** `docs/release-history.json` exists in this repo.

**This is the only step where the agent may bump version.** Do not edit `docs/release-history.json` outside `/commit-push`.

Read and follow the **`semantic-version`** skill. If the change is user-visible (UI, API, behavior users notice) or a template deliverable (`AGENTS.md`, `docs/stack.md`, `.cursor/commands/`, new skills, etc.):

1. Bump `docs/release-history.json` (feeds `/sobre` and changelogs).
2. Include that file in the commit.

Skip the bump for internal-only refactors, tests, CI-only changes, or docs with no user impact.

## Step 3 — Commit message (`caveman-commit` skill)

Read and follow the **`caveman-commit`** skill.

- Conventional Commits, **English**
- Subject ≤50 chars when possible
- Body only when "why" is not obvious

## Step 4 — Commit

```bash
git add <relevant files>
git commit -m "<subject>" -m "<optional body>"
```

On Windows PowerShell, use a here-string for multi-line messages if needed.

If nothing to commit, say so and stop — do not push.

## Step 5 — Link release entry to commit

**After** the main commit, if `docs/release-history.json` was updated and the newest entry lacks `commit`:

1. `git rev-parse --short HEAD`
2. Set `commit` on the new entry
3. Commit the link:

```bash
git add docs/release-history.json
git commit -m "chore: link release entry to commit <sha>"
```

## Step 6 — Push

```bash
git push origin HEAD
```

If upstream is missing: `git push -u origin HEAD`.

**Push auth (Windows):** if HTTPS asks for a password and `gh` is unavailable, use PAT from `C:\repo\secrets\github\pat.txt` (line starting with `ghp_`).

## Step 7 — GitHub Actions (when configured)

**Skip this step** if `.github/workflows/` does not exist.

Deploy runs on GitHub Actions — do not SSH to VPS or run local deploy scripts as part of `/commit-push`.

1. Resolve repo: `docs/commit-push.json` → `github.owner` + `github.repo`, else `git remote get-url origin`.
2. Poll the workflow run for the pushed commit until success or timeout (~10 min):

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" run list --repo <owner>/<repo> --limit 5
& "C:\Program Files\GitHub CLI\gh.exe" run watch --repo <owner>/<repo> --exit-status
```

Without `gh`: GitHub API with PAT from `C:\repo\secrets\github\pat.txt`.

3. **If any required job fails:** read logs (`gh run view <id> --log-failed`), fix, commit, push, and repeat from Step 7. **Do not** report `/commit-push` done while Actions is red.

## Step 8 — Verify production (real check)

**Skip** when `docs/commit-push.json` has `"verify": null` or the repo has no production URL (libraries, templates, Android-only CI).

Read **`docs/commit-push.json`** first (canonical per repo). Fallback order: `AGENTS.md` → `docs/deploy-vps.md` → `README.md`.

### What counts as verification

- Fetch the **`verifyUrl`** (or `productionUrl`) with HTTP GET.
- Confirm **200** and that the page content matches **`expectInBody`** or **`expectTitle`** (product name, hero text, `<title>`, etc.).
- **Do not** treat `/api/health` or `{"ok":true}` alone as sufficient when a user-facing URL is configured.
- Optionally also hit a route mentioned in the release (e.g. `/sobre` after a version bump).

### Android-only (`verify.type`: `android-ci`)

No web URL. Confirm the **android-ci** (or named) workflow succeeded. Report Play Store / internal track notes from `AGENTS.md` if present.

### Loop on failure

If production check fails but Actions is green: investigate (cache, wrong branch, env), fix, push again, re-verify.

## Step 9 — Report to user

Always include:

- Commit SHA(s) and message(s)
- Branch pushed
- New version from `release-history.json` if bumped
- **GitHub Actions:** run URL + status (or "no workflows in repo")
- **Production:** the **`productionUrl`** from config — the URL you validated, what you checked on the page, and pass/fail

## Failures

- Pre-commit hook failed → fix, **new commit** (never amend a failed hook unless user rules allow)
- Push rejected → report; do not force-push
- No remote → tell user to add `origin`
- Actions or production red → fix and re-push before closing
