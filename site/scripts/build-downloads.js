#!/usr/bin/env node
/**
 * Build PDF, EPUB and DOCX into site/downloads/ for all books in site/books.json
 * Usage: node site/scripts/build-downloads.js [slug]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const {
  ROOT,
  loadRegistry,
  resolveStoryDir,
  resolveSynopsisFile,
  loadChapterRecords,
  loadSynopsis,
  normalizeVersions,
  defaultVersionId,
  escapeHtml,
  inlineMarkdown
} = require("./lib/book-utils");

const DOWNLOADS_DIR = path.join(ROOT, "site/downloads");
const STORY_CLI = path.join(
  process.env.USERPROFILE || "",
  ".cursor/skills/story-skills/skills/story-maintenance/scripts/story.js"
);

function runNodeStory(storyRoot, args) {
  if (!fs.existsSync(STORY_CLI)) {
    throw new Error(`Story CLI não encontrado: ${STORY_CLI}`);
  }
  execSync(`node "${STORY_CLI}" ${args}`, { cwd: storyRoot, stdio: "inherit" });
}

function buildPrintHtml(title, tagline, chapters, synopsis) {
  const synHtml = synopsis.map((p) => `<p>${inlineMarkdown(p)}</p>`).join("\n");
  const chaptersHtml = chapters
    .map((ch) => {
      const paras = ch.paragraphs
        .map((para) => {
          const lines = para.split("\n");
          if (lines.length === 1 && (lines[0].startsWith("—") || lines[0].startsWith("- "))) {
            return `<p class="dialogue">${inlineMarkdown(lines[0].replace(/^-\s/, "— "))}</p>`;
          }
          return `<p>${inlineMarkdown(lines.join(" "))}</p>`;
        })
        .join("\n");
      return `<section class="chapter">
        <h2>Capítulo ${String(ch.number).padStart(2, "0")}</h2>
        <h3>${escapeHtml(ch.title)}</h3>
        ${paras}
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 2.2cm 2cm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 11.5pt;
      line-height: 1.65;
      color: #1a1a1a;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    .title-page {
      page-break-after: always;
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
      padding: 2rem 1rem;
    }
    .title-page h1 {
      font-size: 2.4rem;
      font-weight: normal;
      letter-spacing: 0.02em;
      margin: 0 0 0.5rem;
    }
    .title-page .tagline {
      font-style: italic;
      color: #555;
      margin-bottom: 2.5rem;
    }
    .synopsis {
      text-align: left;
      max-width: 32rem;
      margin: 0 auto;
      border-top: 1px solid #ccc;
      padding-top: 1.5rem;
    }
    .synopsis p { margin: 0 0 0.85rem; text-indent: 0; }
    .chapter { page-break-before: always; }
    .chapter h2 {
      font-size: 0.75rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #666;
      font-weight: normal;
      margin: 0 0 0.25rem;
    }
    .chapter h3 {
      font-size: 1.5rem;
      font-weight: normal;
      margin: 0 0 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #ddd;
    }
    p { margin: 0 0 0.75rem; text-indent: 1.25em; }
    p:first-of-type { text-indent: 0; }
    .dialogue {
      text-indent: 0;
      margin-left: 1rem;
      padding-left: 0.75rem;
      border-left: 2px solid #ddd;
      color: #333;
    }
    strong { font-weight: 600; }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${escapeHtml(title)}</h1>
    <p class="tagline">${escapeHtml(tagline)}</p>
    <div class="synopsis">${synHtml}</div>
  </div>
  ${chaptersHtml}
</body>
</html>`;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function buildPdf(printHtmlPath, outPdf) {
  const browser = findChrome();
  if (!browser) {
    console.warn("Chrome/Edge não encontrado — PDF não gerado.");
    console.warn("Instale Chrome ou defina CHROME_PATH.");
    return false;
  }

  const fileUrl = "file:///" + printHtmlPath.replace(/\\/g, "/");
  const result = spawnSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=10000",
      `--print-to-pdf=${outPdf}`,
      fileUrl
    ],
    { stdio: "inherit", timeout: 60000 }
  );

  if (result.status !== 0 || !fs.existsSync(outPdf)) {
    console.warn("Falha ao gerar PDF via headless browser.");
    return false;
  }
  return true;
}

function mirrorChapters(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const f of fs.readdirSync(destDir)) {
    if (/\.md$/i.test(f)) fs.unlinkSync(path.join(destDir, f));
  }
  for (const f of fs.readdirSync(srcDir)) {
    if (/\.md$/i.test(f)) fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

/** Build EPUB/DOCX/PDF for whatever is currently in storyRoot/chapters, suffixed by version. */
function buildVersionArtifacts(book, versionId, storyRoot) {
  const slug = book.slug;
  const title = book.title;
  const tagline = book.tagline || "";
  const chaptersDir = path.join(storyRoot, "chapters");
  const chapters = loadChapterRecords(chaptersDir);
  const synopsis = loadSynopsis(resolveSynopsisFile(ROOT, book)).slice(0, 5);

  const epubOut = path.join(DOWNLOADS_DIR, `${slug}-${versionId}.epub`);
  const docxOut = path.join(DOWNLOADS_DIR, `${slug}-${versionId}.docx`);
  const pdfOut = path.join(DOWNLOADS_DIR, `${slug}-${versionId}.pdf`);
  const printHtmlPath = path.join(DOWNLOADS_DIR, `_${slug}-${versionId}-print.html`);

  console.log(`\n[${slug} v${versionId}] Building EPUB…`);
  runNodeStory(storyRoot, `build . --format epub --out "${epubOut}"`);

  console.log(`[${slug} v${versionId}] Building DOCX…`);
  runNodeStory(storyRoot, `build . --format docx --out "${docxOut}"`);

  console.log(`[${slug} v${versionId}] Building PDF…`);
  fs.writeFileSync(printHtmlPath, buildPrintHtml(title, tagline, chapters, synopsis), "utf8");
  const pdfOk = buildPdf(printHtmlPath, pdfOut);
  if (fs.existsSync(printHtmlPath)) fs.unlinkSync(printHtmlPath);

  return {
    chapters: chapters.length,
    files: {
      pdf: { path: `downloads/${slug}-${versionId}.pdf`, available: pdfOk },
      epub: { path: `downloads/${slug}-${versionId}.epub`, available: fs.existsSync(epubOut) },
      docx: { path: `downloads/${slug}-${versionId}.docx`, available: fs.existsSync(docxOut) }
    }
  };
}

/** Copy the current version's files to unsuffixed aliases (backward compat: {slug}.ext). */
function aliasCurrent(slug, currentId) {
  const out = {};
  for (const ext of ["pdf", "epub", "docx"]) {
    const src = path.join(DOWNLOADS_DIR, `${slug}-${currentId}.${ext}`);
    const dest = path.join(DOWNLOADS_DIR, `${slug}.${ext}`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      out[ext] = { path: `downloads/${slug}.${ext}`, available: true };
    } else {
      out[ext] = { path: `downloads/${slug}.${ext}`, available: false };
    }
  }
  return out;
}

function buildBookDownloads(book) {
  const slug = book.slug;
  const title = book.title;
  const versions = normalizeVersions(book);
  const currentId = defaultVersionId(book);
  const storyRoot = resolveStoryDir(ROOT, book);
  const storyChapters = path.join(storyRoot, "chapters");
  const backupDir = path.join(DOWNLOADS_DIR, `_${slug}-chapters-backup`);

  const perVersion = {};
  let currentChapters = 0;
  let didSwap = false;

  try {
    for (const v of versions) {
      const versionDir = path.join(ROOT, v.chaptersDir);
      const isCurrentDir = path.resolve(versionDir) === path.resolve(storyChapters);

      if (!isCurrentDir) {
        if (!didSwap) {
          mirrorChapters(storyChapters, backupDir);
          didSwap = true;
        }
        mirrorChapters(versionDir, storyChapters);
      }

      const artifacts = buildVersionArtifacts(book, v.id, storyRoot);
      perVersion[v.id] = { label: v.label, files: artifacts.files };
      if (v.id === currentId) currentChapters = artifacts.chapters;
    }
  } finally {
    if (didSwap) {
      mirrorChapters(backupDir, storyChapters);
      removeDir(backupDir);
    }
  }

  const aliasFiles = aliasCurrent(slug, currentId);

  return {
    slug,
    title,
    chapters: currentChapters,
    currentVersion: currentId,
    versions: perVersion,
    files: aliasFiles
  };
}

function main() {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  const onlySlug = process.argv[2];
  const books = loadRegistry(ROOT).filter((b) => !onlySlug || b.slug === onlySlug);

  if (onlySlug && books.length === 0) {
    throw new Error(`Book not found in site/books.json: ${onlySlug}`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    books: {}
  };

  for (const book of books) {
    const result = buildBookDownloads(book);
    manifest.books[result.slug] = {
      title: result.title,
      chapters: result.chapters,
      currentVersion: result.currentVersion,
      versions: result.versions,
      files: result.files
    };

    console.log(`\n[${result.slug}] Downloads prontos:`);
    for (const [vid, v] of Object.entries(result.versions)) {
      const ok = ["epub", "docx", "pdf"].filter((ext) => v.files[ext].available);
      console.log(`  v${vid}: ${ok.length ? ok.join(", ") : "nenhum formato gerado"}`);
    }
  }

  fs.writeFileSync(
    path.join(DOWNLOADS_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
}

main();
