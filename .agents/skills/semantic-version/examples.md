# Examples

## New chapter + reader update (minor bump)

`currentVersion`: `0.1.0` → `0.2.0`

```json
{
  "version": "0.2.0",
  "date": "2026-07-21",
  "title": "Capítulos 2–5 e leitor web",
  "summary": "Quatro novos capítulos, índice por capítulo no site e dark mode.",
  "type": "feat",
  "commit": null
}
```

## Download formats (minor bump)

`currentVersion`: `0.2.0` → `0.3.0`

```json
{
  "version": "0.3.0",
  "date": "2026-07-21",
  "title": "Download PDF, EPUB e DOCX",
  "summary": "Botões de download no menu lateral; build automático via script.",
  "type": "feat",
  "commit": null
}
```

## Typo fix in chapter — patch bump

`currentVersion`: `1.0.0` → `1.0.1`

```json
{
  "version": "1.0.1",
  "date": "2026-07-22",
  "title": "Correções de texto no capítulo 3",
  "summary": "Revisão de diálogos e sincronização do leitor e downloads.",
  "type": "fix",
  "commit": null
}
```

## Internal refactor — no entry

Changed sync script structure, no reader impact → **do not** edit `docs/release-history.json`.
