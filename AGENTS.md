# AGENTS.md

Operational guide for AI agents working in **Farmando Aura**.

## What this repo is

Fiction project + static reader site:

| Path | Purpose |
|------|---------|
| `farmando-aura/` | Story Skills project (chapters, bible, continuity) |
| `site/` | HTML/CSS/JS reader (dark mode, chapter index) |
| `site/downloads/` | PDF, EPUB, DOCX (pre-built) |
| `ideia-inicial.md` | Premissa formatada |
| `sinopse-capa.md` | Sinopse de contracapa |

External writing skills: `story-*` in `~/.cursor/skills/` (from [danjdewhurst/story-skills](https://github.com/danjdewhurst/story-skills)).

## Agent workflow

```
story-init / chapter-writing / plot-structure
  → node site/scripts/build-all.js
  → verification-before-completion
  → /commit-push (caveman-commit + semantic-version + push)
```

| Phase | Skill / tool | Rule |
|-------|--------------|------|
| Write | `chapter-writing`, `story-init`, etc. | Markdown in `farmando-aura/chapters/` |
| Sync site | `node site/scripts/build-all.js` | After every chapter create/revise |
| Verify | `verification-before-completion` | `story validate`, build-all exit 0 |
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
| `farmando-aura-sync.mdc` | Chapter edits → `build-all.js` |

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

## Versioning

**Only on `/commit-push`.** See `semantic-version` skill and [`docs/release-history.json`](docs/release-history.json).

## Build commands

```bash
# Sync reader + regenerate PDF/EPUB/DOCX
node site/scripts/build-all.js

# Story maintenance only
node "%USERPROFILE%\.cursor\skills\story-skills\skills\story-maintenance\scripts\story.js" validate farmando-aura

# Local reader
cd site && python -m http.server 8080
# → http://localhost:8080
```

## Deploy VPS

Production: **https://livros.faruk.dev.br**

| Doc | Conteúdo |
|-----|----------|
| [`docs/deploy-vps.md`](docs/deploy-vps.md) | VPS, DNS, Caddy, deploy manual |
| [`docs/github-actions-deploy.md`](docs/github-actions-deploy.md) | PAT, `gh secret set`, workflow Actions |

Push em `main` → `.github/workflows/deploy.yml` (após secrets configurados).

## Project layout

```
farmar-aura/
├── AGENTS.md
├── docs/release-history.json
├── farmando-aura/          # Story Skills bible + chapters
├── site/                   # Static reader
│   ├── downloads/          # PDF, EPUB, DOCX
│   └── scripts/
│       ├── build-all.js
│       ├── sync-from-markdown.js
│       └── build-downloads.js
├── .cursor/commands/       # /commit-push
├── .cursor/rules/
└── .agents/skills/
```

## Dev server (fim de task)

After site changes, ensure reader is reachable:

```bash
cd site && python -m http.server 8080
```

Inform URL: http://localhost:8080
