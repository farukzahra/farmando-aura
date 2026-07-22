# Como criar um novo livro neste repositório

Guia para você pedir ao agente a criação de um **segundo (ou terceiro) livro** usando a mesma infraestrutura do *Farmando Aura*.

---

## Resposta curta: usamos os mesmos diretórios?

**Parcialmente.** O repositório é **um só** (biblioteca em `livros.faruk.dev.br`), mas **cada livro tem pastas próprias**. Não misture capítulos, personagens ou bible de livros diferentes no mesmo diretório.

| O que | Compartilhado? | Onde fica |
|-------|----------------|-----------|
| Repositório git | Sim | `farmar-aura/` (nome do repo) |
| Site / deploy / CI | Sim | `site/`, `.github/`, `docs/deploy-vps.md` |
| Skills de escrita (Story Skills) | Sim | `~/.cursor/skills/story-skills/` |
| Skills deste repo (commit, versão) | Sim | `.agents/skills/` |
| Projeto Story Skills do livro | **Não** | `{slug}/` na raiz (ex.: `farmando-aura/`) |
| Leitor web do livro | **Não** | `site/{slug}/` |
| Downloads (PDF/EPUB/DOCX) | **Não** | `site/downloads/{slug}.*` |
| Premissa e sinopse | **Não** | `{slug}/ideia-inicial.md`, `{slug}/sinopse-capa.md` |
| Regras Cursor | Compartilhada | `.cursor/rules/books-sync.mdc` |

O *Farmando Aura* continua em `farmando-aura/`. O próximo livro entra como **irmão**, não como substituto.

---

## O que você precisa decidir antes

Reúna isto (pode ser rascunho; o agente ajuda a refinar):

1. **Título** — ex.: *O Último Sinal*
2. **Slug** — kebab-case, sem acentos: `o-ultimo-sinal`
3. **Gênero e subgênero** — ex.: ficção científica / thriller espacial
4. **Sinopse** — 2–4 parágrafos (premissa central)
5. **Tagline** — uma frase de capa (opcional)
6. **Época / cenário** — ex.: 2087, colônia marciana
7. **Temas** — 2–4 (ex.: isolamento, memória, culpa)
8. **POV e tempo verbal** — ex.: terceira pessoa limitada, pretérito
9. **Tom** — ex.: noir filosófico, humor seco, épico
10. **Escopo inicial** — romance completo, novela, conto expandido, quantos capítulos alvo

Se já tiver rascunho em markdown ou DOCX, diga — dá para importar em vez de começar do zero.

---

## Prompt para colar no chat

Copie, preencha e envie:

```
Quero criar um novo livro neste repositório. Siga docs/novo-livro.md.

Título: ...
Slug: ...
Gênero: ...
Sinopse: ...
Tagline: ...
Época: ...
Temas: ...
POV: ...
Tempo verbal: ...
Tom: ...
Escopo: ...

[Cole aqui ideia livre, personagens, cenas que já imagina]
```

---

## Passos que o agente deve seguir

### Fase 1 — Ideação e bible (Story Skills)

1. Ler este arquivo e a skill `story-init`.
2. Criar a pasta `{slug}/` com a estrutura Story Skills v2:

```
{slug}/
├── story.md
├── characters/
├── worldbuilding/
├── plot/
├── scenes/
├── continuity/
├── glossary/
└── chapters/
```

3. Criar também na raiz do livro (ou equivalente):
   - `{slug}/ideia-inicial.md` — premissa expandida
   - `{slug}/sinopse-capa.md` — sinopse formatada para capa/site
4. Rodar validação:

```bash
node "%USERPROFILE%\.cursor\skills\story-skills\skills\story-maintenance\scripts\story.js" validate {slug}
```

### Fase 2 — Personagens, mundo e enredo

Usar as skills conforme necessário:

| Objetivo | Skill |
|----------|-------|
| Personagens | `character-management` |
| Locais, sistemas, cultura | `worldbuilding` |
| Arcos, timeline, foreshadowing | `plot-structure` |
| Escrever capítulos | `chapter-writing` |
| Revisar / continuidade | `revision-continuity` |
| Validar links e índices | `story-maintenance` |

Ordem sugerida: **personagem(s) principal(is) → mundo mínimo viável → arco em 3 atos → outline de capítulos → capítulo 1**.

### Fase 3 — Integração no site (automática)

O build já suporta vários livros via `site/books.json`. Para cada livro novo:

| Passo | Comando / arquivo |
|-------|-------------------|
| Registrar livro | Entrada em `site/books.json` (feito pelo scaffold) |
| Criar leitor web | `node site/scripts/scaffold-book.js {slug} --title "..." --tagline "..."` |
| Gerar capítulos + downloads + estante | `node site/scripts/build-all.js` |

Saídas automáticas por livro:

| Arquivo | Gerado por |
|---------|------------|
| `site/js/{slug}/chapters.js` | `sync-from-markdown.js` |
| `site/downloads/{slug}.{pdf,epub,docx}` | `build-downloads.js` |
| `site/js/library-data.js` | `build-shelf.js` (estante em `site/index.html`) |
| `site/downloads/manifest.json` | manifest multi-livro |

Build de um livro só: `node site/scripts/build-all.js {slug}`

Depois do build:

```bash
node site/scripts/build-all.js
cd site && python -m http.server 8080
```

Validar: http://localhost:8080 (estante) e http://localhost:8080/{slug}/ (leitor).

### Fase 4 — Documentação e agentes

| Arquivo | Ação |
|---------|------|
| `AGENTS.md` | Incluir o novo livro na tabela de paths e no workflow |
| `README.md` | Mencionar biblioteca multi-título (opcional) |
| `docs/release-history.json` | Entrada de versão no `/commit-push` |

### Fase 5 — Publicar

Quando estiver satisfeito:

```
/commit-push
```

Isso faz commit, bump de versão e push. O deploy em `main` atualiza https://livros.faruk.dev.br.

---

## Convenções (iguais ao Farmando Aura)

- **Idioma da prosa e da UI:** português
- **Commits:** inglês, Conventional Commits
- **Release history:** títulos/resumos em português
- **Capítulos:** `chapter-01.md`, `chapter-02.md`, … em `{slug}/chapters/`
- **Frontmatter YAML** em todos os arquivos Story Skills
- **Seção de prosa** nos capítulos: `## Capítulo Texto` (o sync do site lê isso)
- **Após cada capítulo novo ou revisado:** `node site/scripts/build-all.js`

---

## O que NÃO fazer

- Não colocar capítulos do livro B dentro de `farmando-aura/chapters/`.
- Não sobrescrever `sinopse-capa.md` do Farmando Aura — cada livro tem a sua.
- Não commitar sem você pedir (use `/commit-push` quando quiser publicar).
- Não criar scripts de geração em massa dentro da pasta do livro — usar Story Skills + CLI externo.

---

## Repositório separado ou monorepo?

**Recomendado: monorepo (este repo).**

| Monorepo (atual) | Repo novo por livro |
|------------------|---------------------|
| Uma estante, um deploy, um domínio | Vários sites ou subdomínios |
| Reaproveita CSS, leitor, CI | Duplica infra toda vez |
| Versionamento único da biblioteca | Versões independentes |

Só vale repo separado se o livro for de outro autor, licença diferente ou deploy em domínio distinto.

---

## Checklist rápido

```
[ ] Slug definido (kebab-case)
[ ] {slug}/ criado via story-init
[ ] ideia-inicial.md + sinopse-capa.md
[ ] story validate OK
[ ] Personagens e arco mínimo
[ ] Capítulo 1 escrito
[ ] Entrada em site/books.json (scaffold-book.js)
[ ] site/{slug}/index.html criado (scaffold-book.js)
[ ] build-all.js OK
[ ] Leitor local testado
[ ] AGENTS.md atualizado
[ ] /commit-push (quando quiser publicar)
```

---

## Referências

- Workflow geral: [`AGENTS.md`](../AGENTS.md)
- Deploy: [`docs/deploy-vps.md`](deploy-vps.md)
- CI: [`docs/github-actions-deploy.md`](github-actions-deploy.md)
- Story Skills: [danjdewhurst/story-skills](https://github.com/danjdewhurst/story-skills)
- Registry: `site/books.json`
- Exemplo completo: `farmando-aura/` + `site/farmando-aura/`
- Scaffold: `node site/scripts/scaffold-book.js {slug}`
