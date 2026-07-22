#!/usr/bin/env node
/** Shared helpers for multi-book build scripts */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");

function loadRegistry(root = ROOT) {
  const file = path.join(root, "site/books.json");
  if (!fs.existsSync(file)) {
    throw new Error(`Registry not found: ${file}`);
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(data.books) || data.books.length === 0) {
    throw new Error("site/books.json must contain a non-empty books array");
  }
  return data.books;
}

function resolveStoryDir(root, book) {
  return path.join(root, book.storyDir || book.slug);
}

function resolveSynopsisFile(root, book) {
  if (book.synopsisFile) {
    return path.join(root, book.synopsisFile);
  }
  const inStory = path.join(resolveStoryDir(root, book), "sinopse-capa.md");
  if (fs.existsSync(inStory)) return inStory;
  return path.join(root, book.slug, "sinopse-capa.md");
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: text };

  const data = {};
  let currentKey = null;
  let listMode = false;

  for (const line of match[1].split("\n")) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listMode && listItem) {
      data[currentKey].push(listItem[1].replace(/^"|"$/g, ""));
      continue;
    }

    listMode = false;
    const scalar = line.match(/^([\w-]+):\s*(.*)$/);
    if (!scalar) continue;

    currentKey = scalar[1];
    const raw = scalar[2].trim();
    if (raw === "") {
      data[currentKey] = [];
      listMode = true;
    } else {
      data[currentKey] = raw.replace(/^"|"$/g, "");
    }
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

function escapeDialogue(line) {
  return line.replace(/^-\s/, "— ");
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function proseToBlocks(prose) {
  const blocks = [];
  const paragraphs = prose.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    const isDialogue = lines.every((l) => l.startsWith("—") || l.startsWith("- "));

    if (isDialogue && lines.length === 1) {
      blocks.push({ type: "dialogue", text: inlineMarkdown(escapeDialogue(lines[0])) });
      continue;
    }

    blocks.push({ type: "p", text: inlineMarkdown(lines.join(" ")) });
  }

  return blocks;
}

function loadSynopsis(synopsisFile, fallbackParagraphs) {
  if (!fs.existsSync(synopsisFile)) {
    return fallbackParagraphs || [];
  }

  const raw = fs.readFileSync(synopsisFile, "utf8");
  const body = raw.replace(/^#.+?\n+>.*?\n\n---\n\n/s, "");
  return body
    .split(/\n\n+/)
    .map((p) => p.replace(/\*\*/g, "").replace(/\*/g, "").trim())
    .filter((p) => p && !p.startsWith("**Gênero") && !p.startsWith("---") && !p.startsWith("#"));
}

function loadStoryMeta(storyFile) {
  if (!fs.existsSync(storyFile)) return {};
  const { data } = parseFrontmatter(fs.readFileSync(storyFile, "utf8"));
  return data;
}

function chapterFiles(chaptersDir) {
  if (!fs.existsSync(chaptersDir)) return [];
  return fs
    .readdirSync(chaptersDir)
    .filter((f) => /^chapter-\d+\.md$/i.test(f))
    .sort();
}

function loadChapterRecords(chaptersDir) {
  return chapterFiles(chaptersDir).map((file) => {
    const raw = fs.readFileSync(path.join(chaptersDir, file), "utf8");
    const { data, body } = parseFrontmatter(raw);
    const prose = extractProse(body);
    const number = parseInt(data.number || file.match(/\d+/)[0], 10);
    return {
      number,
      title: data.title || `Capítulo ${number}`,
      prose,
      paragraphs: prose.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
      blocks: proseToBlocks(prose)
    };
  });
}

function genreLabel(genre) {
  const map = {
    "science-fiction": "Ficção científica",
    "philosophical-dystopia": "Distopia filosófica"
  };
  return map[genre] || genre;
}

function buildReaderBook(root, book) {
  const storyDir = resolveStoryDir(root, book);
  const chaptersDir = path.join(storyDir, "chapters");
  const storyMeta = loadStoryMeta(path.join(storyDir, "story.md"));
  const chapters = loadChapterRecords(chaptersDir);

  const title = book.title || storyMeta.title || book.slug;
  const synopsisRaw = loadSynopsis(resolveSynopsisFile(root, book));
  const synopsis = synopsisRaw.slice(0, 4);

  const meta = book.meta || [
    book.genre || genreLabel(storyMeta.genre) || "Ficção",
    book.subGenre || genreLabel(storyMeta["sub-genre"]) || "",
    book.era || storyMeta["setting-era"] || ""
  ].filter(Boolean);

  return {
    slug: book.slug,
    title,
    tagline: book.tagline || "",
    meta,
    synopsis,
    chapters: chapters.map((ch) => ({
      id: String(ch.number).padStart(2, "0"),
      slug: slugify(ch.title),
      number: ch.number,
      title: ch.title,
      blocks: ch.blocks
    }))
  };
}

function normalizeVersions(book) {
  if (Array.isArray(book.versions) && book.versions.length) {
    return book.versions.map((v) => ({
      id: v.id,
      label: v.label || v.id,
      date: v.date || "",
      summary: v.summary || "",
      model: v.model || "",
      chaptersDir: v.chaptersDir,
      current: !!v.current,
      synopsisFile: v.synopsisFile || null
    }));
  }
  return [
    {
      id: "1.0",
      label: "1.0",
      date: "",
      summary: "",
      model: "",
      chaptersDir: (book.storyDir || book.slug) + "/chapters",
      current: true,
      synopsisFile: null
    }
  ];
}

function defaultVersionId(book) {
  const versions = normalizeVersions(book);
  if (book.defaultVersion && versions.some((v) => v.id === book.defaultVersion)) {
    return book.defaultVersion;
  }
  return (versions.find((v) => v.current) || versions[0]).id;
}

function buildReaderVersions(root, book) {
  const versions = normalizeVersions(book);
  const sharedSynopsis = loadSynopsis(resolveSynopsisFile(root, book)).slice(0, 4);

  return versions.map((v) => {
    const chapters = loadChapterRecords(path.join(root, v.chaptersDir));
    const synopsis = v.synopsisFile
      ? loadSynopsis(path.join(root, v.synopsisFile)).slice(0, 4)
      : sharedSynopsis;

    return {
      id: v.id,
      label: v.label,
      date: v.date,
      summary: v.summary,
      model: v.model,
      current: v.current,
      synopsis,
      chapters: chapters.map((ch) => ({
        id: String(ch.number).padStart(2, "0"),
        slug: slugify(ch.title),
        number: ch.number,
        title: ch.title,
        blocks: ch.blocks
      }))
    };
  });
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Default site/books.json entry for a newly scaffolded book. */
function defaultRegistryEntry(opts) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const genre = opts.genre || "Ficção científica";
  const subGenre = opts.subGenre || "";
  const era = opts.era || "";

  return {
    slug: opts.slug,
    title: opts.title,
    brandLine1: opts.brandLine1 || opts.title,
    brandLine2: opts.brandLine2 || "",
    tagline: opts.tagline || "",
    storyDir: opts.slug,
    synopsisFile: `${opts.slug}/sinopse-capa.md`,
    genre,
    subGenre,
    era,
    meta: [genre, subGenre, era].filter(Boolean),
    coverImage: `../images/${opts.slug}-cover.png`,
    defaultVersion: "1.0",
    versions: [
      {
        id: "1.0",
        label: "1.0 — Original",
        date: dateStr,
        chaptersDir: `${opts.slug}/chapters`,
        current: true,
        model: opts.model || "",
        summary: opts.versionSummary || "Versão original."
      }
    ]
  };
}

/** Fill missing export/reader fields on an existing registry entry. */
function patchRegistryEntry(book, opts) {
  const patched = { ...book };
  if (!patched.coverImage) patched.coverImage = `../images/${book.slug}-cover.png`;
  if (!patched.defaultVersion) patched.defaultVersion = "1.0";
  if (!Array.isArray(patched.versions) || patched.versions.length === 0) {
    const now = new Date();
    patched.versions = [
      {
        id: "1.0",
        label: "1.0 — Original",
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        chaptersDir: `${book.storyDir || book.slug}/chapters`,
        current: true,
        model: opts.model || "",
        summary: opts.versionSummary || "Versão original."
      }
    ];
  }
  if (!patched.synopsisFile) patched.synopsisFile = `${book.slug}/sinopse-capa.md`;
  return patched;
}

module.exports = {
  ROOT,
  loadRegistry,
  resolveStoryDir,
  resolveSynopsisFile,
  parseFrontmatter,
  extractProse,
  slugify,
  proseToBlocks,
  loadSynopsis,
  loadStoryMeta,
  chapterFiles,
  loadChapterRecords,
  buildReaderBook,
  normalizeVersions,
  defaultVersionId,
  buildReaderVersions,
  escapeHtml,
  defaultRegistryEntry,
  patchRegistryEntry,
  inlineMarkdown: (text) =>
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
};
