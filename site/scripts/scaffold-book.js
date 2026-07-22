#!/usr/bin/env node
/**
 * Scaffold a new book: registry entry + reader page
 * Usage: node site/scripts/scaffold-book.js <slug> [--title "Title"] [--tagline "..."]
 *        [--genre "..."] [--sub-genre "..."] [--era "2318"] [--model "Claude Opus 4.8"]
 *
 * Prerequisite: {slug}/ Story Skills folder must exist (run story-init first).
 *
 * Registry entry includes coverImage, defaultVersion and versions[].model so
 * build-downloads.js produces enriched PDF/EPUB/DOCX (cover + synopsis + version metadata).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { defaultRegistryEntry, patchRegistryEntry } = require("./lib/book-utils");

const ROOT = path.resolve(__dirname, "../..");
const REGISTRY = path.join(ROOT, "site/books.json");
const IMAGES_DIR = path.join(ROOT, "site/images");

function parseArgs(argv) {
  const slug = argv[2];
  if (!slug || slug.startsWith("-")) {
    console.error(
      "Usage: node site/scripts/scaffold-book.js <slug> [--title \"Title\"] [--tagline \"...\"] [--genre \"...\"] [--sub-genre \"...\"] [--era \"2318\"] [--model \"Claude Opus 4.8\"] [--version-summary \"...\"]"
    );
    process.exit(1);
  }

  const opts = { slug };
  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === "--title") opts.title = argv[++i];
    else if (argv[i] === "--tagline") opts.tagline = argv[++i];
    else if (argv[i] === "--genre") opts.genre = argv[++i];
    else if (argv[i] === "--era") opts.era = argv[++i];
    else if (argv[i] === "--sub-genre") opts.subGenre = argv[++i];
    else if (argv[i] === "--model") opts.model = argv[++i];
    else if (argv[i] === "--version-summary") opts.versionSummary = argv[++i];
  }
  return opts;
}

function splitTitle(title) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) return { brandLine1: title, brandLine2: "" };
  const mid = Math.ceil(words.length / 2);
  return {
    brandLine1: words.slice(0, mid).join(" "),
    brandLine2: words.slice(mid).join(" ")
  };
}

function loadStoryTitle(storyDir) {
  const storyFile = path.join(storyDir, "story.md");
  if (!fs.existsSync(storyFile)) return null;
  const match = fs.readFileSync(storyFile, "utf8").match(/^title:\s*(.+)$/m);
  return match ? match[1].replace(/^"|"$/g, "") : null;
}

function renderReaderHtml(book) {
  const brand1 = book.brandLine1 || book.title;
  const brand2 = book.brandLine2 || "";
  const brandHtml = brand2
    ? `<span class="brand-glow">${brand1}</span>\n          <span class="brand-sub">${brand2}</span>`
    : `<span class="brand-glow">${book.title}</span>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${book.title}${book.tagline ? " — " + book.tagline : ""}">
  <title>${book.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;1,7..72,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body data-book-slug="${book.slug}" data-downloads-base="../downloads/">
  <div class="app" id="app">
    <aside class="sidebar" id="sidebar" aria-label="Índice de capítulos">
      <div class="sidebar-header">
        <a href="../" class="library-back" title="Voltar à estante">← Estante</a>
        <a href="#/" class="brand" data-nav="cover">
          ${brandHtml}
        </a>
        <button class="sidebar-close" id="sidebarClose" aria-label="Fechar índice" type="button">×</button>
      </div>
      <nav class="chapter-index" id="chapterIndex"></nav>
      <div class="download-bar" id="downloadBar" aria-label="Baixar livro">
        <a class="download-btn" id="dlPdf" href="../downloads/${book.slug}.pdf" download title="Baixar PDF">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M9 13h6M9 17h4"/>
            <path d="M12 11v6M9.5 14.5 12 17l2.5-2.5"/>
          </svg>
        </a>
        <a class="download-btn" id="dlEpub" href="../downloads/${book.slug}.epub" download title="Baixar EPUB">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <path d="M8 7h8M8 11h6"/>
          </svg>
        </a>
        <a class="download-btn" id="dlDocx" href="../downloads/${book.slug}.docx" download title="Baixar DOCX">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M8 13h2l1 4 1-4h2"/>
          </svg>
        </a>
      </div>
      <footer class="sidebar-footer">
        ${book.era ? `<span class="aura-badge">${book.era}</span>` : ""}
      </footer>
    </aside>

    <div class="overlay" id="overlay" hidden></div>

    <main class="main">
      <header class="toolbar">
        <button class="toolbar-btn" id="menuToggle" aria-label="Abrir índice" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <a href="../" class="toolbar-library" title="Voltar à estante">Estante</a>
        <div class="toolbar-title" id="toolbarTitle">${book.title}</div>
        <div class="toolbar-actions">
          <label class="version-control" id="versionControl" title="Trocar versão do livro">
            <span class="version-label">Versão</span>
            <select class="version-select" id="versionSelect" aria-label="Versão do livro"></select>
          </label>
          <button class="toolbar-btn" id="fontDown" aria-label="Diminuir fonte" type="button">A−</button>
          <button class="toolbar-btn" id="fontUp" aria-label="Aumentar fonte" type="button">A+</button>
        </div>
      </header>

      <div class="progress-track" aria-hidden="true">
        <div class="progress-bar" id="progressBar"></div>
      </div>

      <article class="content" id="content"></article>

      <nav class="chapter-nav" id="chapterNav" hidden>
        <button class="nav-btn" id="prevChapter" type="button">← Anterior</button>
        <button class="nav-btn nav-btn-primary" id="nextChapter" type="button">Próximo →</button>
      </nav>
    </main>
  </div>

  <script src="../js/${book.slug}/chapters.js"></script>
  <script src="../js/app.js"></script>
</body>
</html>
`;
}

function ensureCoverPlaceholder(slug) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const coverPath = path.join(IMAGES_DIR, `${slug}-cover.png`);
  if (fs.existsSync(coverPath)) return coverPath;
  console.log(`Cover placeholder: add illustration → site/images/${slug}-cover.png`);
  return null;
}

function main() {
  const opts = parseArgs(process.argv);
  const storyDir = path.join(ROOT, opts.slug);

  if (!fs.existsSync(storyDir)) {
    console.error(`Story folder not found: ${storyDir}`);
    console.error("Run story-init first to create the Story Skills project.");
    process.exit(1);
  }

  const title = opts.title || loadStoryTitle(storyDir) || opts.slug;
  const brand = splitTitle(title);
  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  const existingIdx = registry.books.findIndex((b) => b.slug === opts.slug);

  if (existingIdx >= 0) {
    registry.books[existingIdx] = patchRegistryEntry(registry.books[existingIdx], opts);
    fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf8");
    console.log(`Registry: patched ${opts.slug} in site/books.json (coverImage, versions, model)`);
  } else {
    const entry = defaultRegistryEntry({
      slug: opts.slug,
      title,
      brandLine1: brand.brandLine1,
      brandLine2: brand.brandLine2,
      tagline: opts.tagline || "",
      genre: opts.genre,
      subGenre: opts.subGenre,
      era: opts.era,
      model: opts.model,
      versionSummary: opts.versionSummary
    });
    registry.books.push(entry);
    fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf8");
    console.log(`Added ${opts.slug} to site/books.json (coverImage + versions + model)`);
  }

  ensureCoverPlaceholder(opts.slug);

  const book = registry.books.find((b) => b.slug === opts.slug);
  const readerDir = path.join(ROOT, "site", opts.slug);
  const readerFile = path.join(readerDir, "index.html");

  fs.mkdirSync(readerDir, { recursive: true });
  fs.writeFileSync(readerFile, renderReaderHtml(book), "utf8");
  console.log(`Reader page → ${path.relative(ROOT, readerFile)}`);

  console.log("\nNext steps:");
  console.log(`  1. Create ${opts.slug}/sinopse-capa.md (full synopsis for reader + exports)`);
  console.log(`  2. Add cover art → site/images/${opts.slug}-cover.png`);
  console.log(`  3. Write chapters in ${opts.slug}/chapters/`);
  console.log(`  4. node site/scripts/build-all.js ${opts.slug}`);
  console.log("\nExports (PDF/EPUB/DOCX) will include: cover, tagline, version, model, meta tags, full synopsis.");
}

main();
