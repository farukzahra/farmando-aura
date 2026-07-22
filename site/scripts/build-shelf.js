#!/usr/bin/env node
/**
 * Generate site/js/library-data.js from site/books.json + chapter counts
 * Usage: node site/scripts/build-shelf.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const {
  ROOT,
  loadRegistry,
  buildReaderBook,
  normalizeVersions,
  defaultVersionId
} = require("./lib/book-utils");

function main() {
  const books = loadRegistry(ROOT).map((book) => {
    const readerBook = buildReaderBook(ROOT, book);
    const versions = normalizeVersions(book);
    return {
      slug: book.slug,
      title: book.title,
      brandLine1: book.brandLine1 || book.title,
      brandLine2: book.brandLine2 || "",
      tagline: book.tagline || readerBook.tagline,
      genre: book.genre || readerBook.meta[0] || "",
      subGenre: book.subGenre || readerBook.meta[1] || "",
      era: book.era || readerBook.meta[2] || "",
      chapters: readerBook.chapters.length,
      currentVersion: defaultVersionId(book),
      versionCount: versions.length
    };
  });

  const outFile = path.join(ROOT, "site/js/library-data.js");
  fs.writeFileSync(outFile, "window.LIBRARY = " + JSON.stringify({ books }, null, 2) + ";\n", "utf8");
  console.log(`Shelf data → ${path.relative(ROOT, outFile)} (${books.length} book(s))`);
}

main();
