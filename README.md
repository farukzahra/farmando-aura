# Farmando Aura

Romance de ficção científica (2318): reputação universal medida por IAs, e um homem com Aura 3 que descobre como farmar o sistema.

**Para agentes:** leia [`AGENTS.md`](AGENTS.md).

## Leitor web

```bash
cd site
python -m http.server 8080
```

Abra http://localhost:8080 — índice por capítulo, dark mode, download PDF/EPUB/DOCX no menu lateral.

## Build

```bash
node site/scripts/build-all.js
```

Sincroniza `site/js/chapters.js` e regenera os três formatos em `site/downloads/`.

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `farmando-aura/` | Capítulos markdown (Story Skills) |
| `site/` | Leitor estático HTML/CSS/JS |
| `docs/release-history.json` | Versionamento semântico |

## Workflow git

```
/commit-push
```

Commit + bump de versão + push. Ver [`.cursor/commands/commit-push.md`](.cursor/commands/commit-push.md).

Skills: `caveman-commit`, `semantic-version`, `verification-before-completion` em `.agents/skills/`.

## Versão atual

Ver [`docs/release-history.json`](docs/release-history.json).

## Deploy e CI

- VPS: [`docs/deploy-vps.md`](docs/deploy-vps.md)
- GitHub Actions (PAT + secrets): [`docs/github-actions-deploy.md`](docs/github-actions-deploy.md)
