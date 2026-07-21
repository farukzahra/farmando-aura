#!/usr/bin/env node
/**
 * Sync farmando-aura/chapters/*.md → site/js/chapters.js
 * Usage: node site/scripts/sync-from-markdown.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const CHAPTERS_DIR = path.join(ROOT, "farmando-aura/chapters");
const OUT_FILE = path.join(ROOT, "site/js/chapters.js");
const STORY_FILE = path.join(ROOT, "farmando-aura/story.md");
const SINOPSE_FILE = path.join(ROOT, "sinopse-capa.md");

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

function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function proseToBlocks(prose) {
  const blocks = [];
  const paragraphs = prose.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    const isDialogue = lines.every((l) => l.startsWith("—") || l.startsWith("- "));

    if (isDialogue && lines.length === 1) {
      blocks.push({ type: "dialogue", text: escapeDialogue(lines[0]) });
      continue;
    }

    const html = inlineMarkdown(lines.join(" "));
    blocks.push({ type: "p", text: html });
  }

  return blocks;
}

function escapeDialogue(line) {
  return line.replace(/^-\s/, "— ");
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function loadSynopsis() {
  if (!fs.existsSync(SINOPSE_FILE)) {
    return [
      "2318. A fome acabou. O dinheiro também.",
      "A nova moeda chama-se Aura.",
      "Renato Vaz tem três pontos.",
      "Até descobrir uma falha no sistema."
    ];
  }
  const raw = fs.readFileSync(SINOPSE_FILE, "utf8");
  const body = raw.replace(/^#.+?\n+>.*?\n\n---\n\n/s, "");
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.replace(/\*\*/g, "").replace(/\*/g, "").trim())
    .filter((p) => p && !p.startsWith("**Gênero") && !p.startsWith("---"));
  return paragraphs.slice(0, 4);
}

function chapterFiles() {
  return fs
    .readdirSync(CHAPTERS_DIR)
    .filter((f) => /^chapter-\d+\.md$/i.test(f))
    .sort();
}

function build() {
  const chapters = chapterFiles().map((file) => {
    const raw = fs.readFileSync(path.join(CHAPTERS_DIR, file), "utf8");
    const { data, body } = parseFrontmatter(raw);
    const prose = extractProse(body);
    const number = parseInt(data.number || file.match(/\d+/)[0], 10);
    const title = data.title || `Capítulo ${number}`;

    return {
      id: String(number).padStart(2, "0"),
      slug: slugify(title),
      number,
      title,
      blocks: proseToBlocks(prose)
    };
  });

  const book = {
    title: "Farmando Aura",
    tagline: "Aura não compra nada. Aura abre portas.",
    meta: ["Ficção científica", "Distopia filosófica", "2318"],
    synopsis: loadSynopsis(),
    chapters
  };

  const out =
    "window.BOOK = " +
    JSON.stringify(book, null, 2)
      .replace(/"type": "dialogue"/g, '"type": "dialogue"')
      .replace(/<strong>/g, "<strong>")
      .replace(/<\/strong>/g, "</strong>")
      .replace(/<em>/g, "<em>")
      .replace(/<\/em>/g, "</em>") +
    ";\n";

  // Restore HTML tags (JSON escapes < as unicode in strings - actually JSON.stringify keeps them)
  fs.writeFileSync(OUT_FILE, out, "utf8");
  console.log(`Synced ${chapters.length} chapters → ${OUT_FILE}`);
}

build();
