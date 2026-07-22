#!/usr/bin/env node
/** Sync chapters, rebuild downloads and shelf for all books in site/books.json */
"use strict";

const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const slug = process.argv[2];
const suffix = slug ? ` ${slug}` : "";

execSync(`node site/scripts/sync-from-markdown.js${suffix}`, { cwd: ROOT, stdio: "inherit" });
execSync(`node site/scripts/build-downloads.js${suffix}`, { cwd: ROOT, stdio: "inherit" });
execSync("node site/scripts/build-shelf.js", { cwd: ROOT, stdio: "inherit" });

console.log("\nBuild completo: site pronto para leitura e download.");
