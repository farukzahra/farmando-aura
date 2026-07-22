#!/usr/bin/env node
/**
 * Sync {slug}/chapters/*.md → site/js/{slug}/chapters.js for all books in site/books.json
 * Usage: node site/scripts/sync-from-markdown.js [slug]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const {
  ROOT,
  loadRegistry,
  buildReaderBook,
  buildReaderVersions,
  defaultVersionId
} = require("./lib/book-utils");

function syncBook(book) {
  const base = buildReaderBook(ROOT, book);
  const versions = buildReaderVersions(ROOT, book);
  const defaultVersion = defaultVersionId(book);
  const outDir = path.join(ROOT, "site/js", book.slug);
  const outFile = path.join(outDir, "chapters.js");

  fs.mkdirSync(outDir, { recursive: true });

  const payload = {
    slug: book.slug,
    title: base.title,
    tagline: base.tagline,
    meta: base.meta,
    coverImage: book.coverImage || null,
    defaultVersion,
    versions
  };

  fs.writeFileSync(outFile, "window.BOOK = " + JSON.stringify(payload, null, 2) + ";\n", "utf8");
  const summary = versions
    .map((v) => `${v.id}:${v.chapters.length}ch`)
    .join(", ");
  console.log(`Synced ${versions.length} version(s) [${summary}] → ${path.relative(ROOT, outFile)}`);
  return base;
}

function main() {
  const onlySlug = process.argv[2];
  const books = loadRegistry(ROOT).filter((b) => !onlySlug || b.slug === onlySlug);

  if (onlySlug && books.length === 0) {
    throw new Error(`Book not found in site/books.json: ${onlySlug}`);
  }

  for (const book of books) {
    syncBook(book);
  }
}

main();
