/*
 * Project data + featured rotation + index for r2-beeld.
 * One project is featured per page load (random, or ?featured=<id>); the rest fill the
 * image grid in their normal order. The index lists all of them and highlights the
 * matching image on hover/focus (and the other way round).
 * Without JS the server-rendered Homelab state stays and the index links still work.
 */
(function (root) {
  "use strict";

  var PROJECTS = [
    {
      id: "homelab", no: "01",
      title: "Homelab & home automation",
      line: "A small home server that runs my apps and my home automation.",
      story: "An old laptop under the TV runs everything: my side projects, Home Assistant and the lights. It’s only reachable through my own private network, and every change goes through git, so I can rebuild it in an afternoon. Next up: three small second-hand PCs to turn it into a proper cluster.",
      chips: ["proxmox", "k8s", "home-assistant", "zigbee"],
      photo: "Photo: the setup under the TV", file: "homelab/under-the-tv.jpg",
      href: "project.html"
    },
    {
      id: "rules-of-99", no: "02",
      title: "Rules of 99",
      line: "Play Commander (Magic: The Gathering) with friends in the browser.",
      story: "Import a deck, share a room code, and play with up to four people. An open-source rules engine handles the rules, so nobody has to argue about them. Works on phones too.",
      chips: ["java", "react", "typescript", "websockets"],
      photo: "Screenshot: a 4-player game", file: "rules-of-99/four-players.png",
      href: "project.html"
    },
    {
      id: "finds", no: "03",
      title: "2nd-hand finds",
      line: "A tool that keeps an eye on Marktplaats and Vinted for me.",
      story: "Every two hours it checks for things I’m looking for, like Magic card collections or cheap mini PCs, and uses AI to filter out the noise. The good ones arrive in a short email.",
      chips: ["python", "claude", "astro"],
      photo: "Screenshot: the finds overview", file: "finds/overview.png",
      href: "project.html"
    },
    {
      id: "quizmaster", no: "04",
      title: "Quizmaster",
      line: "A live party quiz with questions generated on the spot.",
      story: "Everyone joins on their phone, picks a theme, and the questions are made up as you play. Built for one birthday, used at every party since.",
      chips: [], /* [CONFIRM stack] */
      photo: "Screenshot: the quiz on a phone", file: "quizmaster/on-a-phone.png",
      href: "project.html"
    },
    {
      id: "scryfall", no: "05",
      title: "Scryfall, in plain words",
      line: "Search Magic cards by describing what you want.",
      story: "Type “cheap green cards that ramp” and it turns that into a proper Scryfall search, checks that it returns results, and sends you there.",
      chips: ["claude", "typescript"],
      photo: "Screenshot: search box + results", file: "scryfall/search.png",
      href: "project.html"
    }
  ];

  // Grid slot ratios repeat every four; a lone trailing item spans wide.
  var SLOT = ["3:2", "4:5", "1:1", "4:3"];
  function slotRatio(i, n) {
    if (i === n - 1 && (i % 4 === 0 || i % 4 === 2)) return "21:9";
    return SLOT[i % 4];
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function vars(p) { return "--p: var(--tone-" + p.id + "); --p-ink: var(--pink-" + p.id + ")"; }
  function chipsHTML(p) {
    if (!p.chips.length) return "";
    return '<ul class="chips" aria-label="Built with">' + p.chips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
  }
  function photoHTML(p) {
    return '<div class="ph" style="--tone: var(--tone-' + p.id + ')" role="img" aria-label="' + esc(p.photo) + '">' +
      '<div class="ph__inner"></div><span class="ph__label" aria-hidden="true"><span class="ph__no">' + p.no + "</span>" + esc(p.photo) + "</span></div>";
  }
  function metaHTML(p, ratio) {
    return '<p class="meta">fig.' + p.no + " — " + esc(p.file) + " · " + ratio + "</p>";
  }

  function featuredHTML(p) {
    return '<article class="page feature" id="p-' + p.id + '" data-project="' + p.id + '" style="' + vars(p) + '" aria-labelledby="feature-title">' +
      '<a class="feature__media" href="' + p.href + '" tabindex="-1" aria-hidden="true">' + photoHTML(p) + "</a>" +
      '<div class="feature__head">' +
        '<div class="feature__kicker"><p class="eyebrow"><span class="feature__dot" aria-hidden="true"></span><span data-copy="projects.featured">Featured</span></p>' + metaHTML(p, "16:9") + "</div>" +
        '<h3 class="feature__title display" id="feature-title"><a href="' + p.href + '">' + esc(p.title) + "</a></h3>" +
        '<p class="feature__line">' + esc(p.line) + "</p>" +
      "</div>" +
      '<div class="feature__story">' +
        "<p>" + esc(p.story) + "</p>" +
        chipsHTML(p) +
        '<p><a class="arrow-link" href="' + p.href + '">Read about ' + esc(p.title) + ' <span aria-hidden="true">→</span></a></p>' +
      "</div>" +
    "</article>";
  }

  function itemHTML(p, i, n) {
    return '<li class="item" id="p-' + p.id + '" data-project="' + p.id + '" style="' + vars(p) + '">' +
      '<a class="item__media" href="' + p.href + '" tabindex="-1" aria-hidden="true">' + photoHTML(p) + "</a>" +
      '<div class="item__caption">' +
        metaHTML(p, slotRatio(i, n)) +
        '<h3 class="item__title"><a href="' + p.href + '">' + esc(p.title) + "</a></h3>" +
        '<p class="item__line">' + esc(p.line) + "</p>" +
        chipsHTML(p) +
      "</div>" +
    "</li>";
  }

  function indexHTML(f) {
    return PROJECTS.map(function (p) {
      return '<li data-project="' + p.id + '" style="' + vars(p) + '"><a href="#p-' + p.id + '">' +
        '<span class="index__no">' + p.no + "</span>" +
        '<span class="index__title">' + esc(p.title) + "</span>" +
        '<span class="index__mark">' + (p === f ? "↑ featured" : "") + "</span></a></li>";
    }).join("");
  }

  function render(featuredId) {
    var f = PROJECTS.filter(function (p) { return p.id === featuredId; })[0] || PROJECTS[0];
    var rest = PROJECTS.filter(function (p) { return p !== f; });
    return {
      featured: featuredHTML(f),
      grid: rest.map(function (p, i) { return itemHTML(p, i, rest.length); }).join(""),
      index: indexHTML(f)
    };
  }

  function pickId() {
    var wanted = null;
    try { wanted = new URLSearchParams(location.search).get("featured"); } catch (e) {}
    var ids = PROJECTS.map(function (p) { return p.id; });
    if (wanted && ids.indexOf(wanted) !== -1) return wanted;
    return ids[Math.floor(Math.random() * ids.length)];
  }

  var api = { PROJECTS: PROJECTS, render: render };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.BeeldProjects = api;

  var slot = document.getElementById("featured-slot");
  var grid = document.getElementById("project-grid");
  var index = document.getElementById("project-index");
  if (!slot || !grid) return;

  var id = pickId();
  if (slot.getAttribute("data-current") !== id) {
    var out = render(id);
    slot.innerHTML = out.featured;
    grid.innerHTML = out.grid;
    if (index) index.innerHTML = out.index;
    slot.setAttribute("data-current", id);
  }

  // Two-way highlight between index lines and images
  function hot(pid) {
    var items = document.querySelectorAll("[data-project]");
    Array.prototype.forEach.call(items, function (el) { el.classList.toggle("is-hot", !!pid && el.getAttribute("data-project") === pid); });
    var inGrid = !!pid && !!grid.querySelector('[data-project="' + pid + '"]');
    grid.classList.toggle("has-hot", inGrid);
  }
  function from(e) {
    var el = e.target.closest && e.target.closest("[data-project]");
    return el ? el.getAttribute("data-project") : null;
  }
  [index, grid].forEach(function (zone) {
    if (!zone) return;
    zone.addEventListener("mouseover", function (e) { hot(from(e)); });
    zone.addEventListener("mouseleave", function () { hot(null); });
    zone.addEventListener("focusin", function (e) { hot(from(e)); });
    zone.addEventListener("focusout", function () { hot(null); });
  });
})(this);
