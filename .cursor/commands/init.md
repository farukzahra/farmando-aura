# Init — bootstrap Superpowers in this repo

Set up **Superpowers workflow** (design → plan → implement → verify → commit) when the repo is new, legacy, or missing `docs/superpowers/`.

## When to use

- User invoked **`/init`**
- User asks to add superpowers, bootstrap agent workflow, or initialize Faruk conventions
- Repo has no `docs/superpowers/` or no `skills-lock.json`

## Step 1 — Inspect repo

Read: `README.md`, `AGENTS.md` / `agents.md`, `package.json`, `docs/stack.md` (if any). Note stack (Next, Vue, Android, static site, etc.) — do not scaffold an app; only agent workflow.

## Step 2 — Create Superpowers folders

Ensure these exist (create if missing; do not delete existing specs/plans):

```
docs/superpowers/specs/.gitkeep   (or leave existing files)
docs/superpowers/plans/.gitkeep
```

Copy `docs/superpowers/README.md` from Faruk template if missing — content in `agent-skills/reference/superpowers/docs-README.md`.

## Step 3 — Skills lock + install

1. If **`skills-lock.json`** is missing at repo root, copy from `C:\repo\agent-skills\reference\superpowers\skills-lock.core.json`.
2. Run in repo root:

```bash
npx skills experimental_install
npx skills add farukzahra/agent-skills --skill semantic-version --skill caveman-commit -a cursor -y
```

3. If the project already has a full `skills-lock.json` (e.g. from Faruk Base), only run `experimental_install` — do not overwrite the lock.

**Optional stack skills** (install only when stack matches; skip if already in lock):

| Stack signal | Add |
|--------------|-----|
| `next` in package.json | `vercel-react-best-practices`, `frontend-design` |
| `vue` | `vue-best-practices`, `frontend-design` |
| `prisma` | `prisma-cli`, `prisma-client-api`, `prisma-database-setup`, `prisma-postgres` |
| `playwright` | `playwright-best-practices` |
| `fastify` / Node API | `nodejs-backend-patterns` |
| Android / `build.gradle` | project-specific — do not add web skills |

Use `npx skills add <owner/repo> --skill <name> -a cursor -y` per skill.

## Step 4 — Slash commands

Ensure these exist (copy from `C:\repo\agent-skills` if missing):

| Command | Source |
|---------|--------|
| `/commit-push` | `reference/commands/commit-push.md` |
| `/init` | this file (already present after init) |

Run if needed:

```powershell
& "C:\repo\agent-skills\scripts\install-commit-push.ps1"
```

## Step 5 — Cursor rules (optional)

If `.cursor/rules/` is empty, copy from `C:\repo\faruk_base\.cursor\rules/`:

- `automate-before-manual.mdc`
- `finish-task-dev-server.mdc`

Skip if the project already has rules.

## Step 6 — Release history (web apps)

If the repo ships a user-facing app and **`docs/release-history.json`** is missing:

```json
{
  "currentVersion": "0.1.0",
  "updatedAt": "<ISO-now>",
  "entries": []
}
```

Feeds `/sobre` when the app has an About page. Bump only via `/commit-push` + `semantic-version`.

## Step 7 — AGENTS.md

If **`AGENTS.md`** / **`agents.md`** exists but has no Superpowers workflow table, append:

```markdown
## Superpowers workflow

| Phase | Skill | Output |
|-------|-------|--------|
| Design | `brainstorming` | Approved design → `docs/superpowers/specs/YYYY-MM-DD-*-design.md` |
| Plan | `writing-plans` | `docs/superpowers/plans/YYYY-MM-DD-*.md` |
| Build | stack skills + `tdd` | Code + tests |
| Verify | `verification-before-completion` | Evidence before "done" |
| Debug | `systematic-debugging` | Root cause before fix |
| Ship | `/commit-push` | `semantic-version` + `caveman-commit` + push + CI |

**Gates:** no feature code before approved spec; no "done" without verification; version bump only on `/commit-push`.
```

If no AGENTS file exists, create a minimal `AGENTS.md` with project name + this section + pointer to `docs/superpowers/`.

Do not replace a rich existing `AGENTS.md` — merge only the missing section.

## Step 8 — Report

Tell the user:

- What was created vs already present
- Skills installed (`experimental_install` + semantic-version / caveman-commit)
- Slash commands available (`/init`, `/commit-push`)
- Next step: run `brainstorming` for the next feature

## Do not

- Overwrite existing `skills-lock.json`, specs, or plans without user request
- Commit or push unless user asks (`/commit-push`)
- Install unrelated skill packs for every stack on a minimal static site
