#!/usr/bin/env node
/** Rich front matter for PDF / EPUB / DOCX exports (cover, version, model, synopsis). */
"use strict";

const fs = require("fs");
const path = require("path");
const {
  escapeHtml,
  inlineMarkdown,
  loadSynopsis,
  normalizeVersions,
  resolveSynopsisFile
} = require("./book-utils");

function versionById(book, versionId) {
  return normalizeVersions(book).find((v) => v.id === versionId) || { id: versionId };
}

function resolveCoverAbsPath(root, book) {
  if (!book.coverImage) return null;
  const cleaned = book.coverImage.replace(/^\.\.\//, "");
  const candidate = path.join(root, "site", cleaned);
  return fs.existsSync(candidate) ? candidate : null;
}

function buildExportContext(root, book, versionId) {
  const v = versionById(book, versionId);
  const coverPath = resolveCoverAbsPath(root, book);
  let coverDataUri = null;
  if (coverPath) {
    coverDataUri = `data:image/png;base64,${fs.readFileSync(coverPath).toString("base64")}`;
  }

  return {
    title: book.title,
    tagline: book.tagline || "",
    meta: book.meta || [],
    genre: book.genre || "",
    subGenre: book.subGenre || "",
    era: book.era || "",
    versionId,
    versionLabel: v.label || versionId,
    versionModel: v.model || "",
    versionSummary: v.summary || "",
    versionDate: v.date || "",
    synopsis: loadSynopsis(resolveSynopsisFile(root, book)),
    coverPath,
    coverDataUri
  };
}

function metaTagsHtml(meta) {
  return meta
    .map((tag) => `<span class="meta-tag">${escapeHtml(tag)}</span>`)
    .join("");
}

function versionBlockHtml(ctx) {
  let html = `<p class="version-line"><strong>Versão:</strong> ${escapeHtml(ctx.versionLabel)}</p>`;
  if (ctx.versionModel) {
    html += `<p class="version-line"><strong>Gerado por:</strong> ${escapeHtml(ctx.versionModel)}</p>`;
  }
  if (ctx.versionSummary) {
    html += `<p class="version-summary">${escapeHtml(ctx.versionSummary)}</p>`;
  }
  return html;
}

function buildPrintHtml(ctx, chapters) {
  const synHtml = ctx.synopsis.map((p) => `<p>${inlineMarkdown(p)}</p>`).join("\n");
  const coverHtml = ctx.coverDataUri
    ? `<img class="cover-image" src="${ctx.coverDataUri}" alt="Capa: ${escapeHtml(ctx.title)}">`
    : "";

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
  <title>${escapeHtml(ctx.title)}</title>
  <style>
    @page { margin: 2.2cm 2cm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 11.5pt;
      line-height: 1.65;
      color: #1a1a1a;
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
    .cover-image {
      display: block;
      max-width: 100%;
      width: 28rem;
      margin: 0 auto 1.5rem;
      border-radius: 6px;
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
      margin-bottom: 1rem;
    }
    .version-line { font-size: 0.95rem; color: #444; margin: 0.25rem 0; }
    .version-summary { font-size: 0.9rem; color: #666; max-width: 32rem; margin: 0.5rem auto 1rem; }
    .meta-tags { margin: 1rem 0 1.5rem; }
    .meta-tag {
      display: inline-block;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 1px solid #ccc;
      border-radius: 999px;
      padding: 0.2rem 0.55rem;
      margin: 0.15rem;
      color: #555;
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
    ${coverHtml}
    <h1>${escapeHtml(ctx.title)}</h1>
    <p class="tagline">${escapeHtml(ctx.tagline)}</p>
    ${versionBlockHtml(ctx)}
    <div class="meta-tags">${metaTagsHtml(ctx.meta)}</div>
    <div class="synopsis">${synHtml}</div>
  </div>
  ${chaptersHtml}
</body>
</html>`;
}

/* ---- ZIP helpers (subset of story-skills story.js) ---- */

const CRC_TABLE = [];
for (let i = 0; i < 256; i += 1) {
  let v = i;
  for (let b = 0; b < 8; b += 1) v = v & 1 ? 3988292384 ^ (v >>> 1) : v >>> 1;
  CRC_TABLE.push(v >>> 0);
}

function crc32(buffer) {
  let crc = 4294967295;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 4294967295) >>> 0;
}

function writeZip(outFile, entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const content = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content, "utf8");
    const crc = crc32(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(67324752, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, content);
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(33639248, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + content.length;
  }
  let centralSize = 0;
  for (const part of centralParts) centralSize += part.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(101010256, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  fs.writeFileSync(outFile, Buffer.concat(localParts.concat(centralParts, end)));
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainParagraphs(ch) {
  return ch.paragraphs.map((p) => p.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n/g, " ").trim());
}

function chapterXhtml(ch) {
  const paras = plainParagraphs(ch).map((p) => `<p>${xmlEscape(p)}</p>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt-BR" lang="pt-BR"><head><title>${xmlEscape(ch.title)}</title></head><body><h1>Capítulo ${ch.number}: ${xmlEscape(ch.title)}</h1>${paras}</body></html>`;
}

function titlePageXhtml(ctx) {
  const syn = ctx.synopsis.map((p) => `<p>${xmlEscape(p.replace(/\*\*/g, "").replace(/\*/g, ""))}</p>`).join("");
  const meta = ctx.meta.map((t) => `<p class="meta">${xmlEscape(t)}</p>`).join("");
  let version = `<p><strong>Versão:</strong> ${xmlEscape(ctx.versionLabel)}</p>`;
  if (ctx.versionModel) version += `<p><strong>Gerado por:</strong> ${xmlEscape(ctx.versionModel)}</p>`;
  if (ctx.versionSummary) version += `<p>${xmlEscape(ctx.versionSummary)}</p>`;
  return `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt-BR" lang="pt-BR"><head><title>${xmlEscape(ctx.title)}</title></head><body><h1>${xmlEscape(ctx.title)}</h1><p><em>${xmlEscape(ctx.tagline)}</em></p>${version}${meta}<div>${syn}</div></body></html>`;
}

function coverXhtml() {
  return `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Capa</title><style>body{margin:0;text-align:center}img{max-width:100%;height:auto}</style></head><body><img src="images/cover.png" alt="Capa"/></body></html>`;
}

function navXhtml(ctx, chapters) {
  const links = ['<li><a href="title.xhtml">Sinopse</a></li>'];
  for (const ch of chapters) {
    const id = `chapter-${String(ch.number).padStart(2, "0")}`;
    links.push(`<li><a href="${id}.xhtml">Capítulo ${ch.number}: ${xmlEscape(ch.title)}</a></li>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>${xmlEscape(ctx.title)}</title></head><body><nav epub:type="toc"><ol>${links.join("")}</ol></nav></body></html>`;
}

function writeEnrichedEpub(outFile, ctx, chapters) {
  const chapterEntries = [];
  const manifest = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>'
  ];
  const spine = ['<itemref idref="title"/>'];

  if (ctx.coverPath) {
    manifest.push(
      '<item id="cover-image" href="images/cover.png" media-type="image/png" properties="cover-image"/>',
      '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>'
    );
    spine.unshift('<itemref idref="cover" linear="no"/>');
  }

  for (const ch of chapters) {
    const id = `chapter-${String(ch.number).padStart(2, "0")}`;
    chapterEntries.push({ name: `OEBPS/${id}.xhtml`, content: chapterXhtml(ch) });
    manifest.push(`<item id="${id}" href="${id}.xhtml" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${id}"/>`);
  }

  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const description = ctx.tagline || ctx.synopsis[0] || "";
  let metaExtra = `<meta property="dcterms:modified">${modified}</meta>`;
  metaExtra += `<meta name="version">${xmlEscape(ctx.versionLabel)}</meta>`;
  if (ctx.versionModel) metaExtra += `<meta name="generator-model">${xmlEscape(ctx.versionModel)}</meta>`;

  const opf = `<?xml version="1.0" encoding="UTF-8"?><package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${xmlEscape(ctx.title)}-${xmlEscape(ctx.versionId)}</dc:identifier><dc:title>${xmlEscape(ctx.title)} (${xmlEscape(ctx.versionLabel)})</dc:title><dc:language>pt-BR</dc:language><dc:description>${xmlEscape(description)}</dc:description>${metaExtra}</metadata><manifest>${manifest.join("")}</manifest><spine>${spine.join("")}</spine></package>`;

  const entries = [
    { name: "mimetype", content: "application/epub+zip" },
    {
      name: "META-INF/container.xml",
      content:
        '<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
    },
    { name: "OEBPS/content.opf", content: opf },
    { name: "OEBPS/nav.xhtml", content: navXhtml(ctx, chapters) },
    { name: "OEBPS/title.xhtml", content: titlePageXhtml(ctx) },
    ...chapterEntries
  ];

  if (ctx.coverPath) {
    entries.push(
      { name: "OEBPS/images/cover.png", content: fs.readFileSync(ctx.coverPath) },
      { name: "OEBPS/cover.xhtml", content: coverXhtml() }
    );
  }

  writeZip(outFile, entries);
}

function paragraphXml(text, style = "") {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

/** Centered cover image (PNG) — ~5.5" wide in Word EMUs. */
function coverImageParagraphXml(relId, widthEmu = 5029200, heightEmu = 6705600) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${widthEmu}" cy="${heightEmu}"/><wp:docPr id="1" name="Capa"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="cover.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function writeEnrichedDocx(outFile, ctx, chapters) {
  const bodyParts = [];
  if (ctx.coverPath) {
    bodyParts.push(coverImageParagraphXml("rId2"));
  }
  bodyParts.push(paragraphXml(ctx.title, "Title"));
  if (ctx.tagline) bodyParts.push(paragraphXml(ctx.tagline));
  bodyParts.push(paragraphXml(`Versão: ${ctx.versionLabel}`));
  if (ctx.versionModel) bodyParts.push(paragraphXml(`Gerado por: ${ctx.versionModel}`));
  if (ctx.versionSummary) bodyParts.push(paragraphXml(ctx.versionSummary));
  for (const tag of ctx.meta) bodyParts.push(paragraphXml(tag));
  bodyParts.push(paragraphXml("—"));
  for (const p of ctx.synopsis) {
    bodyParts.push(paragraphXml(p.replace(/\*\*/g, "").replace(/\*/g, "")));
  }
  bodyParts.push(paragraphXml("—"));

  for (const ch of chapters) {
    bodyParts.push(paragraphXml(`Capítulo ${ch.number}: ${ch.title}`, "Heading1"));
    for (const p of plainParagraphs(ch)) bodyParts.push(paragraphXml(p));
  }

  const body = bodyParts.join("");
  const entries = [
    {
      name: "[Content_Types].xml",
      content:
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    },
    {
      name: "_rels/.rels",
      content:
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
    },
    {
      name: "word/_rels/document.xml.rels",
      content: ctx.coverPath
        ? '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/cover.png"/></Relationships>'
        : '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
    },
    {
      name: "word/styles.xml",
      content:
        '<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="240"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:sz w:val="56"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="480" w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style></w:styles>'
    },
    {
      name: "word/document.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`
    }
  ];

  if (ctx.coverPath) {
    entries.push({ name: "word/media/cover.png", content: fs.readFileSync(ctx.coverPath) });
  }

  writeZip(outFile, entries);
}

module.exports = {
  buildExportContext,
  buildPrintHtml,
  writeEnrichedEpub,
  writeEnrichedDocx,
  resolveCoverAbsPath
};
