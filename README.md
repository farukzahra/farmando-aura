# Livros · faruk.dev.br

Biblioteca de ficção científica com leitor web estático. Cada livro é um projeto Story Skills + leitor em `site/{slug}/`.

**Para agentes:** leia [`AGENTS.md`](AGENTS.md). **Novo livro:** [`docs/novo-livro.md`](docs/novo-livro.md).

## Leitor web

```bash
cd site
python -m http.server 8080
```

Abra http://localhost:8080 — estante com todos os livros registrados em `site/books.json`.

## Build

```bash
# Todos os livros
node site/scripts/build-all.js

# Um livro só
node site/scripts/build-all.js farmando-aura
```

Sincroniza `site/js/{slug}/chapters.js`, regenera PDF/EPUB/DOCX e atualiza a estante.

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `site/books.json` | Registry de livros |
| `{slug}/` | Capítulos markdown (Story Skills) |
| `site/{slug}/` | Leitor HTML do livro |
| `site/downloads/` | PDF, EPUB, DOCX por slug |
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
