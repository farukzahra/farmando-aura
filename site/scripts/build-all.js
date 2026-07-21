#!/usr/bin/env node
/** Sync chapters.js + rebuild download formats */
"use strict";

const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");

execSync("node site/scripts/sync-from-markdown.js", { cwd: ROOT, stdio: "inherit" });
execSync("node site/scripts/build-downloads.js", { cwd: ROOT, stdio: "inherit" });

console.log("\nBuild completo: site pronto para leitura e download.");
