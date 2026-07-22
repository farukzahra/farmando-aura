(function () {
  "use strict";

  var shelfList = document.getElementById("shelfList");
  if (!shelfList || !window.LIBRARY) return;

  function splitTitle(title, brandLine1, brandLine2) {
    if (brandLine2) {
      return brandLine1 + "<br>" + brandLine2;
    }
    var words = title.split(" ");
    if (words.length <= 1) return title;
    var mid = Math.ceil(words.length / 2);
    return words.slice(0, mid).join(" ") + "<br>" + words.slice(mid).join(" ");
  }

  function chapterLabel(count) {
    return count + (count === 1 ? " capítulo" : " capítulos");
  }

  shelfList.innerHTML = window.LIBRARY.books.map(function (book) {
    var meta = chapterLabel(book.chapters);
    if (book.subGenre) meta += " · " + book.subGenre;

    return (
      "<li>" +
        '<a class="book" href="' + book.slug + '/" aria-label="Abrir ' + book.title + '">' +
          '<span class="book-spine" aria-hidden="true"></span>' +
          '<span class="book-pages" aria-hidden="true"></span>' +
          '<span class="book-cover">' +
            (book.era ? '<span class="book-year">' + book.era + "</span>" : "") +
            '<span class="book-title">' + splitTitle(book.title, book.brandLine1, book.brandLine2) + "</span>" +
            (book.genre ? '<span class="book-genre">' + book.genre + "</span>" : "") +
          "</span>" +
        "</a>" +
        '<div class="book-info">' +
          '<h2 class="book-info-title"><a href="' + book.slug + '/">' + book.title + "</a></h2>" +
          (book.tagline ? '<p class="book-info-tagline">' + book.tagline + "</p>" : "") +
          '<p class="book-info-meta">' + meta + "</p>" +
        "</div>" +
      "</li>"
    );
  }).join("");
})();
