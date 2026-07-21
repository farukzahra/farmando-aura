#!/usr/bin/env node
/**
 * Build PDF, EPUB and DOCX into site/downloads/
 * Usage: node site/scripts/build-downloads.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const STORY_ROOT = path.join(ROOT, "farmando-aura");
const CHAPTERS_DIR = path.join(STORY_ROOT, "chapters");
const DOWNLOADS_DIR = path.join(ROOT, "site/downloads");
const STORY_CLI = path.join(
  process.env.USERPROFILE || "",
  ".cursor/skills/story-skills/skills/story-maintenance/scripts/story.js"
);

const SLUG = "farmando-aura";
const TITLE = "Farmando Aura";

function runNodeStory(args) {
  if (!fs.existsSync(STORY_CLI)) {
    throw new Error(`Story CLI não encontrado: ${STORY_CLI}`);
  }
  execSync(`node "${STORY_CLI}" ${args}`, { cwd: STORY_ROOT, stdio: "inherit" });
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: text };
  const data = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w[\w-]*):\s*"?(.+?)"?\s*$/);
    if (m) data[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return { data, body: text.slice(match[0].length) };
}

function extractProse(body) {
  const parts = body.split(/## Capítulo Texto\r?\n/i);
  return (parts[1] || parts[0]).trim();
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineHtml(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function loadChapters() {
  return fs
    .readdirSync(CHAPTERS_DIR)
    .filter((f) => /^chapter-\d+\.md$/i.test(f))
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(CHAPTERS_DIR, file), "utf8");
      const { data, body } = parseFrontmatter(raw);
      const prose = extractProse(body);
      const number = parseInt(data.number || file.match(/\d+/)[0], 10);
      return {
        number,
        title: data.title || `Capítulo ${number}`,
        paragraphs: prose.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
      };
    });
}

function loadSynopsis() {
  const file = path.join(ROOT, "sinopse-capa.md");
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8");
  return raw
    .split(/\n\n+/)
    .map((p) => p.replace(/\*\*/g, "").replace(/^>.*\n/m, "").trim())
    .filter((p) => p && !p.startsWith("#") && !p.startsWith("---") && !p.startsWith("**Gênero"))
    .slice(0, 5);
}

function buildPrintHtml(chapters, synopsis) {
  const synHtml = synopsis.map((p) => `<p>${inlineHtml(p)}</p>`).join("\n");
  const chaptersHtml = chapters
    .map((ch) => {
      const paras = ch.paragraphs
        .map((para) => {
          const lines = para.split("\n");
          if (lines.length === 1 && (lines[0].startsWith("—") || lines[0].startsWith("- "))) {
            return `<p class="dialogue">${inlineHtml(lines[0].replace(/^-\s/, "— "))}</p>`;
          }
          return `<p>${inlineHtml(lines.join(" "))}</p>`;
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
  <title>${escapeHtml(TITLE)}</title>
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
    <h1>${escapeHtml(TITLE)}</h1>
    <p class="tagline">Aura não compra nada. Aura abre portas.</p>
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

function main() {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  const chapters = loadChapters();
  const synopsis = loadSynopsis();

  const epubOut = path.join(DOWNLOADS_DIR, `${SLUG}.epub`);
  const docxOut = path.join(DOWNLOADS_DIR, `${SLUG}.docx`);
  const pdfOut = path.join(DOWNLOADS_DIR, `${SLUG}.pdf`);
  const printHtmlPath = path.join(DOWNLOADS_DIR, "_print.html");

  console.log("Building EPUB…");
  runNodeStory(`build . --format epub --out "${epubOut}"`);

  console.log("Building DOCX…");
  runNodeStory(`build . --format docx --out "${docxOut}"`);

  console.log("Building PDF…");
  fs.writeFileSync(printHtmlPath, buildPrintHtml(chapters, synopsis), "utf8");
  const pdfOk = buildPdf(printHtmlPath, pdfOut);
  if (pdfOk && fs.existsSync(printHtmlPath)) {
    fs.unlinkSync(printHtmlPath);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    title: TITLE,
    chapters: chapters.length,
    files: {
      pdf: { path: `downloads/${SLUG}.pdf`, available: pdfOk },
      epub: { path: `downloads/${SLUG}.epub`, available: fs.existsSync(epubOut) },
      docx: { path: `downloads/${SLUG}.docx`, available: fs.existsSync(docxOut) }
    }
  };

  fs.writeFileSync(
    path.join(DOWNLOADS_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  console.log("\nDownloads prontos em site/downloads/:");
  if (manifest.files.epub.available) console.log(`  ✓ ${SLUG}.epub`);
  if (manifest.files.docx.available) console.log(`  ✓ ${SLUG}.docx`);
  if (manifest.files.pdf.available) console.log(`  ✓ ${SLUG}.pdf`);
}

main();
