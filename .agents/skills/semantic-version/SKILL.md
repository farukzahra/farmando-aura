---
name: semantic-version
description: Maintains a project release history JSON file with semantic versions (MAJOR.MINOR.PATCH), dates, and change summaries. Use when shipping user-visible changes, bumping version, updating release history, preparing commits that need a version entry, or when the user mentions about page data, release log, version history, or semantic versioning on disk.
---

# Semantic Version

Maintain a single JSON file on disk that records product version and release entries. No database, no UI — the file is the source of truth for About screens, changelogs, or tooling to consume later.

## Faruk Base — when to bump

In **Faruk Base** (this template repo):

- **Do not** update `docs/release-history.json` while editing docs, specs, plans, or code.
- **Only** bump version when the user invokes **`/commit-push`** (or explicitly asks to record a release without that command).
- Pair with `caveman-commit` in the same `/commit-push` run.

## Canonical file

**Path:** `docs/release-history.json`

Create `docs/` if missing. Never split history across multiple files.

If the project already has `docs/release-history.json`, use it. Do not rename or relocate without explicit user request.

## JSON schema

```json
{
  "currentVersion": "0.1.0",
  "updatedAt": "2026-07-07T22:15:00.000Z",
  "entries": [
    {
      "version": "0.1.0",
      "date": "2026-07-07",
      "title": "Short headline for the release",
      "summary": "One or two sentences on what changed for the user.",
      "type": "feat",
      "commit": "a1b2c3d"
    }
  ]
}
```

### Field rules

| Field | Rules |
|-------|-------|
| `currentVersion` | Latest version `MAJOR.MINOR.PATCH`. Must match newest entry `version`. |
| `updatedAt` | ISO 8601 UTC timestamp of last file write. |
| `entries` | Newest first. Never delete past entries unless user explicitly asks. |
| `version` | Strict `MAJOR.MINOR.PATCH` — always three numeric parts. |
| `date` | `YYYY-MM-DD` in local project timezone or UTC; be consistent within a project. |
| `title` | Imperative or past-tense headline, ≤80 chars, user-facing language. |
| `summary` | Plain explanation of user-visible impact; no commit-message boilerplate. |
| `type` | One of: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `breaking`. |
| `commit` | Short git SHA (7 chars) after commit exists; omit while drafting pre-commit. |

## Version bump rules

Start at `0.1.0` for new projects unless the repo already defines a version.

| Change | Bump | Example |
|--------|------|---------|
| New user-visible feature | MINOR | `0.12.0` → `0.13.0` |
| Bugfix or small adjustment, no new feature | PATCH | `0.13.0` → `0.13.1` |
| Breaking change (API, migration, removed behavior) | MAJOR | `0.13.1` → `1.0.0` |
| Docs, tests, CI, refactors with zero user-visible effect | **No bump** | Do not add an entry |

When in doubt whether the change is user-visible, ask once. Default to no entry for internal-only work.

## When to update

Update `docs/release-history.json` in the **same `/commit-push` run** when:

1. The diff alters behavior, UI, API contracts, or defaults that users would notice.
2. The user asks to record a release or bump version (typically via `/commit-push`).
3. Preparing a commit the user intends to ship as a versioned delivery.

Do **not** update during normal editing, planning, or commits outside `/commit-push`.

Do **not** update for: formatting, comments, dev-only config, test-only changes, or dependency bumps with no behavioral change.

## Workflow

1. Read `docs/release-history.json` (create from template if absent).
2. Inspect the diff — decide bump level (`feat` / `fix` / `breaking` / skip).
3. If skipping, stop; do not touch the file.
4. Compute next version from `currentVersion` and bump rules.
5. Prepend a new entry to `entries` with `version`, `date`, `title`, `summary`, `type`.
6. Set `currentVersion` and `updatedAt`.
7. Align `package.json` / app manifests with `currentVersion` when those files exist in the project.
8. After commit, add `commit` (short SHA) to the new entry if it was omitted.

Pair with **caveman-commit** for the git message; the release `title`/`summary` are user-facing, not the commit subject.

## Writing entries

- **title**: what shipped — "Editable category codes", not "Update CategoryView.vue".
- **summary**: why it matters — scope, migration notes, breaking behavior.
- Match the project's UI language (Portuguese or English) for `title` and `summary`; keep JSON keys in English.
- One entry per shipped version, not one per commit (unless each commit is a release).

## Validation checklist

Before finishing:

- [ ] `currentVersion` matches `entries[0].version`
- [ ] Version has exactly three numeric parts
- [ ] Entries sorted newest-first
- [ ] No duplicate `version` values
- [ ] `type` is a allowed value
- [ ] JSON is valid and pretty-printed with 2-space indent

## Initializing a new project

When the file does not exist:

```json
{
  "currentVersion": "0.1.0",
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "entries": []
}
```

Add the first entry only when the first user-visible delivery ships.

## Examples

See [examples.md](examples.md).
