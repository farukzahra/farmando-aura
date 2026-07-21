(function () {
  "use strict";

  var book = window.BOOK;
  var contentEl = document.getElementById("content");
  var chapterIndexEl = document.getElementById("chapterIndex");
  var toolbarTitleEl = document.getElementById("toolbarTitle");
  var progressBarEl = document.getElementById("progressBar");
  var chapterNavEl = document.getElementById("chapterNav");
  var prevBtn = document.getElementById("prevChapter");
  var nextBtn = document.getElementById("nextChapter");
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("overlay");
  var menuToggle = document.getElementById("menuToggle");
  var sidebarClose = document.getElementById("sidebarClose");
  var fontUp = document.getElementById("fontUp");
  var fontDown = document.getElementById("fontDown");

  var FONT_MIN = 0.9;
  var FONT_MAX = 1.5;
  var FONT_STEP = 0.0625;
  var STORAGE_KEY = "farmando-aura-last-chapter";
  var FONT_KEY = "farmando-aura-font-size";

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function getRoute() {
    var hash = location.hash.slice(1) || "/";
    if (hash === "/" || hash === "") return { view: "cover" };
    var match = hash.match(/^\/capitulo\/(\d+)$/);
    if (match) return { view: "chapter", index: parseInt(match[1], 10) - 1 };
    return { view: "cover" };
  }

  function navigateTo(view, index) {
    if (view === "cover") {
      location.hash = "#/";
    } else {
      location.hash = "#/capitulo/" + (index + 1);
    }
  }

  function renderBlock(block) {
    if (block.type === "dialogue") {
      return '<p class="dialogue">' + block.text + "</p>";
    }
    return "<p>" + block.text + "</p>";
  }

  function renderCover() {
    toolbarTitleEl.textContent = book.title;
    chapterNavEl.hidden = true;

    var synopsisHtml = book.synopsis.map(function (p) {
      return "<p>" + p + "</p>";
    }).join("");

    var metaHtml = book.meta.map(function (tag) {
      return '<span class="meta-tag">' + tag + "</span>";
    }).join("");

    contentEl.innerHTML =
      '<div class="cover">' +
        '<div class="cover-eyebrow">Um conto · ' + book.meta[2] + "</div>" +
        '<h1 class="cover-title">' + book.title + "</h1>" +
        '<p class="cover-tagline">' + book.tagline + "</p>" +
        '<div class="cover-synopsis">' + synopsisHtml + "</div>" +
        '<div class="cover-meta">' + metaHtml + "</div>" +
        '<button class="btn-start" id="startReading" type="button">Começar leitura →</button>' +
      "</div>";

    document.getElementById("startReading").addEventListener("click", function () {
      navigateTo("chapter", 0);
    });

    progressBarEl.style.width = "0%";
    updateActiveLink(-1);
  }

  function renderChapter(index) {
    var chapter = book.chapters[index];
    if (!chapter) {
      navigateTo("cover");
      return;
    }

    localStorage.setItem(STORAGE_KEY, String(index));
    toolbarTitleEl.textContent = "Cap. " + chapter.number + " — " + chapter.title;
    chapterNavEl.hidden = false;

    var bodyHtml = chapter.blocks.map(renderBlock).join("");

    contentEl.innerHTML =
      '<header class="chapter-header">' +
        '<div class="chapter-number">Capítulo ' + pad(chapter.number) + "</div>" +
        "<h1 class=\"chapter-title\">" + chapter.title + "</h1>" +
      "</header>" +
      '<div class="chapter-body">' + bodyHtml + "</div>";

    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= book.chapters.length - 1;

    prevBtn.onclick = function () {
      if (index > 0) navigateTo("chapter", index - 1);
    };

    nextBtn.onclick = function () {
      if (index < book.chapters.length - 1) navigateTo("chapter", index + 1);
    };

    updateActiveLink(index);
    window.scrollTo(0, 0);
    progressBarEl.style.width = "0%";
  }

  function buildIndex() {
    var html = '<div class="index-label">Capítulos</div>';

    html +=
      '<button class="chapter-link" data-nav="cover" type="button">' +
        '<span class="num">—</span><span>Sinopse</span>' +
      "</button>";

    book.chapters.forEach(function (ch, i) {
      html +=
        '<button class="chapter-link" data-chapter="' + i + '" type="button">' +
          '<span class="num">' + pad(ch.number) + "</span>" +
          "<span>" + ch.title + "</span>" +
        "</button>";
    });

    chapterIndexEl.innerHTML = html;

    chapterIndexEl.querySelectorAll("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        navigateTo("cover");
        closeSidebar();
      });
    });

    chapterIndexEl.querySelectorAll("[data-chapter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        navigateTo("chapter", parseInt(btn.dataset.chapter, 10));
        closeSidebar();
      });
    });
  }

  function updateActiveLink(index) {
    chapterIndexEl.querySelectorAll(".chapter-link").forEach(function (link) {
      link.classList.remove("active");
    });

    if (index < 0) {
      var coverLink = chapterIndexEl.querySelector('[data-nav="cover"]');
      if (coverLink) coverLink.classList.add("active");
      return;
    }

    var active = chapterIndexEl.querySelector('[data-chapter="' + index + '"]');
    if (active) active.classList.add("active");
  }

  function render() {
    var route = getRoute();
    if (route.view === "cover") {
      renderCover();
    } else {
      renderChapter(route.index);
    }
  }

  function updateProgress() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    progressBarEl.style.width = pct + "%";
  }

  function openSidebar() {
    sidebar.classList.add("open");
    overlay.hidden = false;
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.hidden = true;
  }

  function setFontSize(rem) {
    var clamped = Math.max(FONT_MIN, Math.min(FONT_MAX, rem));
    document.documentElement.style.setProperty("--font-size", clamped + "rem");
    localStorage.setItem(FONT_KEY, String(clamped));
  }

  function initFontSize() {
    var saved = parseFloat(localStorage.getItem(FONT_KEY));
    if (!isNaN(saved)) setFontSize(saved);
  }

  function initDownloads() {
    var map = { pdf: "dlPdf", epub: "dlEpub", docx: "dlDocx" };
    fetch("downloads/manifest.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (manifest) {
        if (!manifest || !manifest.files) return;
        Object.keys(map).forEach(function (key) {
          var el = document.getElementById(map[key]);
          var file = manifest.files[key];
          if (!el || !file) return;
          if (!file.available) el.classList.add("unavailable");
        });
      })
      .catch(function () { /* offline ou file:// — links permanecem ativos */ });
  }

  menuToggle.addEventListener("click", openSidebar);
  sidebarClose.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);

  fontUp.addEventListener("click", function () {
    var current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--font-size"));
    setFontSize(current + FONT_STEP);
  });

  fontDown.addEventListener("click", function () {
    var current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--font-size"));
    setFontSize(current - FONT_STEP);
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("scroll", updateProgress, { passive: true });

  document.addEventListener("keydown", function (e) {
    var route = getRoute();
    if (route.view !== "chapter") return;

    if (e.key === "ArrowLeft" && route.index > 0) {
      navigateTo("chapter", route.index - 1);
    } else if (e.key === "ArrowRight" && route.index < book.chapters.length - 1) {
      navigateTo("chapter", route.index + 1);
    }
  });

  buildIndex();
  initFontSize();
  initDownloads();

  if (location.hash === "" || location.hash === "#/") {
    var last = localStorage.getItem(STORAGE_KEY);
    if (last !== null && book.chapters[parseInt(last, 10)]) {
      /* mantém capa como entrada padrão; descomente para retomar leitura:
      navigateTo("chapter", parseInt(last, 10));
      return;
      */
    }
  }

  render();
})();
