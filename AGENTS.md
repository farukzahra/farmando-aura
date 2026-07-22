# AGENTS.md

Operational guide for AI agents working in this **multi-book fiction library**.

Production: **https://livros.faruk.dev.br**

## What this repo is

Monorepo: Story Skills projects + static reader site (shelf + per-book readers).

| Path | Purpose |
|------|---------|
| `site/books.json` | **Registry** — all published/in-progress books |
| `{slug}/` | Story Skills project per book (chapters, bible, continuity) |
| `site/` | HTML/CSS/JS reader (library shelf + `{slug}/` readers) |
| `site/downloads/` | PDF, EPUB, DOCX per book (`{slug}.pdf`, etc.) |
| `docs/novo-livro.md` | Checklist to add a new book |

External writing skills: `story-*` in `~/.cursor/skills/` ([story-skills](https://github.com/danjdewhurst/story-skills)).

## Agent workflow

```
story-init → scaffold-book → chapter-writing / plot-structure
  → node site/scripts/build-all.js
  → verification-before-completion
  → /commit-push (caveman-commit + semantic-version + push)
```

| Phase | Skill / tool | Rule |
|-------|--------------|------|
| New book | `story-init`, `docs/novo-livro.md` | Add entry to `site/books.json` |
| Scaffold site | `node site/scripts/scaffold-book.js {slug} --model "..."` | Registry + reader; sets `coverImage`, `versions[].model` |
| Write | `chapter-writing`, etc. | Markdown in `{slug}/chapters/` |
| Sync site | `node site/scripts/build-all.js` | After every chapter create/revise |
| Verify | `verification-before-completion` | Após push: `gh run list` + `curl -I https://livros.faruk.dev.br` |
| Commit | `caveman-commit` | English, Conventional Commits — **only** via `/commit-push` or explicit request |
| Version | `semantic-version` | Bump `docs/release-history.json` — **only** inside `/commit-push` |

## Slash commands

| Command | Purpose |
|---------|---------|
| `/commit-push` | Commit, version bump, push — see [`.cursor/commands/commit-push.md`](.cursor/commands/commit-push.md) |

## Skills in this repo (`.agents/skills/`)

| Skill | When to use |
|-------|-------------|
| `caveman-commit` | Commit messages |
| `semantic-version` | `docs/release-history.json` on `/commit-push` |
| `verification-before-completion` | Before claiming done or committing |

## Cursor rules (`.cursor/rules/`)

| Rule | Trigger |
|------|---------|
| `books-sync.mdc` | Chapter edits → `build-all.js` |

## Language

- **Commit messages:** English, Conventional Commits
- **Release titles/summaries:** Portuguese
- **Prose / UI:** Portuguese
- **Skills (SKILL.md):** English

## Git rules

- Only commit when the user asks (including `/commit-push`)
- Never force-push to `main`
- Never skip hooks unless explicitly requested
- Do not commit secrets

## Build commands

```bash
# Sync all books: chapters.js + downloads + shelf
node site/scripts/build-all.js

# Single book only
node site/scripts/build-all.js farmando-aura

# New book reader + registry entry (after story-init)
node site/scripts/scaffold-book.js {slug} --title "Title" --tagline "..." --model "Claude Opus 4.8"
# Cover art → site/images/{slug}-cover.png
# Downloads use site/scripts/lib/export-enrich.js (cover + version + model + full synopsis)

# Story maintenance
node "%USERPROFILE%\.cursor\skills\story-skills\skills\story-maintenance\scripts\story.js" validate {slug}

# Local reader
cd site && python -m http.server 8080
# → http://localhost:8080
```

## Deploy VPS

| Doc | Conteúdo |
|-----|----------|
| [`docs/deploy-vps.md`](docs/deploy-vps.md) | VPS, DNS, Caddy, deploy manual |
| [`docs/github-actions-deploy.md`](docs/github-actions-deploy.md) | PAT, `gh secret set`, workflow Actions |
| [`docs/novo-livro.md`](docs/novo-livro.md) | Add another book to the library |

Push em `main` → `.github/workflows/deploy.yml`.

## Project layout

```
farmar-aura/
├── AGENTS.md
├── site/
│   ├── books.json              # registry
│   ├── index.html              # library shelf
│   ├── {slug}/index.html       # per-book reader
│   ├── js/{slug}/chapters.js   # built from markdown
│   ├── js/library-data.js      # built shelf data
│   ├── images/{slug}-cover.png # cover for reader + exports
│   └── scripts/
│       ├── build-all.js
│       ├── build-downloads.js
│       ├── scaffold-book.js
│       └── lib/
│           ├── book-utils.js
│           └── export-enrich.js
├── farmando-aura/              # book 1 (Story Skills)
├── {slug}/                     # book 2, 3, …
├── docs/release-history.json
├── .cursor/commands/
├── .cursor/rules/
└── .agents/skills/
```

## Dev server (fim de task)

After site changes, ensure reader is reachable:

```bash
cd site && python -m http.server 8080
```

Inform URL: http://localhost:8080
